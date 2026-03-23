import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set

from app.db import messages_table, connections_table

router = APIRouter(tags=["WebSocket - Real-time"])

# In-memory: room_id -> set of (websocket, user_id)
_rooms: Dict[str, Set[tuple]] = {}


async def broadcast(room_id: str, event: dict, exclude_ws: WebSocket = None):
    """Broadcast a message to all WebSocket clients in a room."""
    if room_id not in _rooms:
        return
    payload = json.dumps(event, default=str)
    dead = set()
    for ws, uid in _rooms[room_id]:
        if ws == exclude_ws:
            continue
        try:
            await ws.send_text(payload)
        except Exception:
            dead.add((ws, uid))
    _rooms[room_id] -= dead


# ─── WS /ws/{room_id}/{user_id} ── Real-time chat via WebSocket ─────────────
@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_chat(websocket: WebSocket, room_id: str, user_id: str):
    await websocket.accept()

    # Register connection
    if room_id not in _rooms:
        _rooms[room_id] = set()
    conn = (websocket, user_id)
    _rooms[room_id].add(conn)

    # Track in DynamoDB
    connection_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    connections_table.put_item(
        Item={
            "connectionId": connection_id,
            "userId": user_id,
            "roomId": room_id,
            "connectedAt": now,
        }
    )

    # Broadcast user joined
    await broadcast(
        room_id,
        {"type": "user_joined", "userId": user_id, "timestamp": now},
        exclude_ws=websocket,
    )

    # Send current active users to the newly connected client
    active_users = [uid for _, uid in _rooms.get(room_id, set())]
    await websocket.send_text(
        json.dumps({"type": "active_users", "users": active_users})
    )

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("type") == "message":
                message_id = str(uuid.uuid4())
                ts = datetime.now(timezone.utc).isoformat()
                sort_key = f"{ts}#{message_id}"

                item = {
                    "roomId": room_id,
                    "sortKey": sort_key,
                    "messageId": message_id,
                    "senderId": user_id,
                    "content": msg.get("content", ""),
                    "type": msg.get("msg_type", "text"),
                    "createdAt": ts,
                    "editedAt": None,
                }
                messages_table.put_item(Item=item)

                # Broadcast to all in room (including sender for confirmation)
                await broadcast(
                    room_id,
                    {"type": "new_message", "message": item},
                )

                # Also publish to SSE
                from app.routes.sse import publish

                publish(room_id, "new_message", item)

            elif msg.get("type") == "typing":
                await broadcast(
                    room_id,
                    {"type": "typing", "userId": user_id},
                    exclude_ws=websocket,
                )

            elif msg.get("type") == "stop_typing":
                await broadcast(
                    room_id,
                    {"type": "stop_typing", "userId": user_id},
                    exclude_ws=websocket,
                )

    except WebSocketDisconnect:
        pass
    finally:
        _rooms.get(room_id, set()).discard(conn)
        if room_id in _rooms and not _rooms[room_id]:
            del _rooms[room_id]

        # Remove from DynamoDB
        connections_table.delete_item(Key={"connectionId": connection_id})

        # Broadcast user left
        left_ts = datetime.now(timezone.utc).isoformat()
        await broadcast(
            room_id,
            {"type": "user_left", "userId": user_id, "timestamp": left_ts},
        )
        from app.routes.sse import publish

        publish(room_id, "user_left", {"userId": user_id, "timestamp": left_ts})
