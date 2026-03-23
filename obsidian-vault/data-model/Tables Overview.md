# DynamoDB Tables Overview

All tables use **PAY_PER_REQUEST** billing (zero cost at idle, scales automatically).
Deployed via [[infrastructure/Terraform]] in `us-west-2`.

## Table Map

```
users ──────────┐
                │
chat_rooms ─────┤
                ├──→ room_members (many-to-many join)
messages ───────┤
                │
connections ────┘
```

## 1. Users Table

See: [[data-model/Users Table]]

| Property | Value |
|----------|-------|
| Table name | `chatroom-dev-users` |
| PK | `userId` (String) — Clerk user ID |
| GSIs | `email-index`, `username-index` |

**Attributes**: userId, username, email, avatarUrl, createdAt, updatedAt

## 2. Chat Rooms Table

See: [[data-model/Chat Rooms Table]]

| Property | Value |
|----------|-------|
| Table name | `chatroom-dev-chat-rooms` |
| PK | `roomId` (String, UUID) |
| GSI | `createdBy-index` |

**Attributes**: roomId, name, description, createdBy, createdAt, updatedAt

## 3. Room Members Table

See: [[data-model/Room Members Table]]

| Property | Value |
|----------|-------|
| Table name | `chatroom-dev-room-members` |
| PK | `roomId` (String) |
| SK | `userId` (String) |
| GSI | `userId-index` (find all rooms for a user) |

**Attributes**: roomId, userId, role (admin/member), joinedAt, lastReadAt

## 4. Messages Table

See: [[data-model/Messages Table]]

| Property | Value |
|----------|-------|
| Table name | `chatroom-dev-messages` |
| PK | `roomId` (String) |
| SK | `sortKey` (String) — format: `{ISO timestamp}#{UUID}` |
| GSI | `senderId-index` |

**Attributes**: roomId, sortKey, messageId, senderId, senderName, content, type, createdAt, editedAt

> [!important] Hot Partition Risk
> All messages for a room share the same partition key (`roomId`). High-traffic rooms can overwhelm a single partition. See [[interview/Hot Partition Problem]] for Discord's solution.

## 5. Connections Table

See: [[data-model/Connections Table]]

| Property | Value |
|----------|-------|
| Table name | `chatroom-dev-connections` |
| PK | `connectionId` (String, UUID) |
| GSIs | `userId-index`, `roomId-index` |

**Attributes**: connectionId, userId, roomId, connectedAt

## Access Patterns

| Query | Table | Index | Key |
|-------|-------|-------|-----|
| Get user by ID | users | Primary | `userId = X` |
| Find user by email | users | email-index | `email = X` |
| Find user by username | users | username-index | `username = X` |
| List all rooms | chat_rooms | Scan | — |
| Rooms I created | chat_rooms | createdBy-index | `createdBy = myId` |
| Members in room | room_members | Primary | `roomId = X` |
| Rooms I'm in | room_members | userId-index | `userId = myId` |
| Messages in room (time-sorted) | messages | Primary | `roomId = X` (SK sorted) |
| My messages across rooms | messages | senderId-index | `senderId = myId` |
| Active users in room | connections | roomId-index | `roomId = X` |
| My active connections | connections | userId-index | `userId = myId` |

## Related
- [[infrastructure/Terraform]]
- [[interview/Hot Partition Problem]]
- [[interview/Design Decisions]]
