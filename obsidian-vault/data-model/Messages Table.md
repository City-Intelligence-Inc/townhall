# Messages Table

**Table**: `chatroom-dev-messages`

## Schema

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| `roomId` | String | PK | Room this message belongs to |
| `sortKey` | String | SK | `{ISO timestamp}#{UUID}` for ordering |
| `messageId` | String | — | UUID of the message |
| `senderId` | String | GSI (`senderId-index`) | Who sent it |
| `senderName` | String | — | Display name at time of send |
| `content` | String | — | Message text |
| `type` | String | — | "text" (extensible to "image", "file") |
| `createdAt` | String (ISO) | — | When sent |
| `editedAt` | String (ISO) | — | When last edited (null if never) |

## Sort Key Design

The sort key is `{ISO timestamp}#{messageId}`:
```
2026-03-23T21:40:03.691810+00:00#ba00a87d-e14f-4b18-a182-f8743405be39
```

This gives us:
- **Time ordering** — DynamoDB sorts strings lexicographically, ISO timestamps sort correctly
- **Uniqueness** — UUID suffix prevents collisions for same-millisecond messages
- **Efficient range queries** — Can query messages after/before a timestamp

## Pagination

Cursor-based using DynamoDB's `LastEvaluatedKey`:
```python
params = {
    "KeyConditionExpression": "roomId = :rid",
    "ScanIndexForward": False,  # newest first
    "Limit": limit,
}
if cursor:
    params["ExclusiveStartKey"] = json.loads(unquote(cursor))
```

Frontend passes `?limit=50&cursor=<encoded_key>`.

## Hot Partition Risk

> [!warning] All messages for a room share the same partition key
> This is the exact same design Discord used with Cassandra. At massive scale, a popular room (like @everyone ping) causes all reads to hit one partition. See [[interview/Hot Partition Problem]].

## Related
- [[data-model/Tables Overview]]
- [[backend/Real-time]]
- [[interview/Hot Partition Problem]]
