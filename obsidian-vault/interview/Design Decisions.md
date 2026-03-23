

Every choice has a reason. Here's the "why" behind each decision.

## Why DynamoDB over PostgreSQL?

| DynamoDB | PostgreSQL |
|----------|-----------|
| Serverless, zero idle cost | Need to provision a server |
| Auto-scales reads/writes | Need to manage connection pools |
| PAY_PER_REQUEST = free at low usage | RDS minimum ~$15/month |
| Single-digit ms latency at any scale | Great at joins, but we don't need them |
| Natural fit for key-value chat data | Overkill relational features |

**Trade-off**: No JOINs. We work around this with:
- Member enrichment (N+1 query in members endpoint)
- Denormalizing senderName into messages

## Why FastAPI over Express/Django?

| FastAPI | Alternative |
|---------|-----------|
| Auto-generates Swagger docs | Express: manual API docs |
| Async-native (important for SSE) | Django: sync by default |
| Pydantic models = request validation | Express: need Zod/Joi |
| Python — readable in interview | — |

## Why SSE over WebSocket in Production?

| Factor | SSE | WebSocket |
|--------|-----|-----------|
| App Runner support | Works (plain HTTP) | **Not supported** (no upgrade) |
| Complexity | Simple (EventSource API) | Bi-directional, more complex |
| Reconnection | Built-in auto-reconnect | Manual reconnect logic |
| Limitation | Server → client only | Full duplex |

**Workaround**: Messages are sent via REST POST, received via SSE. WebSocket exists for local dev where it works.

## Why Clerk over Custom Auth?

| Clerk | Custom JWT |
|-------|-----------|
| 5 min to set up | Hours to build auth |
| Handles email/password, OAuth, MFA | Build each provider manually |
| Pre-built React components | Build login/signup UI |
| Session management, CSRF | Implement yourself |

**Trade-off**: Dependency on external service. Acceptable for a take-home.

## Why Optimistic Updates?

```
Without optimistic:
  Click Send → wait 200ms → message appears
  Feels: sluggish

With optimistic:
  Click Send → message appears instantly → server confirms in background
  Feels: instant
```

**Deduplication** prevents double-showing:
```typescript
// Skip if same user + same content within 5 seconds
const isDupe = prev.some(m =>
  m.user_id === msg.user_id &&
  m.content === msg.content &&
  Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 5000
);
```

## Why sortKey = timestamp#messageId?

```
sortKey: "2026-03-23T21:40:03.691810+00:00#ba00a87d-e14f-4b18-a182-f8743405be39"
```

1. **ISO timestamps sort lexicographically** — DynamoDB sorts strings, so time-order works
2. **UUID suffix prevents collisions** — two messages at the same millisecond get unique keys
3. **Efficient range queries** — can query "messages after X" using `sortKey > :timestamp`

Alternative: numeric timestamp. But ISO is human-readable and works just as well.

## Why In-Memory Pub/Sub (not Redis)?

For SSE/WebSocket, we use in-memory dictionaries:
```python
_channels: Dict[str, Set[asyncio.Queue]] = {}  # SSE
_rooms: Dict[str, Set[tuple]] = {}              # WebSocket
```

**Why not Redis Pub/Sub?**
- Single App Runner instance → in-memory works fine
- No cross-instance communication needed (yet)
- Adds infrastructure complexity for a take-home

**When to switch to Redis**: Multiple backend instances behind a load balancer.

## Why Member Enrichment Instead of Denormalization?

**Option A** (what we do): Store only userId in room_members, join with users table on read
**Option B** (denormalize): Store username + avatar in room_members too

We chose A because:
- Usernames can change — denormalized copies go stale
- Avatar URLs change — same problem
- N+1 query cost is small for rooms with < 100 members
- DynamoDB batch-get could optimize this if needed

## Why Three-Panel Layout?

Discord's design is proven for chat apps:
- **Left sidebar** (260px): Navigation (room selection)
- **Center** (flex): Content (messages)
- **Right sidebar** (240px): Context (who's here)

This matches users' mental model from Discord/Slack. The right panel is toggleable to give more space on small screens.

## Related
- [[interview/Talking Points]]
- [[interview/Hot Partition Problem]]
- [[architecture/Overview]]
