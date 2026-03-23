# Real-time Messaging

Two transport layers for real-time: **SSE** (primary for production) and **WebSocket** (local dev only).

> [!warning] Production uses SSE only
> AWS App Runner doesn't support WebSocket upgrades. The WebSocket endpoint (`/ws/`) exists in the code but only works when running locally. In production, all real-time is SSE.

## Why Two Transports?

AWS App Runner **doesn't support WebSocket upgrades**. So in production we use SSE (Server-Sent Events), which works over plain HTTP. WebSocket is available for local development.

## SSE (Server-Sent Events)

**Endpoint**: `GET /api/sse/{room_id}`

### How It Works

```
Client A ──EventSource──→ /api/sse/room-123
Client B ──EventSource──→ /api/sse/room-123

Client C ──POST──→ /api/messages/room-123
                      │
                      ├── Save to DynamoDB
                      └── publish("room-123", "new_message", item)
                              │
                              ├── Queue → Client A
                              └── Queue → Client B
```

### Server-Side (sse.py)

```python
# In-memory channel subscribers
_channels: Dict[str, Set[asyncio.Queue]] = {}

def publish(room_id, event_type, data):
    """Broadcast to all SSE subscribers in a room."""
    payload = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
    for queue in _channels[room_id]:
        queue.put_nowait(payload)
```

- Each subscriber gets an `asyncio.Queue` (max 100 events)
- Keepalive sent every 30 seconds (`: keepalive\n\n`)
- Dead queues (full) are cleaned up on publish
- Cleanup on disconnect: removes queue from channel set

### Client-Side (chat/page.tsx)

```typescript
const sse = api.connectSSE(activeRoomId);
sse.addEventListener("new_message", (event) => {
  const data = JSON.parse(event.data);
  // Deduplication: skip if same ID or same user+content within 5s
  setMessages(prev => {
    if (prev.some(m => m.id === msg.id)) return prev;
    const isDupe = prev.some(m =>
      m.user_id === msg.user_id &&
      m.content === msg.content &&
      Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 5000
    );
    if (isDupe) return prev;
    return [...prev, msg];
  });
});
```

### Events

| Event | Data | When |
|-------|------|------|
| `connected` | `{ room_id, timestamp }` | On subscribe |
| `new_message` | Full message object (incl. reactions, replyTo) | Message sent |
| `message_deleted` | `{ roomId, sortKey }` | Message deleted |
| `message_edited` | Full updated message object | Message edited |
| `typing` | `{ user_id, username, typers }` | User starts typing (5s expiry) |
| `stop_typing` | `{ user_id }` | User stops typing |
| `reaction_update` | `{ sortKey, messageId, reactions }` | Reaction toggled |
| `member_kicked` | `{ userId }` | Admin kicks a member |
| `member_muted` | `{ userId, mutedUntil }` | Admin mutes a member |
| `member_banned` | `{ userId }` | Admin bans a member |
| `user_left` | `{ userId, timestamp }` | WS disconnect |

### Typing Indicators (SSE)

```
POST /api/sse/{room_id}/typing   → { user_id, username }
POST /api/sse/{room_id}/stop_typing → { user_id, username }
```

The frontend sends typing on keypress, then auto-sends stop_typing after 3s of inactivity. The backend tracks typing state in-memory with 5s expiry and broadcasts to all subscribers.

## WebSocket (Local Dev)

**Endpoint**: `WS /ws/{room_id}/{user_id}`

### Message Types (Client → Server)

```json
{ "type": "message", "content": "Hello!", "msg_type": "text" }
{ "type": "typing" }
{ "type": "stop_typing" }
```

### Message Types (Server → Client)

```json
{ "type": "active_users", "users": ["user1", "user2"] }
{ "type": "new_message", "message": { ... } }
{ "type": "user_joined", "userId": "...", "timestamp": "..." }
{ "type": "user_left", "userId": "...", "timestamp": "..." }
{ "type": "typing", "userId": "..." }
{ "type": "stop_typing", "userId": "..." }
```

### Lifecycle

```
1. Client connects → accept()
2. Register in _rooms dict + DynamoDB connections table
3. Broadcast "user_joined" to room
4. Send "active_users" list to new client
5. Loop: receive messages, save to DB, broadcast
6. On disconnect → remove from _rooms, delete from DB, broadcast "user_left"
```

### Cross-Protocol Publishing

WebSocket messages **also publish to SSE**:
```python
# In ws.py message handler
messages_table.put_item(Item=item)
await broadcast(room_id, {"type": "new_message", "message": item})

# Also publish to SSE subscribers
from app.routes.sse import publish
publish(room_id, "new_message", item)
```

## Optimistic Updates

The frontend doesn't wait for SSE/WS confirmation:

```typescript
// Add message immediately
const optimistic = { id: tempId, content, user_id: user.id, ... };
setMessages(prev => [...prev, optimistic]);

// Then send to server
await api.sendMessage(activeRoomId, { sender_id: user.id, content });

// SSE will deliver the "real" message — deduplication prevents double-showing
```

## Presence System

### Connection Lifecycle

```
1. User enters room → POST /api/connections/ (upsert by user+room)
2. Every 10s → POST /api/connections/heartbeat (refresh lastSeenAt)
3. User leaves room → DELETE /api/connections/user/{uid}/room/{rid}
4. Backend queries filter by TTL (60s) — stale connections auto-garbage-collected
```

### Heartbeat + TTL

Connections have a `lastSeenAt` field. The backend considers connections alive only if `lastSeenAt` is within 60 seconds. Both web and mobile send heartbeats every 10 seconds via `POST /api/connections/heartbeat`.

When querying active users (`GET /api/connections/room/{room_id}`), the backend filters out stale connections and deletes them from DynamoDB (garbage collection on read).

### Real-time Presence Events

Both web and mobile listen for `user_joined`/`user_left` events for instant status updates:
- **Web**: SSE `user_joined`/`user_left` event listeners
- **Mobile**: WebSocket messages with `type: "user_joined"` / `type: "user_left"`

Polling every 10s acts as a fallback to catch missed events.

### Cleanup Endpoint

`DELETE /api/connections/user/{user_id}/room/{room_id}` removes all connections for a user in a room by querying the `roomId-index` GSI. This is more reliable than deleting by UUID (which requires knowing the connection ID).

## Related
- [[backend/API Reference]]
- [[frontend/Components]]
- [[mobile/API Client]]
- [[interview/Design Decisions]]
