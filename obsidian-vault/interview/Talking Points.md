# Interview Talking Points

> 50-minute video call. They want to see you **understand your code**. This note maps every README requirement to exactly how you built it.

---

## Opening (2 min)

"I built Townhall — a real-time chat app like Discord. Next.js frontend with Clerk auth, FastAPI backend, 5 DynamoDB tables, deployed to AWS App Runner. Real-time via SSE. Everything persists across restarts."

```
Browser (Next.js + Clerk) → FastAPI (App Runner) → DynamoDB (5 tables)
                               ↑
                         SSE real-time
```

---

## CORE REQUIREMENTS (from README)

### 1. "Creating and joining chat rooms"

**How we did it:**
- `POST /api/rooms/` creates a room → auto-joins creator as `admin` in room_members table
- `POST /api/members/{room_id}/join` lets others join
- Frontend auto-seeds a "general" room if none exist on first load
- Sidebar shows all rooms, click to switch

**Code pointers:**
- `backend/app/routes/rooms.py` — create room + auto-join
- `frontend/components/chat/sidebar.tsx` — create channel modal (slugifies name)
- `frontend/app/chat/page.tsx:67-77` — auto-seed "general"

**DynamoDB tables:** `chat_rooms` (PK: roomId) + `room_members` (PK: roomId, SK: userId)

**If they ask deeper:**
- "Room creation is a two-step write: put_item to chat_rooms, then put_item to room_members. Not transactional — I'd use DynamoDB TransactWriteItems in production."
- "Auto-join on room switch is a silent catch — if you're already a member, the 409 is swallowed."

---

### 2. "Sending and receiving messages in real time"

**How we did it:**
- **Send**: `POST /api/messages/{room_id}` writes to DynamoDB + publishes to SSE
- **Receive**: `EventSource` on `/api/sse/{room_id}` — server pushes `new_message` events
- **Optimistic UI**: message appears instantly before server confirms
- **Deduplication**: checks messageId AND (same user + same content + within 5 seconds)

**Code pointers:**
- `backend/app/routes/messages.py:53-75` — send + publish to SSE
- `backend/app/routes/sse.py` — in-memory asyncio queues per room, 30s keepalive
- `frontend/app/chat/page.tsx:135-158` — SSE listener with dedup
- `frontend/app/chat/page.tsx:196-210` — optimistic send

**Why SSE not WebSocket?**
- "App Runner doesn't support WebSocket upgrades — it's plain HTTP only. SSE works over HTTP, so it's the production transport. WebSocket exists in the code for local dev."

**If they ask deeper:**
- "SSE is one-directional (server → client). Messages are sent via REST POST, received via SSE. It's like two half-duplex channels."
- "The in-memory pub/sub (`asyncio.Queue` per subscriber) works for single-instance. For multi-instance I'd use Redis Pub/Sub."
- "sortKey = `{ISO timestamp}#{UUID}` — ISO strings sort lexicographically, UUID prevents same-ms collisions."

---

### 3. "Displaying a list of active users in a room"

**How we did it:**
- `GET /api/members/{room_id}` returns members **enriched** with user data
- Backend joins `room_members` table with `users` table to get username + avatar
- Right panel (MembersPanel) shows online/offline with green/gray dots
- Connection registered per room for presence tracking

**Code pointers:**
- `backend/app/routes/members.py:20-35` — enrichment loop (N+1 with users table)
- `frontend/components/chat/members-panel.tsx` — online/offline sections
- `backend/app/routes/connections.py` — presence CRUD

**If they ask deeper:**
- "The enrichment is N+1 — one query to room_members, then one get_item per member to users table. At scale I'd batch-get or cache in Redis."
- "Connections table (PK: connectionId, GSIs: userId-index, roomId-index) tracks who's connected to what room."

---

### 4. "Separate user accounts and authentication"

**How we did it:**
- **Clerk** handles sign-up, sign-in, sessions, JWT
- On login, frontend calls `POST /api/users/` with Clerk ID → upserts in DynamoDB
- Clerk ID = DynamoDB userId (single identity across both systems)
- Protected routes via Clerk middleware (`proxy.ts`)

**Code pointers:**
- `frontend/proxy.ts` — Clerk middleware, protects `/chat`
- `frontend/app/chat/page.tsx:43-51` — sync user on load
- `backend/app/routes/users.py:46-72` — upsert logic (create if new, update if exists)

**If they ask deeper:**
- "I chose Clerk over custom JWT because it's a take-home — I wanted to spend time on the interesting parts (real-time, data model) not reimplementing auth."
- "The upsert means every login refreshes the username/avatar in DynamoDB, so profile changes propagate."

---

## OPTIONAL ENHANCEMENTS (from README)

### "Message history and persistence" — DONE

