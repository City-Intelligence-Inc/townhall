# Room Members Table

**Table**: `chatroom-dev-room-members`

## Schema

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| `roomId` | String | PK | Room reference |
| `userId` | String | SK | User reference |
| `role` | String | — | "admin" or "member" |
| `joinedAt` | String (ISO) | — | When they joined |
| `lastReadAt` | String (ISO) | — | Last read timestamp (for unread) |

**GSI**: `userId-index` (PK: userId, SK: roomId) — find all rooms a user belongs to

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/members/{room_id}` | List members (enriched with user data) |
| GET | `/api/members/user/{user_id}` | GSI: user's rooms |
| POST | `/api/members/{room_id}/join` | Join a room |
| DELETE | `/api/members/{room_id}/leave/{user_id}` | Leave a room |
| DELETE | `/api/members/{room_id}/kick/{user_id}` | Admin kick |

## Member Enrichment

The GET endpoint **joins with the users table** to add username and avatar:

```python
for m in members:
    user = users_table.get_item(Key={"userId": m["userId"]}).get("Item")
    if user:
        m["username"] = user.get("username", m["userId"])
        m["avatarUrl"] = user.get("avatarUrl")
```

> [!note] Performance
> This is an N+1 query pattern. At scale, you'd batch-get users or cache in Redis. For this take-home it's fine.

## Related
- [[data-model/Tables Overview]]
- [[data-model/Users Table]]
- [[data-model/Chat Rooms Table]]
