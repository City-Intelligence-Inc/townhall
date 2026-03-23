# Interview Talking Points

> 50-minute video call. Map every README requirement to how you built it. Every technical term links to a definition so you can refresh before the call.

---

## Opening (2 min)

"I built Townhall — a real-time chat app like Discord/Slack. [Next.js](https://en.wikipedia.org/wiki/Next.js) frontend with [Clerk](https://clerk.com/docs) auth, [FastAPI](https://en.wikipedia.org/wiki/FastAPI) backend, 5 [DynamoDB](https://en.wikipedia.org/wiki/Amazon_DynamoDB) tables, file uploads to [S3](https://en.wikipedia.org/wiki/Amazon_S3), deployed to [AWS App Runner](https://docs.aws.amazon.com/apprunner/). Real-time via [SSE](https://en.wikipedia.org/wiki/Server-sent_events). Plus a React Native mobile app."

```
Browser (Next.js + Clerk) → FastAPI (App Runner) → DynamoDB (5 tables)
Mobile (Expo + Clerk)  ↗        ↑                      + S3 (file uploads)
                           SSE real-time
```

---

## CORE REQUIREMENTS (from README)

### 1. "Creating and joining chat rooms"

**How we did it:**
- `POST /api/rooms/` creates a room → auto-joins creator as `admin` in [room_members table](https://en.wikipedia.org/wiki/Associative_entity) (many-to-many join)
- `POST /api/members/{room_id}/join` lets others join
- Frontend auto-seeds a "general" room if none exist on first load
- Sidebar shows all rooms with [unread badges](https://en.wikipedia.org/wiki/Badge_(computing))

**Key concepts:**
- [Many-to-many relationship](https://en.wikipedia.org/wiki/Many-to-many_(data_model)) — users ↔ rooms via room_members table
- [DynamoDB composite key](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey) — PK: roomId, SK: userId
- [Global Secondary Index (GSI)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html) — userId-index lets us query "all rooms this user is in"

**If they ask deeper:**
- "Room creation is two writes: put_item to chat_rooms, then put_item to room_members. I'd use [DynamoDB TransactWriteItems](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html) in production for atomicity."

---

### 2. "Sending and receiving messages in real time"

**How we did it:**
- **Send**: `POST /api/messages/{room_id}` writes to DynamoDB + publishes to [SSE](https://en.wikipedia.org/wiki/Server-sent_events)
- **Receive**: [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) on `/api/sse/{room_id}` — server pushes events
- **[Optimistic UI](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)**: message appears instantly before server confirms
- **Deduplication**: checks messageId AND (same user + same content within 5 seconds)
- **SSE events**: `new_message`, `message_deleted`, `message_edited`, `typing`, `stop_typing`, `reaction_update`

**Key concepts:**
- [Server-Sent Events (SSE)](https://en.wikipedia.org/wiki/Server-sent_events) — one-directional push from server to client over HTTP. Unlike [WebSocket](https://en.wikipedia.org/wiki/WebSocket), doesn't need protocol upgrade.
- [Pub/Sub pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) — in-memory [asyncio.Queue](https://docs.python.org/3/library/asyncio-queue.html) per subscriber per room
- [Optimistic update](https://www.google.com/search?q=optimistic+update+pattern+frontend) — show the result before the server confirms, rollback if it fails
- [Cursor-based pagination](https://www.google.com/search?q=cursor+based+pagination+vs+offset) — uses DynamoDB's `LastEvaluatedKey` instead of page numbers

**Why SSE not WebSocket?**
- "[App Runner](https://docs.aws.amazon.com/apprunner/) doesn't support [WebSocket](https://en.wikipedia.org/wiki/WebSocket) upgrades — it's plain HTTP only. SSE works over HTTP. WebSocket exists in the code for local dev."

**If they ask deeper:**
- "[sortKey](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey) = `{ISO timestamp}#{UUID}` — [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) strings sort lexicographically, UUID prevents same-ms collisions."
- "For multi-instance I'd use [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/) to fan out SSE events across instances."

---

### 3. "Displaying a list of active users in a room"

**How we did it:**
- `GET /api/members/{room_id}` returns members **enriched** with user data
- Backend joins room_members with users table ([N+1 query pattern](https://www.google.com/search?q=N%2B1+query+problem))
- MembersPanel shows online/offline with green/gray dots
- Presence tracked via connections table + 10s polling
- [Online presence](https://en.wikipedia.org/wiki/Presence_information) indicators (green = online, gray = offline)

**Key concepts:**
- [N+1 query problem](https://www.google.com/search?q=N%2B1+query+problem+database) — one query for members, then one per member for user data. At scale → [BatchGetItem](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.BatchOperations) or [Redis cache](https://en.wikipedia.org/wiki/Redis)
- [Presence protocol](https://en.wikipedia.org/wiki/Presence_information) — connections table tracks who's connected where

---

### 4. "Separate user accounts and authentication"

**How we did it:**
- [Clerk](https://clerk.com/docs) handles sign-up, sign-in, sessions, [JWT](https://en.wikipedia.org/wiki/JSON_Web_Token)
- On login, frontend calls `POST /api/users/` with Clerk ID → [upsert](https://en.wikipedia.org/wiki/Merge_(SQL)#Implementations) in DynamoDB
- Clerk ID = DynamoDB userId (single identity)
- Protected routes via [middleware](https://en.wikipedia.org/wiki/Middleware) (`proxy.ts`)

**Key concepts:**
- [JSON Web Token (JWT)](https://en.wikipedia.org/wiki/JSON_Web_Token) — stateless auth token, contains user ID + expiry, signed by Clerk
- [Upsert](https://en.wikipedia.org/wiki/Merge_(SQL)) — create if new, update if exists. Every login refreshes username/avatar.
- [OAuth 2.0](https://en.wikipedia.org/wiki/OAuth#OAuth_2.0) — Clerk supports Google, GitHub, Apple sign-in

---

## OPTIONAL ENHANCEMENTS (from README)

### "Message history and persistence" — DONE

- All messages in [DynamoDB](https://en.wikipedia.org/wiki/Amazon_DynamoDB) `messages` table — survives server restarts
- [Cursor-based pagination](https://www.google.com/search?q=cursor+based+pagination) with `LastEvaluatedKey`
- Sort key `{timestamp}#{id}` gives [time-series ordering](https://en.wikipedia.org/wiki/Time_series_database)

### "Message search" — DONE

- `GET /api/search/?q=...` — scans messages table with content filter
- Cmd+K modal with [debounced](https://www.google.com/search?q=debounce+programming) search (300ms)
- Click result → navigates to that room
- "At scale I'd pipe [DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html) to [OpenSearch](https://en.wikipedia.org/wiki/OpenSearch_(software)) for [full-text search](https://en.wikipedia.org/wiki/Full-text_search)"

### "Notifications / unread indication" — DONE

- `lastReadAt` field in room_members, updated on room enter
- Unread count = messages with `createdAt > lastReadAt`
- Red badge on sidebar channels

### "Rich media (file uploads, images, markdown)" — DONE

- **File uploads**: [S3](https://en.wikipedia.org/wiki/Amazon_S3) bucket (`chatroom-dev-uploads`) via `POST /api/uploads`
- **Drag-and-drop**: files dropped on chat area → preview strip → upload to S3 → [presigned URL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) in message
- **Images**: sent as `![name](presigned-url)` → rendered inline via [Markdown](https://en.wikipedia.org/wiki/Markdown)
- **Rich text**: [ReactMarkdown](https://github.com/remarkjs/react-markdown) with [GFM](https://en.wikipedia.org/wiki/Markdown#GitHub_Flavored_Markdown) — bold, italic, code blocks, links, blockquotes, lists
- **Toolbar**: Bold/Italic/Code/Link/Blockquote buttons wrap selected text

**Key concepts:**
- [Presigned URL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) — time-limited URL that grants temporary access to a private S3 object (1 hour expiry)
- [Multipart upload](https://en.wikipedia.org/wiki/MIME#Multipart_messages) — file sent as `multipart/form-data` to the backend
- [S3 lifecycle policy](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html) — auto-deletes files after 30 days to control cost

### "Typing indicators, read receipts, presence" — DONE

- **Typing**: `POST /api/sse/{room_id}/typing` → SSE broadcasts to room → animated dots in UI
- Auto-sends `stop_typing` after 3s of inactivity, server-side 5s expiry
- **Read receipts**: `PATCH /api/members/{room_id}/read/{user_id}` updates `lastReadAt`
- **Presence**: connection tracking + 10s polling for online/offline status

**Key concepts:**
- [Typing indicator](https://www.google.com/search?q=typing+indicator+chat+protocol) — ephemeral state, not persisted. In-memory with TTL expiry.
- [Read receipt](https://en.wikipedia.org/wiki/Read_receipt) — `lastReadAt` timestamp compared against message `createdAt`

### "Beautiful and responsive UI" — DONE

- [Discord](https://en.wikipedia.org/wiki/Discord)/[Slack](https://en.wikipedia.org/wiki/Slack_(software))-inspired three-panel layout
- Message grouping by date + same-author compacting (5 min window, like Slack)
- [Tailwind CSS](https://en.wikipedia.org/wiki/Tailwind_CSS) + [shadcn/ui](https://ui.shadcn.com/) components
- Hover action bar (react, reply, edit, delete, copy, pin)
- Emoji reactions with toggle
- Reply/threading with quoted preview
- [Onboarding](https://en.wikipedia.org/wiki/User_onboarding) tour for new users

### "Deploy your code" — DONE

- **Backend**: [Docker](https://en.wikipedia.org/wiki/Docker_(software)) → [ECR](https://docs.aws.amazon.com/ecr/) → [AWS App Runner](https://docs.aws.amazon.com/apprunner/)
- **Infrastructure**: [Terraform](https://en.wikipedia.org/wiki/Terraform_(software)) (5 DynamoDB tables + S3 bucket)
- **Mobile**: [React Native](https://en.wikipedia.org/wiki/React_Native) / [Expo](https://docs.expo.dev/) → [EAS Build](https://docs.expo.dev/build/introduction/) → [TestFlight](https://en.wikipedia.org/wiki/TestFlight)
- Live API: `https://9rjvhfdkqt.us-west-2.awsapprunner.com`
- Swagger: `https://9rjvhfdkqt.us-west-2.awsapprunner.com/docs`

**Key concepts:**
- [Infrastructure as Code (IaC)](https://en.wikipedia.org/wiki/Infrastructure_as_code) — Terraform defines all AWS resources declaratively
- [Container registry (ECR)](https://en.wikipedia.org/wiki/Docker_(software)#Registries) — stores Docker images, App Runner pulls from it
- [App Runner](https://docs.aws.amazon.com/apprunner/) — managed container hosting, auto-scales, HTTPS included
- [PAY_PER_REQUEST](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html#HowItWorks.OnDemand) — DynamoDB billing mode, zero cost at idle

### "Moderation tools" — DONE (backend)

- `DELETE /api/members/{room_id}/kick/{user_id}` — admin-only kick
- `POST /api/members/{room_id}/mute/{user_id}` — mute with duration
- `POST /api/members/{room_id}/ban/{user_id}` — permanent ban
- Message deletion with SSE broadcast
- "Frontend moderation UI is the next step — backend is ready."

### "Voice/video chat" — NOT DONE

- "Would use [WebRTC](https://en.wikipedia.org/wiki/WebRTC) with a [TURN/STUN server](https://en.wikipedia.org/wiki/Traversal_Using_Relays_around_NAT). Signaling via the existing SSE/WebSocket channel."

### "End-to-end encryption" — NOT DONE

- "Would use the [Signal Protocol](https://en.wikipedia.org/wiki/Signal_Protocol) ([Double Ratchet](https://en.wikipedia.org/wiki/Double_Ratchet_Algorithm)). Key exchange on room join, encrypt client-side. Server only sees ciphertext."

---

## SYSTEM DESIGN DEEP DIVE

### Hot Partition Problem

See: [[interview/Hot Partition Problem]]

Our `messages` table uses `roomId` as [partition key](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html) — same as Discord's `channel_id`. At scale, popular rooms overwhelm one partition.

**Key concepts:**
- [Database sharding](https://en.wikipedia.org/wiki/Shard_(database_architecture)) — distributing data across multiple nodes
- [Hot partition / hot spot](https://www.google.com/search?q=hot+partition+problem+distributed+database) — one shard gets disproportionate traffic
- [Request coalescing](https://www.google.com/search?q=request+coalescing+pattern) — deduplicating concurrent identical reads into one DB query
- [Consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing) — routing strategy that maps keys to specific service instances

**Discord's fix:**
1. **[Request coalescing](https://www.google.com/search?q=request+coalescing+pattern)** — [Rust](https://en.wikipedia.org/wiki/Rust_(programming_language)) Data Services layer deduplicates concurrent reads
2. **[Consistent hash routing](https://en.wikipedia.org/wiki/Consistent_hashing)** — same channel always hits the same service instance
3. Migrated [Cassandra](https://en.wikipedia.org/wiki/Apache_Cassandra) → [ScyllaDB](https://en.wikipedia.org/wiki/ScyllaDB)

**What I'd do:**
- [Redis](https://en.wikipedia.org/wiki/Redis) cache with 500ms [TTL](https://en.wikipedia.org/wiki/Time_to_live) between FastAPI and DynamoDB
- [asyncio.Lock](https://docs.python.org/3/library/asyncio-sync.html#asyncio.Lock) per roomId for read coalescing
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/) for multi-instance SSE

---

## DATA MODEL (quick reference)

| Table | PK | SK | GSIs | Concept |
|-------|----|----|------|---------|
| [users](https://en.wikipedia.org/wiki/User_(computing)) | userId | — | email, username | [Entity table](https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model) |
| [chat_rooms](https://en.wikipedia.org/wiki/Chat_room) | roomId | — | createdBy | Entity table |
| [room_members](https://en.wikipedia.org/wiki/Associative_entity) | roomId | userId | userId-index | [Junction table](https://en.wikipedia.org/wiki/Associative_entity) (many-to-many) |
| messages | roomId | sortKey | senderId | [Time-series](https://en.wikipedia.org/wiki/Time_series_database) pattern |
| connections | connectionId | — | userId, roomId | [Presence](https://en.wikipedia.org/wiki/Presence_information) tracking |
| [S3 bucket](https://en.wikipedia.org/wiki/Amazon_S3) | key path | — | — | [Object storage](https://en.wikipedia.org/wiki/Object_storage) for files |

---

## IF THEY ASK ABOUT SCALING

| Question | Answer | Concept |
|----------|--------|---------|
| "How does DynamoDB scale?" | [PAY_PER_REQUEST](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html) auto-scales reads/writes, but [hot partitions](https://www.google.com/search?q=hot+partition+problem+dynamodb) are the bottleneck | [Horizontal scaling](https://en.wikipedia.org/wiki/Scalability#Horizontal_or_scale_out) |
| "How would you handle millions of users?" | [Redis](https://en.wikipedia.org/wiki/Redis) caching + [request coalescing](https://www.google.com/search?q=request+coalescing+pattern) for hot rooms | [Caching](https://en.wikipedia.org/wiki/Cache_(computing)) |
| "How would you scale SSE?" | [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/) to fan events across instances | [Message broker](https://en.wikipedia.org/wiki/Message_broker) |
| "Why not WebSocket?" | [App Runner limitation](https://docs.aws.amazon.com/apprunner/). I'd use [API Gateway WebSocket API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html) | [WebSocket protocol](https://en.wikipedia.org/wiki/WebSocket) |
| "How would you handle file uploads at scale?" | [S3 multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html) + [CloudFront CDN](https://en.wikipedia.org/wiki/Amazon_CloudFront) for delivery | [CDN](https://en.wikipedia.org/wiki/Content_delivery_network) |

## IF THEY ASK ABOUT SECURITY

| Question | Answer | Concept |
|----------|--------|---------|
| "How is auth handled?" | [Clerk](https://clerk.com/docs) → [JWT](https://en.wikipedia.org/wiki/JSON_Web_Token) tokens, session management, [OAuth](https://en.wikipedia.org/wiki/OAuth) | [Authentication](https://en.wikipedia.org/wiki/Authentication) |
| "CORS?" | Wide open (`*`) for demo — production would be [origin-restricted](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) | [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) |
| "SQL injection?" | [DynamoDB](https://en.wikipedia.org/wiki/Amazon_DynamoDB) uses structured API calls — no SQL injection vector | [SQL injection](https://en.wikipedia.org/wiki/SQL_injection) |
| "Rate limiting?" | I'd add [sliding window rate limiter](https://en.wikipedia.org/wiki/Rate_limiting) per user | [Rate limiting](https://en.wikipedia.org/wiki/Rate_limiting) |
| "File upload security?" | S3 [presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) expire in 1 hour, bucket has [public access block](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html) | [Principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) |

## IF THEY ASK ABOUT TESTING

- "I tested all 30+ API endpoints via curl against live DynamoDB + S3"
- "Swagger at `/docs` lets you test any endpoint interactively"
- "For production: [pytest](https://en.wikipedia.org/wiki/Pytest) + [moto](https://github.com/getmoto/moto) (DynamoDB mock) for unit tests, [Playwright](https://en.wikipedia.org/wiki/Playwright_(software)) for frontend [E2E](https://en.wikipedia.org/wiki/End-to-end_testing)"

## IF THEY ASK ABOUT TRADEOFFS

| Decision | What I chose | Alternative | Why |
|----------|-------------|-------------|-----|
| Database | [DynamoDB](https://en.wikipedia.org/wiki/Amazon_DynamoDB) | [PostgreSQL](https://en.wikipedia.org/wiki/PostgreSQL) | Serverless, zero idle cost, auto-scales |
| Auth | [Clerk](https://clerk.com) | Custom [JWT](https://en.wikipedia.org/wiki/JSON_Web_Token) | Focus on interesting parts, not reimplementing auth |
| Real-time | [SSE](https://en.wikipedia.org/wiki/Server-sent_events) | [WebSocket](https://en.wikipedia.org/wiki/WebSocket) | App Runner constraint. SSE is simpler anyway |
| Backend | [FastAPI](https://en.wikipedia.org/wiki/FastAPI) | [Express](https://en.wikipedia.org/wiki/Express.js) | Auto OpenAPI docs, async-native, [Pydantic](https://docs.pydantic.dev/) validation |
| IaC | [Terraform](https://en.wikipedia.org/wiki/Terraform_(software)) | [CloudFormation](https://en.wikipedia.org/wiki/AWS_CloudFormation) | Multi-cloud, better DX, state management |
| File storage | [S3](https://en.wikipedia.org/wiki/Amazon_S3) | Database BLOBs | Cheaper, CDN-ready, [presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) |

---

## GLOSSARY (quick refresh before the call)

| Term | What it is | Link |
|------|-----------|------|
| SSE | Server pushes events to browser over HTTP | [Wikipedia](https://en.wikipedia.org/wiki/Server-sent_events) |
| WebSocket | Full-duplex communication over TCP | [Wikipedia](https://en.wikipedia.org/wiki/WebSocket) |
| DynamoDB | AWS serverless NoSQL database | [Wikipedia](https://en.wikipedia.org/wiki/Amazon_DynamoDB) |
| Partition Key | How DynamoDB distributes data across nodes | [AWS Docs](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html) |
| GSI | Secondary index for alternate query patterns | [AWS Docs](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html) |
| S3 | AWS object storage for files | [Wikipedia](https://en.wikipedia.org/wiki/Amazon_S3) |
| Presigned URL | Temporary URL granting access to private S3 object | [AWS Docs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) |
| JWT | Signed token for stateless authentication | [Wikipedia](https://en.wikipedia.org/wiki/JSON_Web_Token) |
| OAuth | Delegated authorization protocol | [Wikipedia](https://en.wikipedia.org/wiki/OAuth) |
| Terraform | Infrastructure as Code tool | [Wikipedia](https://en.wikipedia.org/wiki/Terraform_(software)) |
| App Runner | AWS managed container hosting | [AWS Docs](https://docs.aws.amazon.com/apprunner/) |
| ECR | AWS Docker container registry | [AWS Docs](https://docs.aws.amazon.com/ecr/) |
| Pub/Sub | Publish-subscribe messaging pattern | [Wikipedia](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) |
| Optimistic Update | Show result before server confirms | [Google](https://www.google.com/search?q=optimistic+update+pattern) |
| Cursor Pagination | Use last item as next page bookmark | [Google](https://www.google.com/search?q=cursor+based+pagination) |
| Hot Partition | One database shard overloaded with traffic | [Google](https://www.google.com/search?q=hot+partition+problem) |
| Request Coalescing | Merge concurrent identical requests into one | [Google](https://www.google.com/search?q=request+coalescing+pattern) |
| Consistent Hashing | Key-to-node mapping that survives node changes | [Wikipedia](https://en.wikipedia.org/wiki/Consistent_hashing) |
| N+1 Query | One query + one per result = performance trap | [Google](https://www.google.com/search?q=N%2B1+query+problem) |
| WebRTC | Browser-to-browser real-time audio/video | [Wikipedia](https://en.wikipedia.org/wiki/WebRTC) |
| Signal Protocol | End-to-end encryption (used by WhatsApp, Signal) | [Wikipedia](https://en.wikipedia.org/wiki/Signal_Protocol) |
| Double Ratchet | Key management algorithm for E2E encryption | [Wikipedia](https://en.wikipedia.org/wiki/Double_Ratchet_Algorithm) |
| CORS | Browser security policy for cross-origin requests | [Wikipedia](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) |
| Rate Limiting | Throttling requests to prevent abuse | [Wikipedia](https://en.wikipedia.org/wiki/Rate_limiting) |

---

## Related
- [[interview/Hot Partition Problem]]
- [[interview/Design Decisions]]
- [[frontend/Feature Status]]
- [[architecture/Overview]]
- [[data-model/Tables Overview]]
- [[backend/API Reference]]
