from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid

from app.db import connections_table

router = APIRouter(prefix="/api/connections", tags=["Connections"])


class ConnectionCreate(BaseModel):
    user_id: str
    room_id: str


# ─── GET /api/connections/room/{room_id} ── Active users in room (GSI) ──────
@router.get("/room/{room_id}")
def room_connections(room_id: str):
    result = connections_table.query(
        IndexName="roomId-index",
        KeyConditionExpression="roomId = :rid",
        ExpressionAttributeValues={":rid": room_id},
    )
    return {"connections": result.get("Items", [])}


# ─── GET /api/connections/user/{user_id} ── User's connections (GSI) ────────
@router.get("/user/{user_id}")
def user_connections(user_id: str):
    result = connections_table.query(
        IndexName="userId-index",
        KeyConditionExpression="userId = :uid",
        ExpressionAttributeValues={":uid": user_id},
    )
    return {"connections": result.get("Items", [])}


# ─── POST /api/connections ── Register a connection ─────────────────────────
@router.post("/", status_code=201)
def create_connection(body: ConnectionCreate):
    connection = {
        "connectionId": str(uuid.uuid4()),
        "userId": body.user_id,
        "roomId": body.room_id,
        "connectedAt": datetime.now(timezone.utc).isoformat(),
    }
    connections_table.put_item(Item=connection)
    return {"connection": connection}


# ─── DELETE /api/connections/{connection_id} ── Remove a connection ──────────
@router.delete("/{connection_id}")
def delete_connection(connection_id: str):
    connections_table.delete_item(Key={"connectionId": connection_id})
    return {"message": "Connection removed"}
