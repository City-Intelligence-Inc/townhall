# Call Script — Read This Out Loud

> Literal sentences you can say during the 50-minute call. Read sequentially. Skip sections if they don't ask.

---

## 1. OPENING (say this first, ~2 min)

"Thanks for having me. I built Townhall — it's a real-time chat app like Slack or Discord."

"The stack is Next.js on the frontend, FastAPI in Python on the backend, and DynamoDB for the database. Everything is deployed on AWS — the backend runs on App Runner, file uploads go to S3, and all the infrastructure is defined in Terraform."

"For auth I used Clerk — it handles sign-up, sign-in, and JWT sessions. Real-time messaging works through Server-Sent Events. I also built a React Native mobile app with Expo."

"Let me walk you through the main features."

---

## 2. ROOMS (when they ask about chat rooms)

"When a user creates a room, two things happen. First, I write the room to the chat_rooms DynamoDB table. Then I automatically add the creator to the room_members table as an admin."

"The room_members table is a many-to-many join table — the partition key is the room ID and the sort key is the user ID. There's also a Global Secondary Index on user ID so I can efficiently query all rooms a user belongs to."

"On the frontend, the sidebar shows all available rooms. There's also an unread badge — I track a lastReadAt timestamp per user per room, and count messages newer than that."

"If no rooms exist, the app auto-creates a 'general' channel on first load."

---

## 3. REAL-TIME MESSAGING (when they ask about real-time)

"Messages are sent via a REST POST to the backend. FastAPI writes the message to DynamoDB, then publishes it to an in-memory pub/sub system using Python's asyncio queues."

"Clients subscribe to a room using the EventSource API — that's Server-Sent Events, or SSE. It's a one-directional push from server to client over a persistent HTTP connection."

"I chose SSE over WebSocket because AWS App Runner doesn't support WebSocket protocol upgrades. SSE works over plain HTTP, so it's compatible. I do have a WebSocket endpoint in the code for local development."

"On the frontend I use optimistic updates — when you hit send, the message appears in your UI immediately. Then when the SSE event comes back from the server, I deduplicate by checking the message ID and a 5-second content window."

"The SSE channel carries six event types: new message, message deleted, message edited, typing indicators, stop typing, and reaction updates."

---

## 4. ACTIVE USERS / PRESENCE (when they ask about online status)

"I track presence using a connections table in DynamoDB. When you open a room, the frontend registers a connection. Then every 10 seconds it sends a heartbeat to refresh the lastSeenAt timestamp."

"When another user queries the active users in a room, the backend filters out any connections where lastSeenAt is older than 60 seconds. Those stale connections get garbage-collected on read."

"The members panel on the right shows online users with a green dot and offline users grayed out. The member list is enriched — the backend joins the room_members table with the users table to get usernames and avatars."

---

## 5. AUTHENTICATION (when they ask about auth)

"I used Clerk for authentication. It handles email/password, Google, GitHub, and Apple sign-in. On the frontend, Clerk manages the session and issues JWTs."

"When a user first logs in, the frontend syncs their Clerk profile to my DynamoDB users table using an upsert — if the user already exists, it updates their name and avatar. The Clerk user ID becomes the DynamoDB primary key, so there's a single identity across both systems."

"Routes are protected by Clerk middleware — if you're not signed in, you get redirected to the sign-in page."

---

## 6. MESSAGE PERSISTENCE (when they ask about history)

"All messages are stored in DynamoDB. The partition key is the room ID, and the sort key is a composite of the ISO timestamp and a UUID — like '2026-03-23T21:40:03#ba00a87d'. This gives me time-ordered retrieval with uniqueness even for same-millisecond messages."

"I support cursor-based pagination using DynamoDB's LastEvaluatedKey. The frontend requests 50 messages at a time, and the API returns a cursor for the next page."

"Messages survive server restarts because DynamoDB is persistent, durable storage — it's not in-memory."

---

## 7. SEARCH (when they ask about search)

"I implemented a search endpoint that scans the messages table and filters by content. The frontend has a Cmd+K modal — you type a query, it debounces for 300 milliseconds, then hits the API. Results show the room, sender, and content. Click a result and it navigates to that room."

"At scale, a DynamoDB scan is expensive. I'd pipe DynamoDB Streams to OpenSearch for proper full-text search with relevance ranking."

---

## 8. FILE UPLOADS (when they ask about rich media)

