from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.db import users_table

router = APIRouter(prefix="/api/users", tags=["Users"])


class UserCreate(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None


# ─── GET /api/users ── List all users ────────────────────────────────────────
@router.get("/")
def list_users():
    result = users_table.scan()
    users = result.get("Items", [])
    for u in users:
        u.pop("passwordHash", None)
    return {"users": users}


# ─── GET /api/users/{user_id} ── Get user by ID ─────────────────────────────
@router.get("/{user_id}")
def get_user(user_id: str):
    result = users_table.get_item(Key={"userId": user_id})
    item = result.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="User not found")
    item.pop("passwordHash", None)
    return {"user": item}


# ─── POST /api/users ── Create a user ───────────────────────────────────────
@router.post("/", status_code=201)
def create_user(body: UserCreate):
    now = datetime.now(timezone.utc).isoformat()
    user_id = body.id or str(uuid.uuid4())

    # Upsert: if user already exists, just update
    existing = users_table.get_item(Key={"userId": user_id}).get("Item")
    if existing:
        users_table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET username = :u, avatarUrl = :a, updatedAt = :now",
            ExpressionAttributeValues={
                ":u": body.username,
                ":a": body.avatar_url,
                ":now": now,
            },
        )
        existing.update({"username": body.username, "avatarUrl": body.avatar_url, "updatedAt": now})
        return {"user": existing}

    item = {
        "userId": user_id,
        "username": body.username,
        "email": body.email,
        "avatarUrl": body.avatar_url,
        "createdAt": now,
        "updatedAt": now,
    }
    users_table.put_item(Item=item)
    return {"user": item}


# ─── PUT /api/users/{user_id} ── Update user ────────────────────────────────
@router.put("/{user_id}")
def update_user(user_id: str, body: UserUpdate):
    now = datetime.now(timezone.utc).isoformat()
    update_parts = ["updatedAt = :now"]
    values: dict = {":now": now}
    names: dict = {}

    if body.username is not None:
        update_parts.append("#u = :username")
        values[":username"] = body.username
        names["#u"] = "username"
    if body.avatar_url is not None:
        update_parts.append("avatarUrl = :avatar")
        values[":avatar"] = body.avatar_url

    result = users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression="SET " + ", ".join(update_parts),
        ExpressionAttributeValues=values,
        ExpressionAttributeNames=names if names else None,
        ReturnValues="ALL_NEW",
    )
    return {"user": result["Attributes"]}


# ─── DELETE /api/users/{user_id} ── Delete user ─────────────────────────────
@router.delete("/{user_id}")
def delete_user(user_id: str):
    users_table.delete_item(Key={"userId": user_id})
    return {"message": "User deleted"}


# ─── GET /api/users/by-email/{email} ── Lookup by email (GSI) ───────────────
@router.get("/by-email/{email}")
def get_user_by_email(email: str):
    result = users_table.query(
        IndexName="email-index",
        KeyConditionExpression="email = :email",
        ExpressionAttributeValues={":email": email},
    )
    items = result.get("Items", [])
    for u in items:
        u.pop("passwordHash", None)
    return {"user": items[0] if items else None}


# ─── GET /api/users/by-username/{username} ── Lookup by username (GSI) ───────
@router.get("/by-username/{username}")
def get_user_by_username(username: str):
    result = users_table.query(
        IndexName="username-index",
        KeyConditionExpression="username = :uname",
        ExpressionAttributeValues={":uname": username},
    )
    items = result.get("Items", [])
    for u in items:
        u.pop("passwordHash", None)
    return {"user": items[0] if items else None}
