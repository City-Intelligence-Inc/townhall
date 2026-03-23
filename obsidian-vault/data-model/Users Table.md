# Users Table

**Table**: `chatroom-dev-users`

## Schema

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| `userId` | String | PK | Clerk user ID (set on sync) |
| `username` | String | GSI (`username-index`) | Display name |
| `email` | String | GSI (`email-index`) | User email |
| `avatarUrl` | String | — | Profile image URL (from Clerk) |
| `createdAt` | String (ISO) | — | First sync timestamp |
| `updatedAt` | String (ISO) | — | Last sync timestamp |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/` | List all users |
| GET | `/api/users/{user_id}` | Get by ID |
| POST | `/api/users/` | Create/upsert (Clerk sync) |
| PUT | `/api/users/{user_id}` | Update profile |
| DELETE | `/api/users/{user_id}` | Delete user |
| GET | `/api/users/by-email/{email}` | GSI lookup |
| GET | `/api/users/by-username/{username}` | GSI lookup |

## Upsert Logic

The POST endpoint is an **upsert** — used by the frontend on every login to sync Clerk data:

```python
# If user exists, update username + avatar
existing = users_table.get_item(Key={"userId": user_id}).get("Item")
if existing:
    users_table.update_item(...)
    return existing
# Otherwise create new
users_table.put_item(Item=item)
```

The frontend calls this in `app/chat/page.tsx`:
```typescript
api.syncUser({
  id: user.id,           // Clerk ID
  username: user.fullName,
  email: user.primaryEmailAddress?.emailAddress,
  avatar_url: user.imageUrl,
});
```

## Related
- [[data-model/Tables Overview]]
- [[backend/API Reference]]
