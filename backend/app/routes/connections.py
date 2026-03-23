import time

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid

from app.db import connections_table

router = APIRouter(prefix="/api/connections", tags=["Connections"])

# Connections older than this (seconds) are considered stale
CONNECTION_TTL_SECONDS = 60


class ConnectionCreate(BaseModel):
    user_id: str
    room_id: str


def _is_alive(item: dict) -> bool:
    """Return True if the connection was refreshed within TTL window."""
    last_seen = item.get("lastSeenAt") or item.get("connectedAt", "")
    if not last_seen:
        return False
    try:
        ts = datetime.fromisoformat(last_seen)
        age = (datetime.now(timezone.utc) - ts).total_seconds()
        return age < CONNECTION_TTL_SECONDS
    except Exception:
        return False


# ─── GET /api/connections/room/{room_id} ── Active users in room (GSI) ──────
@router.get("/room/{room_id}")
def room_connections(room_id: str):
    result = connections_table.query(
        IndexName="roomId-index",
        KeyConditionExpression="roomId = :rid",
        ExpressionAttributeValues={":rid": room_id},
    )
    items = result.get("Items", [])
    # Filter out stale connections and clean them up
    alive = []
    for item in items:
        if _is_alive(item):
            alive.append(item)
        else:
            # Garbage-collect stale connection
            connections_table.delete_item(Key={"connectionId": item["connectionId"]})
    return {"connections": alive}


# ─── GET /api/connections/user/{user_id} ── User's connections (GSI) ────────
@router.get("/user/{user_id}")
def user_connections(user_id: str):
    result = connections_table.query(
        IndexName="userId-index",
        KeyConditionExpression="userId = :uid",
        ExpressionAttributeValues={":uid": user_id},
    )
    return {"connections": result.get("Items", [])}


# ─── POST /api/connections ── Register a connection (upsert by user+room) ───
@router.post("/", status_code=201)
def create_connection(body: ConnectionCreate):
    now = datetime.now(timezone.utc).isoformat()

    # Check if this user already has a connection in this room — upsert it
    existing = connections_table.query(
        IndexName="roomId-index",
        KeyConditionExpression="roomId = :rid",
        ExpressionAttributeValues={":rid": body.room_id},
    ).get("Items", [])
    for item in existing:
        if item.get("userId") == body.user_id:
            # Refresh the existing connection
            connections_table.update_item(
                Key={"connectionId": item["connectionId"]},
                UpdateExpression="SET lastSeenAt = :now",
                ExpressionAttributeValues={":now": now},
            )
            return {"connection": {**item, "lastSeenAt": now}}

    connection = {
        "connectionId": str(uuid.uuid4()),
        "userId": body.user_id,
        "roomId": body.room_id,
        "connectedAt": now,
        "lastSeenAt": now,
    }
    connections_table.put_item(Item=connection)
    return {"connection": connection}


# ─── POST /api/connections/heartbeat ── Keep connection alive ────────────────
@router.post("/heartbeat")
def heartbeat(body: ConnectionCreate):
    """Refresh lastSeenAt for a user's connection in a room."""
    now = datetime.now(timezone.utc).isoformat()
    existing = connections_table.query(
        IndexName="roomId-index",
        KeyConditionExpression="roomId = :rid",
        ExpressionAttributeValues={":rid": body.room_id},
    ).get("Items", [])
    for item in existing:
        if item.get("userId") == body.user_id:
            connections_table.update_item(
                Key={"connectionId": item["connectionId"]},
                UpdateExpression="SET lastSeenAt = :now",
                ExpressionAttributeValues={":now": now},
            )
            return {"ok": True}
    # No existing connection — create one
    return create_connection(body)


# ─── DELETE /api/connections/{connection_id} ── Remove by ID ─────────────────
@router.delete("/{connection_id}")
def delete_connection(connection_id: str):
    connections_table.delete_item(Key={"connectionId": connection_id})
    return {"message": "Connection removed"}


# ─── DELETE /api/connections/user/{user_id}/room/{room_id} ── Remove by user+room
@router.delete("/user/{user_id}/room/{room_id}")
def delete_user_room_connection(user_id: str, room_id: str):
    """Remove all connections for a user in a specific room."""
    existing = connections_table.query(
        IndexName="roomId-index",
        KeyConditionExpression="roomId = :rid",
        ExpressionAttributeValues={":rid": room_id},
    ).get("Items", [])
    removed = 0
    for item in existing:
        if item.get("userId") == user_id:
            connections_table.delete_item(Key={"connectionId": item["connectionId"]})
            removed += 1
    return {"message": f"Removed {removed} connection(s)"}
