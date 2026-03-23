# Connections Table

**Table**: `chatroom-dev-connections`

## Schema

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| `connectionId` | String | PK | UUID per connection |
| `userId` | String | GSI (`userId-index`) | Who is connected |
| `roomId` | String | GSI (`roomId-index`) | Which room |
| `connectedAt` | String (ISO) | — | First connection timestamp |
| `lastSeenAt` | String (ISO) | — | Last heartbeat timestamp (TTL basis) |

## Purpose

Tracks **active connections** for [presence](https://en.wikipedia.org/wiki/Presence_information). Used to:
1. Show "active users in room" in the members panel (green/gray dots)
2. Track who's online/offline
3. Auto-garbage-collect stale connections (60s TTL)

## API Endpoints (6)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/connections/room/{room_id}` | Active users in room (filters out stale, auto-deletes expired) |
| GET | `/api/connections/user/{user_id}` | User's active connections |
| POST | `/api/connections/` | Register/upsert connection (if user+room exists, refreshes `lastSeenAt`) |
| POST | `/api/connections/heartbeat` | Keep-alive — refreshes `lastSeenAt`, creates if missing |
| DELETE | `/api/connections/{connection_id}` | Remove by ID |
| DELETE | `/api/connections/user/{user_id}/room/{room_id}` | Remove all connections for user in room |

## Presence Lifecycle

```
1. User opens room → POST /api/connections/ (upsert)
2. Every 10s → POST /api/connections/heartbeat (refreshes lastSeenAt)
3. Other users query → GET /api/connections/room/{id}
   → Backend filters: only items where lastSeenAt < 60s ago
   → Stale items auto-deleted (garbage collection on read)
4. User closes tab → no more heartbeats → connection expires after 60s
```

## TTL Logic

```python
CONNECTION_TTL_SECONDS = 60

def _is_alive(item):
    last_seen = item.get("lastSeenAt") or item.get("connectedAt")
    age = (now - parse(last_seen)).total_seconds()
    return age < CONNECTION_TTL_SECONDS
```

No DynamoDB TTL feature used — garbage collection happens on read in the GET endpoint.

## Related
- [[data-model/Tables Overview]]
- [[backend/Real-time]]
- [[backend/API Reference]]