"Files are uploaded to an S3 bucket called chatroom-dev-uploads. The frontend supports drag-and-drop — you can drop a file anywhere on the chat area and it shows a preview. Or you can click the paperclip button."

"The upload goes to a FastAPI endpoint as multipart form data. The backend uploads to S3 with the correct content type, then returns a presigned URL that's valid for one hour."

"Images get sent as markdown image syntax — the message content is literally ![filename](presigned-url), and React Markdown renders it inline. Other files show as clickable links."

"The S3 bucket has a lifecycle policy that deletes files after 30 days to control costs, and public access is fully blocked — you can only access files through presigned URLs."

---

## 9. TYPING INDICATORS (when they ask about typing)

"When you're typing, the frontend sends a POST to an SSE typing endpoint with your user ID and username. The backend stores this in memory with a 5-second expiry, then broadcasts a typing event to all SSE subscribers in that room."

"The frontend auto-sends a stop_typing signal after 3 seconds of inactivity. On the receiving end, the UI shows animated dots and the name of who's typing."

---

## 10. REACTIONS & EDITING (when they ask about message interactions)

"Messages support emoji reactions. When you click an emoji, it sends a POST that toggles your user ID in a reactions map stored on the message. If you already reacted with that emoji, it removes you. The change broadcasts via SSE."

"You can also edit and delete your own messages. Edits show an '(edited)' label. Deletes broadcast a message_deleted event so all clients remove it in real-time."

"There's also a reply feature — you can quote a previous message. The reply shows a preview badge above the new message."

---

## 11. MODERATION (when they ask about moderation)

"The backend supports admin-only moderation endpoints — kick, mute with a duration, and ban. These check that the requesting user has the admin role in room_members before executing."

"I didn't build the frontend UI for moderation, but the API is fully functional and tested."

---

## 12. DEPLOYMENT (when they ask about infrastructure)

"All infrastructure is defined in Terraform — five DynamoDB tables, one S3 bucket with CORS and lifecycle rules, plus a public access block."

"The backend is containerized with Docker and pushed to AWS ECR. AWS App Runner pulls the image and hosts it with auto-scaling and HTTPS."

"I also set up IAM roles — one lets App Runner pull from ECR, another gives the container access to DynamoDB and S3."

"The deploy process is: docker build, push to ECR, then trigger a deployment via the AWS CLI. Takes about 2 minutes."

---

## 13. HOT PARTITION (if they ask about system design)

"My messages table uses roomId as the partition key — the same design Discord used with Cassandra. At scale, if a popular room gets an @everyone ping, all reads hit one DynamoDB partition, causing a hot spot."

"Discord solved this with two strategies. First, request coalescing — they built a Rust data services layer that deduplicates concurrent reads. If 1000 users read the same message simultaneously, only one database query executes."

"Second, consistent hash routing — the backend hashes the channel ID to always route requests for the same channel to the same data service instance. Without this, coalescing wouldn't work because requests would scatter across instances."

"For my app, I'd add a Redis cache with a 500-millisecond TTL between FastAPI and DynamoDB, plus asyncio locks per room ID for read coalescing."

---

## 14. IF THEY ASK ABOUT SCALING

"DynamoDB auto-scales reads and writes, but the bottleneck is hot partitions in popular rooms."

"I'd add Redis for caching, request coalescing for hot rooms, and Redis Pub/Sub to fan SSE events across multiple backend instances."

"For WebSocket support, I'd move to AWS API Gateway WebSocket API instead of App Runner."

"For file delivery at scale, I'd put CloudFront CDN in front of S3."

---

## 15. IF THEY ASK ABOUT SECURITY

"Clerk handles authentication — JWTs, session management, and OAuth. CORS is wide open for this demo; production would be origin-restricted."

"User IDs come from Clerk, not from user input, which prevents ID spoofing. DynamoDB uses structured API calls — there's no SQL injection vector."

"S3 files are private by default. Presigned URLs expire after one hour. The bucket has a public access block enabled."

---

## 16. CLOSING

"Given more time, I'd add WebRTC for voice/video, the Signal Protocol for end-to-end encryption, and a proper moderation UI. But I'm proud of what I shipped — 48 API endpoints, real-time messaging, file uploads, search, reactions, and it's all deployed and running live on AWS."

---

## Related
- [[interview/Talking Points]] — detailed technical reference with links
- [[interview/Hot Partition Problem]] — Discord deep dive
- [[interview/Design Decisions]] — tradeoff explanations
