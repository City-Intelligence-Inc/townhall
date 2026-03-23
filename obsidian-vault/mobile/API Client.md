# Mobile API Client

**File**: `mobile-app/src/services/api.ts`

## Architecture

The mobile API client mirrors the web frontend's `lib/api.ts` pattern:

1. **Token provider** — `setTokenProvider(getToken)` injects Clerk JWT into all requests
2. **Central `apiFetch()`** — All requests go through a single function that attaches auth headers
3. **Same endpoints** — Calls the same backend REST API as the web app

## Token Management

```typescript
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenProvider(fn: () => Promise<string | null>) {
  _getToken = fn;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const headers = { 'Content-Type': 'application/json' };
  if (_getToken) {
    const token = await _getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}
```

## Functions

| Function | Method | Path | Notes |
|----------|--------|------|-------|
| `getRooms()` | GET | `/api/rooms/` | |
| `createRoom(name, desc)` | POST | `/api/rooms/` | |
| `getMessages(roomId)` | GET | `/api/messages/{roomId}` | |
| `sendMessage(roomId, userId, username, content, avatarUrl?)` | POST | `/api/messages/{roomId}` | Sends `sender_id`/`sender_name` |
| `getMembers(roomId)` | GET | `/api/members/{roomId}` | |
| `joinRoom(roomId, userId, username)` | POST | `/api/members/{roomId}/join` | |
| `syncUser(userId, username, email, avatarUrl?)` | POST | `/api/users/` | Sends `id`/`email` (required) |
| `registerConnection(roomId, userId)` | POST | `/api/connections/` | |
| `removeConnection(connectionId)` | DELETE | `/api/connections/{id}` | |
| `connectWebSocket(roomId, userId, onMessage)` | WS | `/ws/{roomId}/{userId}` | Real-time messages |

## Web vs Mobile Parity

| Aspect | Web (`lib/api.ts`) | Mobile (`services/api.ts`) |
|--------|-------------------|--------------------------|
| Auth tokens | `setTokenProvider(getToken)` | `setTokenProvider(getToken)` |
| User sync fields | `{ id, username, email, avatar_url }` | `{ id, username, email, avatar_url }` |
| Message fields | `{ sender_id, sender_name, content }` | `{ sender_id, sender_name, content }` |
| Real-time | SSE (`EventSource`) | WebSocket |
| Extra features | Search, typing, reactions, edit, delete | Basic CRUD only |

## Mobile-Only Gaps (not yet implemented)

- No search endpoint call
- No typing indicator calls
- No message edit/delete calls
- No reaction toggle calls
- No read receipt calls
- No SSE connection (uses WebSocket instead)

## Related
- [[frontend/API Client]] (web equivalent)
- [[mobile/Auth]]
- [[backend/API Reference]]
