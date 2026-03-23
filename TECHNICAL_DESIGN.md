# Townhall — Technical Design Document

**Real-time team communication platform**
Authors: Arihant Choudhary, Rosemary

---

## 1. Overview

Townhall is a real-time chat application for team communication. Users can create channels, send messages, and see who's online — built as a full-stack system with web and mobile clients sharing a single backend.

### Product Goals
- Instant message delivery (< 100ms perceived latency via optimistic updates)
- Channel-based organization (like Slack/Discord)
- Cross-platform: web + iOS/Android mobile app
- Scalable to thousands of concurrent users per channel

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Clients                          │
│                                                         │
│  ┌──────────────┐         ┌──────────────────────────┐  │
│  │  Web Client  │         │     Mobile Client        │  │
│  │  Next.js 16  │         │  React Native (Expo)     │  │
│  │  React 19    │         │  iOS + Android            │  │
│  │  TypeScript  │         │  TypeScript               │  │
│  └──────┬───────┘         └──────────┬───────────────┘  │
│         │                            │                  │
│         └──────────┬─────────────────┘                  │
│                    │                                    │
│              ┌─────▼─────┐                              │
│              │   Clerk   │  Authentication              │
│              └─────┬─────┘                              │
│                    │ JWT                                 │
└────────────────────┼────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │   FastAPI Backend   │
          │   Python 3.13       │
          │                     │
          │  REST + SSE + WS    │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │  AWS DynamoDB       │
          │  5 tables           │
          │  PAY_PER_REQUEST    │
          └─────────────────────┘
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Web Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui | Latest React with SSR, utility-first styling |
| Mobile Frontend | React Native (Expo SDK 55), TypeScript | Cross-platform iOS/Android from single codebase |
| Authentication | Clerk | Drop-in auth with JWT, OAuth, MFA, user management |
| Backend | FastAPI (Python 3.13), Uvicorn | Async-native, auto Swagger docs, Pydantic validation |
| Database | AWS DynamoDB (5 tables) | Serverless, zero idle cost, single-digit ms latency |
| Real-time | SSE (production) + WebSocket (local dev) | SSE works on App Runner; WS for full-duplex locally |
| Infrastructure | Terraform, AWS (DynamoDB, ECR, App Runner) | Declarative, reproducible, managed container hosting |
| Mobile Deploy | EAS Build + TestFlight | Expo's cloud build service for iOS distribution |

---

## 3. Data Model

All tables use **PAY_PER_REQUEST** billing. Deployed via Terraform in `us-west-2`. Table prefix: `chatroom-{environment}`.

### Entity Relationship

```
users ──────────┐
                │
chat_rooms ─────┤
                ├──→ room_members (many-to-many join)
messages ───────┤
                │
connections ────┘
```

### 3.1 Users Table

| Property | Value |
|----------|-------|
| PK | `userId` (String) — Clerk user ID |
| GSIs | `email-index`, `username-index` |
| Attributes | userId, username, email, avatarUrl, createdAt, updatedAt |

### 3.2 Chat Rooms Table

| Property | Value |
|----------|-------|
| PK | `roomId` (String, UUID) |
| GSI | `createdBy-index` |
| Attributes | roomId, name, description, createdBy, createdAt, updatedAt |

### 3.3 Room Members Table

| Property | Value |
|----------|-------|
| PK | `roomId` (String), SK | `userId` (String) |
| GSI | `userId-index` (find all rooms for a user) |
| Attributes | roomId, userId, role (admin/member), joinedAt, lastReadAt |

### 3.4 Messages Table

| Property | Value |
|----------|-------|
| PK | `roomId` (String) |
| SK | `sortKey` — format: `{ISO timestamp}#{UUID}` |
| GSI | `senderId-index` |
| Attributes | roomId, sortKey, messageId, senderId, senderName, content, type, createdAt, editedAt |

**Sort key design**: ISO timestamps sort lexicographically in DynamoDB. UUID suffix prevents collisions for same-millisecond messages. Enables efficient range queries (`sortKey > :timestamp`).

