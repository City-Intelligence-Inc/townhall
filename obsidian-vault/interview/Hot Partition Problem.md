# Hot Partition Problem (Discord Case Study)

> Source: "How Discord stored trillions of messages" — Engineering at Scale / Discord Engineering Blog

## What Is a Hot Partition?

In a distributed database, data is split across **partitions** (shards). A **hot partition** is when one partition gets disproportionately more traffic than others, causing:
- Performance bottlenecks
- Increased latency across the entire cluster
- Cascading failures affecting other queries

## How This Applies to Our App

Our `messages` table:
```
PK: roomId    SK: sortKey (timestamp#messageId)
```

All messages for a room live in the **same DynamoDB partition**. If a room gets heavy traffic (imagine @everyone in a 10,000-person channel), all reads hit one partition.

This is **exactly** Discord's design:
```
Discord's schema:
PK: channel_id + bucket    (partition key)
Messages stored per-channel, per-time-window
```

## Discord's Problem

1. Someone posts `@everyone` in a large channel
2. All users rush to read the message simultaneously
3. Backend sends N concurrent queries to the **same partition**
4. Partition gets overloaded → latency spikes → cascading failures

## Discord's Solution: Two Parts

### Part 1: Request Coalescing

Discord added a **Data Services** layer between their backend monolith and Cassandra:

```
Backend Monolith                    Database
      │                                │
      ├── Request 1 ─┐                 │
      ├── Request 2 ──┤ Data Service   │
      ├── Request 3 ──┤ (Rust)    ───→ │ Single DB query
      ├── Request N ──┘                 │
      │                                │
```

**How it works**:
1. First request for a key → spins up a **worker task**
2. Subsequent requests for the same key → **subscribe** to the existing task
3. Worker task makes **one** DB query
4. Result is fanned out to all N subscribers

**Result**: N concurrent reads become 1 DB read.

### Part 2: Consistent Hash-Based Routing

The backend monolith uses `channelId` to **hash-route** requests to a specific Data Service instance:

```
channelId = "abc123"
hash("abc123") % num_instances = instance_2

→ All requests for channel "abc123" go to instance_2
→ Request coalescing works because all concurrent reads for the same channel hit the same process
```

Without this, coalescing wouldn't work — requests for the same channel would scatter across instances.

### Why Rust?

Discord chose Rust for Data Services because:
- C/C++ equivalent performance without memory safety issues
- Safe concurrency primitives (async/await, channels)
- No garbage collector pauses

## How We'd Apply This

```
Current:
  FastAPI → DynamoDB

With coalescing:
  FastAPI → Redis Cache → DynamoDB
              │
              └── Key: (roomId, query_hash)
                  TTL: 100ms - 1s
                  On cache miss: query DB, populate cache
                  Concurrent requests: await the same cache population
```

For our app specifically:
1. **Add Redis** between FastAPI and DynamoDB
2. **Cache hot room messages** with short TTL (e.g., 500ms)
3. **Use asyncio locks** per room_id to coalesce concurrent reads
4. **Consistent routing** would matter if we scale to multiple FastAPI instances — use the room_id in the load balancer's hash

## Did It Solve Everything?

**No.** Discord still saw occasional hot partitions after implementing request coalescing. They eventually:
1. Migrated from **Cassandra to ScyllaDB** (better I/O scheduling)
2. Used **super-disk storage topology** (better hardware)
3. These changes, combined with request coalescing, stabilized the system

## Key Takeaway for the Interview

> "Our messages table uses roomId as the partition key — same as Discord's channel_id. At scale, popular rooms cause hot partitions. Discord solved this with request coalescing (a Rust data services layer that deduplicates concurrent DB reads) and consistent hash routing (so the same channel always hits the same service instance). For our app, I'd add a Redis caching layer with short TTLs and asyncio-based read coalescing."

## Related
- [[data-model/Messages Table]]
- [[interview/Talking Points]]
- [[interview/Design Decisions]]
