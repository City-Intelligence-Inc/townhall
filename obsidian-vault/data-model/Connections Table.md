# Connections Table

**Table**: `chatroom-dev-connections`

## Schema

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| `connectionId` | String | PK | UUID per connection |
| `userId` | String | GSI (`userId-index`) | Who is connected |
| `roomId` | String | GSI (`roomId-index`) | Which room |
| `connectedAt` | String (ISO) | — | Connection timestamp |

## Purpose

Tracks **active WebSocket/SSE connections** for presence. Used to:
1. Show "active users in room" in the members panel
2. Track who's online/offline
3. Clean up stale connections

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/connections/room/{room_id}` | Active users in room |
| GET | `/api/connections/user/{user_id}` | User's active connections |
| POST | `/api/connections/` | Register new connection |
| DELETE | `/api/connections/{connection_id}` | Remove connection |

## Lifecycle

In the WebSocket handler (`ws.py`):
```
Connect  → put_item (register)
           broadcast "user_joined"

Disconnect → delete_item (unregister)
             broadcast "user_left"
```

## Related
- [[data-model/Tables Overview]]
- [[backend/Real-time]]
