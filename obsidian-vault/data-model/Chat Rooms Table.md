# Chat Rooms Table

**Table**: `chatroom-dev-chat-rooms`

## Schema

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| `roomId` | String | PK | UUID, generated on creation |
| `name` | String | — | Channel name (e.g. "general") |
| `description` | String | — | Optional channel description |
| `createdBy` | String | GSI (`createdBy-index`) | userId of creator |
| `createdAt` | String (ISO) | — | Creation timestamp |
| `updatedAt` | String (ISO) | — | Last update timestamp |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rooms/` | List all rooms |
| GET | `/api/rooms/{room_id}` | Get by ID |
| POST | `/api/rooms/` | Create room |
| PUT | `/api/rooms/{room_id}` | Update room |
| DELETE | `/api/rooms/{room_id}` | Delete room |
| GET | `/api/rooms/by-creator/{user_id}` | GSI: rooms by creator |

## Auto-Join on Create

When a room is created, the creator is **automatically added** to [[data-model/Room Members Table]] as an admin:

```python
room_members_table.put_item(Item={
    "roomId": room_id,
    "userId": body.created_by,
    "role": "admin",
    "joinedAt": now,
    "lastReadAt": now,
})
```

## Seeding

The frontend seeds a "general" room if no rooms exist on first load:
```typescript
if (mapped.length === 0 && user) {
  const room = await api.createRoom({
    name: "general",
    description: "Company-wide announcements and chat",
    created_by: user.id,
  });
}
```

## Related
- [[data-model/Tables Overview]]
- [[data-model/Room Members Table]]