> **Hot Partition Risk**: All messages for a room share the same partition key (`roomId`). High-traffic rooms can overwhelm a single partition. Mitigation for scale: shard by `roomId#bucket` (Discord's approach).

### 3.5 Connections Table

| Property | Value |
|----------|-------|
| PK | `connectionId` (String, UUID) |
| GSIs | `userId-index`, `roomId-index` |
| Attributes | connectionId, userId, roomId, connectedAt |

### Access Patterns

| Query | Table | Index | Key |
|-------|-------|-------|-----|
| Get user by ID | users | Primary | `userId = X` |
| Find user by email | users | email-index | `email = X` |
| List all rooms | chat_rooms | Scan | — |
| Members in room | room_members | Primary | `roomId = X` |
| Rooms I'm in | room_members | userId-index | `userId = myId` |
| Messages in room (time-sorted) | messages | Primary | `roomId = X` (SK sorted) |
| Active users in room | connections | roomId-index | `roomId = X` |

---

## 4. API Design

Base URL: `http://localhost:8000` (dev) / App Runner URL (prod)

### Users — `/api/users/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all users |
| GET | `/{user_id}` | Get user by ID |
| POST | `/` | Create/upsert user (synced from Clerk) |
| PUT | `/{user_id}` | Update user |
| DELETE | `/{user_id}` | Delete user |
| GET | `/by-email/{email}` | Lookup via GSI |
| GET | `/by-username/{username}` | Lookup via GSI |

### Rooms — `/api/rooms/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all rooms |
| GET | `/{room_id}` | Get room details |
| POST | `/` | Create room (auto-joins creator as admin) |
| PUT | `/{room_id}` | Update room metadata |
| DELETE | `/{room_id}` | Delete room |

### Members — `/api/members/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{room_id}` | List members (enriched with user data) |
| POST | `/{room_id}/join` | Join room (validates room exists, prevents dupes) |
| DELETE | `/{room_id}/leave/{user_id}` | Leave room |
| DELETE | `/{room_id}/kick/{user_id}` | Admin-only kick |

### Messages — `/api/messages/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{room_id}` | Paginated messages (cursor-based, default 50) |
| POST | `/{room_id}` | Send message + broadcast via SSE/WS |
| PUT | `/{room_id}/{sort_key}` | Edit message |
| DELETE | `/{room_id}/{sort_key}` | Delete message |

### Real-time — `/api/sse/` and `/ws/`

| Endpoint | Protocol | Description |
|----------|----------|-------------|
| `GET /api/sse/{room_id}` | SSE | Subscribe to room events (production) |
| `WS /ws/{room_id}/{user_id}` | WebSocket | Full-duplex connection (local dev) |

---

## 5. Real-time Messaging

### Production: Server-Sent Events (SSE)

SSE is the primary real-time transport because **AWS App Runner doesn't support WebSocket upgrades**.

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

- Each subscriber gets an `asyncio.Queue` (max 100 events)
- Keepalive every 30 seconds to prevent timeout
- Auto-reconnect built into the EventSource API

### Local Dev: WebSocket

Full-duplex messaging with typing indicators, presence tracking.

**Client → Server**: `message`, `typing`, `stop_typing`
**Server → Client**: `new_message`, `user_joined`, `user_left`, `typing`, `active_users`

WebSocket messages also publish to SSE for cross-protocol compatibility.

### Optimistic Updates

Messages appear instantly in the UI before server confirmation:

```
1. User hits Send → message added to local state immediately
2. POST to server in background
3. SSE delivers "real" message → deduplication prevents double-showing
4. If POST fails → remove optimistic message
```

Deduplication checks: same message ID, or same user + content within 5 seconds.

---

## 6. Authentication Flow

```
1. User signs up/in via Clerk (web or mobile)
2. Clerk issues JWT, manages session
3. On first /chat load → POST /api/users/ (upsert)
4. Clerk user ID = userId in all tables
5. Mobile uses expo-secure-store for token caching
```

### Web
- `ClerkProvider` wraps the app in `layout.tsx`
- Middleware redirects unauthenticated users to `/sign-in`
- `UserButton` component for profile/sign-out

### Mobile
- `ClerkProvider` with `expo-secure-store` token cache
- Navigation guards: signed-in → ChatScreen, signed-out → SignInScreen
- Same Clerk publishable key as web

---

## 7. Frontend Architecture

### Web (Next.js)

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout + ClerkProvider
│   ├── page.tsx            # Landing page
│   ├── chat/page.tsx       # Main chat (state management hub)
│   ├── sign-in/            # Clerk sign-in
│   └── sign-up/            # Clerk sign-up
├── components/
│   ├── chat/
│   │   ├── sidebar.tsx     # Channel list, create channel, user profile
│   │   ├── chat-area.tsx   # Messages, input, date dividers
│   │   └── members-panel.tsx # Online/offline member list
│   └── ui/                 # shadcn/ui components
└── lib/
    ├── api.ts              # API client with field normalization
    └── utils.ts            # Utility functions
```

### Mobile (React Native / Expo)

```
mobile-app/
├── App.tsx                 # ClerkProvider + SafeAreaProvider + Navigation
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx  # Auth guard + Stack navigator
│   ├── screens/
│   │   ├── ChatScreen.tsx    # Main chat (state management hub)
│   │   ├── SignInScreen.tsx   # Email/password sign-in
│   │   └── SignUpScreen.tsx   # Sign-up + email verification
│   ├── components/chat/
│   │   ├── Sidebar.tsx       # Drawer: channels, create modal, user footer
│   │   ├── ChatArea.tsx      # FlatList messages, input, date dividers
│   │   └── MembersPanel.tsx  # Drawer: online/offline members
│   ├── services/
│   │   └── api.ts            # Shared API client
│   ├── constants/
│   │   ├── theme.ts          # Color palette matching web
│   │   ├── types.ts          # Shared TypeScript interfaces
│   │   └── api.ts            # API URL config
│   └── hooks/
│       └── useTokenCache.ts  # Clerk token cache (SecureStore)
└── eas.json                # EAS Build profiles
```

### Three-Panel Layout (Discord/Slack Pattern)

| Panel | Web | Mobile |
|-------|-----|--------|
| Left sidebar (channels) | 260px fixed | Drawer from left (modal) |
| Center (messages) | Flex, max-w-3xl | Full screen |
| Right panel (members) | 240px fixed, toggleable | Drawer from right (modal) |

---

## 8. Design System

Light theme inspired by modern SaaS (Linear, Notion, Vercel).

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `text` | `#171717` | Primary text (neutral-900) |
| `textSecondary` | `#404040` | Secondary text (neutral-700) |
| `textMuted` | `#a3a3a3` | Muted/placeholder (neutral-400) |
| `background` | `#ffffff` | Main background |
| `sidebar` | `#fafafa` | Sidebar background (neutral-50) |
| `sidebarActive` | `#171717` | Active channel pill (neutral-900) |
| `border` | `#e5e5e5` | All borders (neutral-200) |
| `green` | `#10b981` | Online indicator (emerald-500) |
| `primary` | `#171717` | Buttons, send icon |

### Typography

| Element | Web | Mobile |
|---------|-----|--------|
| Headings | Newsreader (serif) | System serif |
| Body | Inter (sans-serif) | System sans |
| Code/mono | Geist Mono | System mono |

---

## 9. Infrastructure

### Terraform (infra/main.tf)

- AWS provider: `us-west-2`
- 5 DynamoDB tables with GSIs
- All PAY_PER_REQUEST billing
- Environment prefix: `chatroom-{dev|prod}`

### Deployment

| Component | Platform | Method |
|-----------|----------|--------|
| Backend | AWS App Runner | Docker (ECR) |
| Web Frontend | Vercel (or static) | Git push |
| Mobile | EAS Build → TestFlight | `eas build --platform ios` |
| Database | AWS DynamoDB | Terraform |

### Mobile Distribution

```
EAS Build (cloud) → .ipa artifact → EAS Submit → TestFlight → App Store
```

- Bundle ID: `com.chatroom.mobile`
- EAS project: `@arihantchoudhary/chatroom-mobile`
- Build profiles: development (dev client), preview (internal), production (App Store)

---

## 10. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | DynamoDB over PostgreSQL | Zero idle cost, serverless, natural key-value fit for chat |
| Real-time | SSE over WebSocket (prod) | App Runner doesn't support WS upgrades |
| Auth | Clerk over custom JWT | 5-minute setup, handles OAuth/MFA/sessions |
| Mobile framework | React Native (Expo) | Cross-platform, shared TypeScript types with web |
| State management | React state + props | Sufficient for this scope, no Redux overhead |
| Member data | Enrichment over denormalization | Avoids stale usernames/avatars, acceptable N+1 at small scale |
| Pub/sub | In-memory over Redis | Single instance, no cross-process communication needed |
| Message sorting | ISO timestamp#UUID sortKey | Lexicographic sort in DynamoDB, collision-free |

---

## 11. Scaling Considerations

### Current Limitations
- In-memory pub/sub: single instance only
- DynamoDB hot partition: high-traffic rooms bottleneck on `roomId` partition key
- No message caching layer

### Path to Scale
1. **Multi-instance**: Replace in-memory pub/sub with Redis Pub/Sub
2. **Hot partition**: Shard messages by `roomId#bucket` (Discord's approach: bucket = timestamp // interval)
3. **Caching**: Add Redis/ElastiCache for frequently accessed rooms and member lists
4. **CDN**: CloudFront for static assets
5. **Read replicas**: DynamoDB global tables for multi-region reads

---

## 12. Security

- All auth via Clerk JWT (not custom tokens)
- CORS configured on backend (currently `allow_all` for dev — lock down for prod)
- No secrets in client bundles (Clerk publishable keys are meant to be public)
- Mobile token storage via `expo-secure-store` (iOS Keychain / Android Keystore)
- `ITSAppUsesNonExemptEncryption: false` declared for App Store compliance

---

## 13. Testing Strategy

| Layer | Approach |
|-------|----------|
| Backend | FastAPI TestClient + pytest |
| Frontend | Vitest + React Testing Library |
| Mobile | Jest + React Native Testing Library |
| E2E | Manual QA via Expo Go / Simulator |
| API | Swagger UI auto-generated at `/docs` |

---

## 14. File Structure

```
takehome-arihant-choudhary/
├── frontend/          # Next.js web client
├── backend/           # FastAPI server
├── mobile-app/        # React Native (Expo) mobile client
├── infra/             # Terraform (DynamoDB tables)
├── obsidian-vault/    # Architecture documentation
├── CLAUDE.md          # AI assistant instructions
├── TECHNICAL_DESIGN.md # This document
└── README.md
```