- All messages stored in DynamoDB `messages` table
- PK: roomId, SK: `{timestamp}#{messageId}` for time-ordered retrieval
- `GET /api/messages/{room_id}?limit=50` with cursor-based pagination
- Messages survive server restarts — DynamoDB is persistent storage

### "Message search" — NOT DONE (placeholder)

- Search icon exists in sidebar but isn't wired up
- "I'd implement with a DynamoDB scan + filter for small scale, or pipe DynamoDB Streams to OpenSearch for production full-text search."

### "Notifications / unread indication" — PARTIAL

- `lastReadAt` field exists in room_members table
- Not used in frontend yet
- "I'd update lastReadAt on scroll, compute unread count as messages with createdAt > lastReadAt, show badge on sidebar."

### "Rich media" — NOT DONE

- Message `type` field supports "text" (extensible to "image", "file")
- "I'd use S3 presigned URLs for uploads, store the URL in the message content, and render based on type."

### "Typing indicators" — BACKEND DONE, FRONTEND NOT WIRED

- WebSocket handler supports `type: "typing"` and `type: "stop_typing"` messages
- ChatArea has a `typingUsers` prop — always empty in production
- "App Runner doesn't support WebSocket, so typing indicators don't work in production. I'd add a REST endpoint for typing status that clients poll every 2-3 seconds."

### "Beautiful and responsive UI" — DONE

- Discord-inspired three-panel layout (sidebar 260px / chat flex / members 240px)
- Message grouping by date + same-author compacting (5 min window)
- Tailwind CSS + shadcn/ui components
- Auto-sizing textarea, smooth scrolling
- Onboarding tour for new users

### "Deploy your code" — DONE

- Backend: Docker → ECR → AWS App Runner
- Infrastructure: Terraform (5 DynamoDB tables)
- Live API: `https://9rjvhfdkqt.us-west-2.awsapprunner.com`
- Swagger docs: `https://9rjvhfdkqt.us-west-2.awsapprunner.com/docs`

### "Moderation tools (muting, banning, message deletion)" — PARTIAL

- `DELETE /api/messages/{room_id}/{sort_key}` — message deletion API works
- `DELETE /api/members/{room_id}/kick/{user_id}` — kick API works (admin-only)
- No frontend UI for either — "API endpoints are built and tested, just didn't have time for the UI."

### "Voice/video chat" — NOT DONE

- "Would use WebRTC with a TURN/STUN server. Signaling via the existing WebSocket channel."

### "End-to-end encryption" — NOT DONE

- "Would use the Signal Protocol (Double Ratchet). Key exchange on room join, encrypt messages client-side before sending to the API. Server only sees ciphertext."

---

## SYSTEM DESIGN DEEP DIVE

### Hot Partition Problem

See: [[interview/Hot Partition Problem]]

Our `messages` table uses `roomId` as partition key — same as Discord's `channel_id`. At scale, popular rooms overwhelm one partition.

**Discord's fix:**
1. **Request coalescing** — Data Services layer (Rust) deduplicates concurrent reads into one DB query
2. **Consistent hash routing** — same channel always hits the same service instance
3. Eventually migrated Cassandra → ScyllaDB

**What I'd do:**
- Redis cache with 500ms TTL between FastAPI and DynamoDB
- `asyncio.Lock` per roomId for read coalescing
- Redis Pub/Sub for multi-instance SSE

---

## IF THEY ASK ABOUT SCALING

- "DynamoDB auto-scales reads/writes, but hot partitions are the real bottleneck"
- "I'd add Redis caching + request coalescing for high-traffic rooms"
- "I'd replace in-memory SSE pub/sub with Redis Pub/Sub for multi-instance"
- "I'd move to API Gateway WebSocket API for true WebSocket support"
- "I'd add CloudFront CDN in front of the API for static responses"

## IF THEY ASK ABOUT SECURITY

- "Clerk handles auth — JWTs, session management, OAuth, MFA"
- "CORS is `*` for the demo — production would be restricted to my domain"
- "User IDs come from Clerk, not user input — prevents ID spoofing"
- "DynamoDB uses structured API calls — no SQL injection vector"
- "I'd add rate limiting (sliding window) and input sanitization for production"

## IF THEY ASK ABOUT TESTING

- "I tested all 27 API endpoints via curl against the live DynamoDB tables"
- "The Swagger docs at /docs let you test any endpoint interactively"
- "For production I'd add pytest with moto (DynamoDB mock) for unit tests, plus Playwright for frontend E2E"

---

## Related
- [[interview/Hot Partition Problem]]
- [[interview/Design Decisions]]
- [[frontend/Feature Status]]
- [[architecture/Overview]]
- [[data-model/Tables Overview]]
- [[backend/API Reference]]
