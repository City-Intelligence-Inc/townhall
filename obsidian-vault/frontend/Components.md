# Frontend Components

## Component Tree

```
RootLayout (layout.tsx)
  └── ClerkProvider
        ├── LandingPage (page.tsx)         — "/" route
        ├── SignIn (sign-in/page.tsx)       — "/sign-in"
        ├── SignUp (sign-up/page.tsx)       — "/sign-up"
        └── ChatPage (chat/page.tsx)        — "/chat" (protected)
              ├── Sidebar
              ├── ChatArea
              └── MembersPanel (toggleable)
```

## ChatPage (`app/chat/page.tsx`)

**The brain of the app.** All state lives here and flows down as props.

### State

| State | Type | Purpose |
|-------|------|---------|
| `rooms` | `Room[]` | All chat rooms |
| `activeRoomId` | `string \| null` | Currently selected room |
| `messages` | `Message[]` | Messages in active room |
| `members` | `Member[]` | Members of active room |
| `showMembers` | `boolean` | Toggle right panel |
| `loading` | `boolean` | Initial load spinner |
| `sseRef` | `useRef<EventSource>` | SSE connection ref |

### Effects (5)

1. **Sync user** — Upserts Clerk user to DynamoDB on load (Clerk ID = userId)
2. **Load rooms** — Fetches all rooms; seeds "general" if empty; auto-joins user to room on switch
3. **Load room data** — When `activeRoomId` changes, fetches messages + members; registers connection for presence
4. **SSE subscription** — Opens EventSource, listens for `new_message` events + generic `onmessage`; deduplicates by messageId AND by (user+content+5s window)
5. (Cleanup) — Closes SSE on room change / unmount

### Key Behaviors

| Behavior | Detail |
|----------|--------|
| **Optimistic sends** | Message added to state instantly with `tempId`, server confirms via SSE |
| **SSE deduplication** | Checks messageId match OR same user+content within 5 seconds |
| **Auto-join** | Switching to a room auto-calls `joinRoom()` (silent catch) |
| **Room seeding** | Creates "general" room if no rooms exist on first load |
| **Connection tracking** | Registers `${userId}-${roomId}` connection for presence |

### Key Handlers

| Handler | What it does |
|---------|-------------|
| `handleSend(content)` | Optimistic add + `api.sendMessage()` |
| `handleCreateRoom(name, desc)` | Creates room, joins, switches to it |

## Sidebar (`components/chat/sidebar.tsx`)

**260px left panel.**

### Props
```typescript
{ rooms, activeRoomId, onSelectRoom, onCreateRoom }
```

### Features
- **Header**: "Townhall" title + search icon
- **Channel list**: Scrollable, active room highlighted (black bg)
- **Create channel**: Opens Dialog modal with name (# prefix) + description
- **User panel**: Clerk `<UserButton>`, full name, green "Active" dot

### Create Channel Modal
- Name is slugified: `Plan Budget` → `plan-budget`
- Enter key or Create button to submit
- Disabled until name is filled

## ChatArea (`components/chat/chat-area.tsx`)

**The main content area (flex, takes remaining space).**

### Props
```typescript
{ roomName, roomDescription, messages, onSendMessage, onToggleMembers, showMembers, typingUsers }
```

### Message Rendering

**Grouping rules** (Discord-style):
- Messages grouped by date (divider: "Today", "Yesterday", "Monday, March 23")
- Within a date, same author within 5 min → **compact** (no avatar, time on hover)
- Different author or >5 min gap → **full** (avatar + name + timestamp)

**Compact message**:
```
                    [hover: 2:35 PM] Hello again!
```

**Full message**:
```
[Avatar] Sarah Chen  2:34 PM
         Hello world!
```

### Input
- Auto-sizing `<textarea>` (grows up to 150px)
- Enter to send, Shift+Enter for newline
- Placeholder: "Message #general"
- Send button (disabled when empty)

### Auto-scroll
```typescript
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
```

## MembersPanel (`components/chat/members-panel.tsx`)

**240px right panel (toggleable).**

### Props
```typescript
{ members: Member[] }
```

### Sections
- **Online** — Green dot, full opacity
- **Offline** — Gray dot, 50% opacity
- Counts shown next to section headers
- Avatar + username per member

## UI Components (shadcn/ui)

All in `components/ui/`, built on `@base-ui/react`:

| Component | Used By |
|-----------|---------|
| `Button` | Sidebar, ChatArea, landing page |
| `Input` | Create channel modal |
| `Avatar` | ChatArea messages, MembersPanel |
| `ScrollArea` | Sidebar channel list, MembersPanel |
| `Separator` | Sidebar (above user panel) |
| `Dialog` | Create channel modal |

## Onboarding (`components/chat/onboarding.tsx`)

**5-step interactive tour for first-time users.**

- Checks `localStorage` for `townhall_onboarded` flag
- Steps: Welcome, Channels, Messaging, Members, Ready
- Progress bar + skip/next buttons
- Animated transitions between steps
- Sets flag on completion so it only shows once

## Feature Status

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| CRUD rooms | Done | Done | Auto-seed "general" |
| Send/receive messages | Done | Done | Optimistic + SSE |
| Real-time (SSE) | Done | Done | Production transport |
| Real-time (WebSocket) | Done | Local only | App Runner doesn't support WS |
| Message edit/delete | Done | **No UI** | API works, no frontend buttons |
| Typing indicators | Done (WS) | **Not wired** | `typingUsers` prop always `[]` |
| Message search | Not done | Search icon exists | **Non-functional** placeholder |
| Infinite scroll / pagination | Done (API) | **Not used** | Single load on room switch |
| Presence polling | Done | Done | Registers connection per room |
| Onboarding | N/A | Done | 5-step tour |

## Related
- [[frontend/API Client]]
- [[frontend/Feature Status]]
- [[architecture/Overview]]
