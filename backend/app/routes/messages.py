from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from urllib.parse import unquote
import uuid

from app.db import messages_table, room_members_table
from app.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/messages", tags=["Messages"])


class MessageCreate(BaseModel):
    sender_id: str
    content: str
    sender_name: Optional[str] = None
    type: str = "text"
    reply_to: Optional[str] = None  # sortKey of parent message
    reply_preview: Optional[str] = None  # preview text of parent


class MessageEdit(BaseModel):
    content: str


class ReactionToggle(BaseModel):
    user_id: str
    emoji: str


# ─── GET /api/messages/{room_id} ── Get messages (paginated, newest first) ──
@router.get("/{room_id}")
def get_messages(room_id: str, limit: int = 50, cursor: Optional[str] = None):
    import json

    params: dict = {
        "KeyConditionExpression": "roomId = :rid",
        "ExpressionAttributeValues": {":rid": room_id},
        "ScanIndexForward": False,
        "Limit": limit,
    }
    if cursor:
        params["ExclusiveStartKey"] = json.loads(unquote(cursor))

    result = messages_table.query(**params)
    items = result.get("Items", [])

    next_cursor = None
    if "LastEvaluatedKey" in result:
        from urllib.parse import quote

        next_cursor = quote(json.dumps(result["LastEvaluatedKey"]))

    return {
        "messages": items,
        "cursor": next_cursor,
        "has_more": "LastEvaluatedKey" in result,
    }


# ─── POST /api/messages/{room_id} ── Send a message ─────────────────────────
@router.post("/{room_id}", status_code=201)
def send_message(room_id: str, body: MessageCreate, user: dict = Depends(get_current_user)):
    # Use authenticated user ID if available, fall back to body.sender_id
    sender_id = user.get("sub") if user.get("sub") != "anonymous" else body.sender_id

    # Check if user is muted
    membership = room_members_table.get_item(
        Key={"roomId": room_id, "userId": sender_id}
    ).get("Item")
    if membership and membership.get("mutedUntil"):
        muted_until = membership["mutedUntil"]
        if muted_until > datetime.now(timezone.utc).isoformat():
            raise HTTPException(status_code=403, detail=f"You are muted until {muted_until}")

    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    sort_key = f"{now}#{message_id}"

    item = {
        "roomId": room_id,
        "sortKey": sort_key,
        "messageId": message_id,
        "senderId": sender_id,
        "senderName": body.sender_name,
        "content": body.content,
        "type": body.type,
        "createdAt": now,
        "editedAt": None,
        "reactions": {},
    }
    if body.reply_to:
        item["replyTo"] = body.reply_to
    if body.reply_preview:
        item["replyPreview"] = body.reply_preview
    messages_table.put_item(Item=item)

    # Publish to SSE subscribers
    from app.routes.sse import publish
    publish(room_id, "new_message", item)

    return {"message": item}


# ─── PUT /api/messages/{room_id}/{sort_key} ── Edit a message ────────────────
@router.put("/{room_id}/{sort_key}")
def edit_message(room_id: str, sort_key: str, body: MessageEdit):
    decoded_key = unquote(sort_key)
    now = datetime.now(timezone.utc).isoformat()

    try:
        result = messages_table.update_item(
            Key={"roomId": room_id, "sortKey": decoded_key},
            UpdateExpression="SET content = :content, editedAt = :now",
            ExpressionAttributeValues={":content": body.content, ":now": now},
            ReturnValues="ALL_NEW",
        )
        # Broadcast edit via SSE
        from app.routes.sse import publish
        publish(room_id, "message_edited", result["Attributes"])

        return {"message": result["Attributes"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── DELETE /api/messages/{room_id}/{sort_key} ── Delete a message ───────────
@router.delete("/{room_id}/{sort_key}")
def delete_message(room_id: str, sort_key: str, user: dict = Depends(get_current_user)):
    decoded_key = unquote(sort_key)
    messages_table.delete_item(Key={"roomId": room_id, "sortKey": decoded_key})

    # Broadcast deletion via SSE so all clients remove the message
    from app.routes.sse import publish
    publish(room_id, "message_deleted", {"roomId": room_id, "sortKey": decoded_key})

    return {"message": "Message deleted"}


# ─── POST /api/messages/{room_id}/{sort_key}/reactions ── Toggle reaction ────
@router.post("/{room_id}/{sort_key}/reactions")
def toggle_reaction(room_id: str, sort_key: str, body: ReactionToggle):
    decoded_key = unquote(sort_key)

    # Get current message
    result = messages_table.get_item(Key={"roomId": room_id, "sortKey": decoded_key})
    item = result.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Message not found")

    reactions = item.get("reactions") or {}
    emoji_users = list(reactions.get(body.emoji, []))

    if body.user_id in emoji_users:
        emoji_users.remove(body.user_id)
    else:
        emoji_users.append(body.user_id)

    if emoji_users:
        reactions[body.emoji] = emoji_users
    else:
        reactions.pop(body.emoji, None)

    messages_table.update_item(
        Key={"roomId": room_id, "sortKey": decoded_key},
        UpdateExpression="SET reactions = :r",
        ExpressionAttributeValues={":r": reactions if reactions else {}},
    )

    # Broadcast via SSE
    from app.routes.sse import publish
    publish(room_id, "reaction_update", {
        "sortKey": decoded_key,
        "messageId": item.get("messageId"),
        "reactions": reactions,
    })

    return {"reactions": reactions}


# ─── GET /api/messages/by-sender/{sender_id} ── Messages by user (GSI) ──────
@router.get("/by-sender/{sender_id}")
def messages_by_sender(sender_id: str, limit: int = 50):
    result = messages_table.query(
        IndexName="senderId-index",
        KeyConditionExpression="senderId = :sid",
        ExpressionAttributeValues={":sid": sender_id},
        ScanIndexForward=False,
        Limit=limit,
    )
    return {"messages": result.get("Items", [])}
