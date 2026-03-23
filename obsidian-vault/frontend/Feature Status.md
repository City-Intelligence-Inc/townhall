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
| Message grouping | Discord-style: same author within 5 min = compact |
| Date dividers | Today / Yesterday / full date labels |
| Member list | Enriched with username/avatar from users table |
| Presence tracking | Connection registered per room |
| Room seeding | Auto-creates "general" on first use |
| Onboarding | 5-step tour on first login |

## Backend Done, No Frontend UI

| Feature | API Endpoint | What's Missing |
|---------|-------------|----------------|
| Edit message | `PUT /api/messages/{room}/{key}` | No edit button/modal in ChatArea |
| Delete message | `DELETE /api/messages/{room}/{key}` | No delete button in ChatArea |
| Kick member | `DELETE /api/members/{room}/kick/{uid}` | No kick button in MembersPanel |
| Leave room | `DELETE /api/members/{room}/leave/{uid}` | No leave button in Sidebar |
| Typing indicators | WS `type: "typing"` | `typingUsers` prop always `[]` |
| Pagination (load more) | `?cursor=...` param | Frontend loads once, no infinite scroll |

## Placeholder / Not Implemented

| Feature | Current State |
|---------|--------------|
| Search | Icon in sidebar, not wired up |
| File uploads | Not started |
| Read receipts | `lastReadAt` field exists, not used |
| Voice/video | Not started |
| End-to-end encryption | Not started |
| Moderation tools | Kick endpoint exists, no UI |

## Production Limitations

| Limitation | Reason | Workaround |
|-----------|--------|------------|
| No WebSocket in prod | App Runner doesn't support WS upgrade | SSE for real-time |
| No typing indicators in prod | Requires WebSocket | Could use REST polling |
| Single-instance pub/sub | In-memory SSE channels | Redis Pub/Sub at scale |

## Related
- [[frontend/Components]]
- [[backend/API Reference]]
- [[interview/Talking Points]]
