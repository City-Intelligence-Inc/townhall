# API Client

**File**: `frontend/lib/api.ts`

The API client is the **normalization layer** between the frontend's field names and DynamoDB's camelCase responses.

## Configuration

```typescript
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
```

Production values (in `.env.local`):
- `NEXT_PUBLIC_API_URL=https://9rjvhfdkqt.us-west-2.awsapprunner.com`
- `NEXT_PUBLIC_WS_URL=wss://9rjvhfdkqt.us-west-2.awsapprunner.com`

## Field Normalization

The backend returns DynamoDB-style camelCase. The API client maps to frontend conventions:

| Backend (DynamoDB) | Frontend | Example |
|-------------------|----------|---------|
| `roomId` | `id` / `room_id` | `fd6d511d-...` |
| `userId` | `user_id` | Clerk ID |
| `senderId` | `sender_id` | Clerk ID |
| `senderName` | `sender_name` / `username` | "Sarah Chen" |
| `createdAt` | `created_at` | ISO timestamp |
| `sortKey` | `sort_key` | `{timestamp}#{uuid}` |
| `avatarUrl` | `avatar_url` | URL string |
| `createdBy` | `created_by` | Clerk ID |

## Functions

### Rooms
| Function | Method | Path |
|----------|--------|------|
| `listRooms()` | GET | `/api/rooms/` |
| `getRoom(id)` | GET | `/api/rooms/{id}` |
| `createRoom({name, description, created_by})` | POST | `/api/rooms/` |

### Members
| Function | Method | Path |
|----------|--------|------|
| `listMembers(roomId)` | GET | `/api/members/{roomId}` |
| `getUserRooms(userId)` | GET | `/api/members/user/{userId}` |
| `joinRoom(roomId, {user_id})` | POST | `/api/members/{roomId}/join` |
| `leaveRoom(roomId, userId)` | DELETE | `/api/members/{roomId}/leave/{userId}` |

### Messages
| Function | Method | Path |
|----------|--------|------|
| `listMessages(roomId, limit?, cursor?)` | GET | `/api/messages/{roomId}` — returns reactions, editedAt, replyTo fields |
| `sendMessage(roomId, {sender_id, content, reply_to?, reply_preview?})` | POST | `/api/messages/{roomId}` |
| `deleteMessage(roomId, sortKey)` | DELETE | `/api/messages/{roomId}/{sortKey}` |
| `editMessage(roomId, sortKey, content)` | PUT | `/api/messages/{roomId}/{sortKey}` |
| `toggleReaction(roomId, sortKey, {user_id, emoji})` | POST | `/api/messages/{roomId}/{sortKey}/reactions` |

### Users
| Function | Method | Path |
|----------|--------|------|
| `syncUser({id, username, email, avatar_url?})` | POST | `/api/users/` |
| `getUser(id)` | GET | `/api/users/{id}` |

### Connections
| Function | Method | Path |
|----------|--------|------|
| `getActiveUsers(roomId)` | GET | `/api/connections/room/{roomId}` |
| `registerConnection({id, user_id, room_id})` | POST | `/api/connections/` |
| `removeConnection(id)` | DELETE | `/api/connections/{id}` |

### Read Receipts
| Function | Method | Path |
|----------|--------|------|
| `markRead(roomId, userId)` | PATCH | `/api/members/{roomId}/read/{userId}` |
| `getReadStatus(roomId, userId)` | GET | `/api/members/{roomId}/read/{userId}` |

### Typing Indicators
| Function | Method | Path |
|----------|--------|------|
| `sendTyping(roomId, {user_id, username})` | POST | `/api/sse/{roomId}/typing` |
| `sendStopTyping(roomId, {user_id, username})` | POST | `/api/sse/{roomId}/stop_typing` |

### Search
| Function | Method | Path |
|----------|--------|------|
| `searchMessages(query, roomId?)` | GET | `/api/search/?q=...&room_id=...` |

### Real-time
| Function | Returns |
|----------|---------|
| `connectWebSocket(roomId, userId)` | `WebSocket` instance |
| `connectSSE(roomId)` | `EventSource` instance |

## Error Handling

```typescript
async function apiFetch(path, opts?) {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}
```

All callers use `.catch(() => {})` or try/catch for graceful degradation.

## Related
- [[backend/API Reference]]
- [[frontend/Components]]
- [[backend/Real-time]]
