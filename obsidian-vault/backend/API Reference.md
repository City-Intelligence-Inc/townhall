# API Reference

**Base URL**: `https://9rjvhfdkqt.us-west-2.awsapprunner.com`
**Swagger**: `https://9rjvhfdkqt.us-west-2.awsapprunner.com/docs`

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Returns `{ status: "ok", timestamp }` |

## Users (7 endpoints)

See: [[data-model/Users Table]]

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/users/` | — | `{ users: [...] }` |
| GET | `/api/users/{user_id}` | — | `{ user: {...} }` |
| POST | `/api/users/` | `{ id?, username, email, avatar_url? }` | `{ user: {...} }` (upsert) |
| PUT | `/api/users/{user_id}` | `{ username?, avatar_url? }` | `{ user: {...} }` |
| DELETE | `/api/users/{user_id}` | — | `{ message: "User deleted" }` |
| GET | `/api/users/by-email/{email}` | — | `{ user: {...} }` |
| GET | `/api/users/by-username/{name}` | — | `{ user: {...} }` |

## Rooms (7 endpoints)

See: [[data-model/Chat Rooms Table]]

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/rooms/` | — | `{ rooms: [...] }` |
| GET | `/api/rooms/{room_id}` | — | `{ room: {...} }` |
| POST | `/api/rooms/` | `{ name, description?, created_by }` | `{ room: {...} }` |
| PUT | `/api/rooms/{room_id}` | `{ name?, description? }` | `{ room: {...} }` |
| DELETE | `/api/rooms/{room_id}` | — | `{ message: "Room deleted" }` |
| GET | `/api/rooms/by-creator/{user_id}` | — | `{ rooms: [...] }` |

> POST auto-joins creator as admin in room_members.

## Members (9 endpoints)

See: [[data-model/Room Members Table]]

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/members/{room_id}` | — | `{ members: [...] }` (enriched) |
| GET | `/api/members/user/{user_id}` | — | `{ memberships: [...] }` |
| POST | `/api/members/{room_id}/join` | `{ user_id }` | `{ member: {...} }` |
| DELETE | `/api/members/{room_id}/leave/{user_id}` | — | `{ message }` |
| PATCH | `/api/members/{room_id}/read/{user_id}` | — | `{ lastReadAt }` — mark room as read |
| GET | `/api/members/{room_id}/read/{user_id}` | — | `{ lastReadAt }` — get last read timestamp |
| DELETE | `/api/members/{room_id}/kick/{user_id}` | query: `admin_user_id` | `{ message }` |
| POST | `/api/members/{room_id}/mute/{user_id}` | `{ admin_user_id, duration_minutes? }` | `{ mutedUntil }` |
| POST | `/api/members/{room_id}/unmute/{user_id}` | query: `admin_user_id` | `{ message }` |
| POST | `/api/members/{room_id}/ban/{user_id}` | query: `admin_user_id` | `{ message }` |

## Messages (6 endpoints)

See: [[data-model/Messages Table]]

| Method | Path | Body / Params | Returns |
|--------|------|---------------|---------|
| GET | `/api/messages/{room_id}` | `?limit=50&cursor=...` | `{ messages, cursor, has_more }` |
| POST | `/api/messages/{room_id}` | `{ sender_id, content, sender_name?, type?, reply_to?, reply_preview? }` | `{ message: {...} }` |
| PUT | `/api/messages/{room_id}/{sort_key}` | `{ content }` | `{ message: {...} }` — broadcasts `message_edited` via SSE |
| DELETE | `/api/messages/{room_id}/{sort_key}` | — | `{ message: "deleted" }` — broadcasts `message_deleted` via SSE |
| POST | `/api/messages/{room_id}/{sort_key}/reactions` | `{ user_id, emoji }` | `{ reactions: {...} }` — toggle reaction, broadcasts `reaction_update` via SSE |
| GET | `/api/messages/by-sender/{sender_id}` | `?limit=50` | `{ messages: [...] }` |

> POST also publishes to SSE subscribers. See [[backend/Real-time]].
> Messages now include `reactions` (map of emoji→user_id[]), `replyTo`, `replyPreview` fields.

## Connections (4 endpoints)

See: [[data-model/Connections Table]]

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/connections/room/{room_id}` | — | `{ connections: [...] }` |
| GET | `/api/connections/user/{user_id}` | — | `{ connections: [...] }` |
| POST | `/api/connections/` | `{ user_id, room_id }` | `{ connection: {...} }` |
| DELETE | `/api/connections/{conn_id}` | — | `{ message }` |

## Uploads (2 endpoints)

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/uploads/` | Multipart file | `{ key, url }` (presigned S3 URL) |
| GET | `/api/uploads/{key}` | — | `{ key, url }` (presigned download URL) |

> Files uploaded to S3 bucket `chatroom-dev-uploads`. Presigned URLs expire in 1 hour.
> Frontend sends images as `![name](url)` and files as `[name](url)` in message content.

## Real-time (2 endpoints)

See: [[backend/Real-time]]

| Protocol | Path | Description |
|----------|------|-------------|
| SSE | `GET /api/sse/{room_id}` | Subscribe to room events |
| WebSocket | `WS /ws/{room_id}/{user_id}` | Full-duplex chat |

## Related
- [[architecture/Overview]]
- [[frontend/API Client]]
