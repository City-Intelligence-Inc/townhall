# Townhall — Chat Room Application

> Mechanize take-home challenge. Discord/Slack-style real-time chat.
> Last synced: 2026-03-23 3:35 PM PST

## Quick Links

| What | Where |
|------|-------|
| Live API | `https://9rjvhfdkqt.us-west-2.awsapprunner.com` |
| Swagger Docs | `https://9rjvhfdkqt.us-west-2.awsapprunner.com/docs` |
| Frontend (local) | `http://localhost:3000` |
| AWS Region | `us-west-2` |
| AWS Account | `050451400186` |

## Architecture at a Glance

```
Browser (Next.js 16 + Clerk)
    |
    |--- REST (CRUD) ---------> FastAPI (App Runner)
    |--- SSE (real-time) -----> FastAPI /api/sse/{room_id}
    |--- WebSocket (local) ---> FastAPI /ws/{room_id}/{user_id}
                                    |
                                    v
                              DynamoDB (5 tables)
```

## Map of This Vault

- [[architecture/Overview]] — Full system architecture
- [[data-model/Tables Overview]] — All 5 DynamoDB tables
- [[backend/API Reference]] — Every endpoint
- [[backend/Real-time]] — SSE + WebSocket design
- [[frontend/Components]] — React component tree
- [[frontend/API Client]] — How frontend talks to backend
- [[infrastructure/Terraform]] — IaC and deployment
- [[infrastructure/Deployment]] — Docker + ECR + App Runner
- [[interview/Talking Points]] — What to say in the call
- [[interview/Hot Partition Problem]] — Discord system design deep dive
- [[interview/Design Decisions]] — Why we chose what we chose
- [[frontend/Feature Status]] — What's working vs TODO
