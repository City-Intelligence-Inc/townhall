# Feature Status

> What's working, what's API-only, what's a placeholder.

## Fully Working (End-to-End)

| Feature | How |
|---------|-----|
| User auth | Clerk sign-in/sign-up, synced to DynamoDB |
| Create/join rooms | POST /api/rooms + auto-join creator |
| Room switching | Loads messages + members on select |
| Send messages | Optimistic UI + REST POST + SSE broadcast |
| Receive messages (real-time) | SSE `new_message` event with deduplication |
| Delete messages | Hover action → optimistic remove + DELETE + SSE `message_deleted` broadcast |
| Edit messages | Hover action → inline edit input + PUT + SSE `message_edited` broadcast |
| Message reactions | Emoji picker → toggle POST + SSE `reaction_update` broadcast |
| Reply/threading | Reply action → quoted preview + `replyTo`/`replyPreview` fields on message |
| Typing indicators | SSE `typing`/`stop_typing` events + animated dot indicator |
| Message search | Cmd+K modal → full-text search across messages, click to navigate |
| Message grouping | Discord-style: same author within 5 min = compact |
| Date dividers | Today / Yesterday / full date labels |
| Member list | Enriched with username/avatar from users table |
| Presence tracking | Connection registered per room, polled every 10s |
| Online/offline status | Members panel shows green/gray dots |
| Unread badges | Red badge on sidebar channels with unread count |
| Mark as read | Auto-marks on room enter + after sending |
| Room seeding | Auto-creates "general" on first use |
| Onboarding | 5-step tour on first login |
| File uploads | Paperclip button → upload to S3 → markdown link in message |
| Rich text | Bold, italic, code, links, blockquotes, markdown rendering |
| Moderation (backend) | Mute, ban, kick endpoints with admin role checks |

## Backend Done, No Frontend UI

| Feature | API Endpoint | What's Missing |
|---------|-------------|----------------|
| Kick member | `DELETE /api/members/{room}/kick/{uid}` | No kick button in MembersPanel |
| Leave room | `DELETE /api/members/{room}/leave/{uid}` | No leave button in Sidebar |
| Mute member | `POST /api/members/{room}/mute/{uid}` | No mute UI |
| Ban member | `POST /api/members/{room}/ban/{uid}` | No ban UI |
| Pagination (load more) | `?cursor=...` param | Frontend loads once, no infinite scroll |

## Placeholder / Not Implemented

| Feature | Current State |
|---------|--------------|
| Voice/video | Not started |
| End-to-end encryption | Not started |
| @ mentions | Button exists, no autocomplete |
| Dark mode | Not started |

## Production Limitations

| Limitation | Reason | Workaround |
|-----------|--------|------------|
| No WebSocket in prod | App Runner doesn't support WS upgrade | SSE for all real-time |
| Single-instance pub/sub | In-memory SSE channels | Redis Pub/Sub at scale |
| Search is DynamoDB scan | No OpenSearch | Fine for <10k messages |

## Mobile Parity Status

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| Email/password auth | Clerk `<SignUp>`/`<SignIn>` | Custom forms + Clerk hooks | Both work with same Clerk project |
| Google OAuth | Clerk built-in | `useOAuth('oauth_google')` + Ionicons icon | |
| Apple OAuth | Clerk built-in | `useOAuth('oauth_apple')` + Ionicons icon | |
| Auth token injection | `setTokenProvider(getToken)` | `setTokenProvider(getToken)` | Same pattern |
| User sync to backend | `{ id, username, email, avatar_url }` | `{ id, username, email, avatar_url }` | Now at parity |
| Room CRUD | Full | Create + list + join | No leave/delete on mobile |
| Send messages | Optimistic + SSE | Optimistic + WebSocket | |
| Real-time receive | SSE | WebSocket | Different transport, same result |
| Message edit/delete | Hover actions | Not yet | |
| Reactions | Emoji picker | Not yet | |
| Reply/threading | Reply action | Not yet | |
| Typing indicators | SSE typing events | Not yet | |
| Search | Cmd+K modal | Not yet | |
| File uploads | Paperclip + S3 | Not yet | |
| Unread badges | Red badge on sidebar | Not yet | |

## Related
- [[frontend/Components]]
- [[backend/API Reference]]
- [[mobile/Test Plan]]
- [[interview/Talking Points]]
