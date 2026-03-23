# Deployment

## Architecture

```
Dockerfile → Docker Image → ECR → App Runner
                                      │
                                      ├── Auto-scaling (0.25 vCPU, 512MB)
                                      ├── HTTPS endpoint
                                      └── IAM role → DynamoDB access
```

## Components

### ECR Repository
- **Name**: `chatroom-api`
- **URI**: `050451400186.dkr.ecr.us-west-2.amazonaws.com/chatroom-api`

### App Runner Service
- **Name**: `chatroom-api`
- **URL**: `https://9rjvhfdkqt.us-west-2.awsapprunner.com`
- **CPU**: 0.25 vCPU
- **Memory**: 512 MB
- **Port**: 8000

### IAM Roles

| Role | Purpose | Trust |
|------|---------|-------|
| `chatroom-apprunner-ecr-access` | Pull images from ECR | `build.apprunner.amazonaws.com` |
| `chatroom-apprunner-instance` | Access DynamoDB tables | `tasks.apprunner.amazonaws.com` |

Instance role policy allows: GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan on all `chatroom-dev-*` tables and their indexes.

## Deploy Commands

### Full Deploy (from scratch)

```bash
# 1. Build Docker image (linux/amd64 for App Runner)
docker build --platform linux/amd64 -t chatroom-api backend/

# 2. Login to ECR
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin \
  050451400186.dkr.ecr.us-west-2.amazonaws.com

# 3. Tag and push
docker tag chatroom-api:latest \
  050451400186.dkr.ecr.us-west-2.amazonaws.com/chatroom-api:latest
docker push \
  050451400186.dkr.ecr.us-west-2.amazonaws.com/chatroom-api:latest

# 4. Trigger redeployment
aws apprunner start-deployment \
  --service-arn "arn:aws:apprunner:us-west-2:050451400186:service/chatroom-api/bcb76b5740c14bf9937db70eb58cbfe8" \
  --region us-west-2
```

### Quick Redeploy (code changes only)

```bash
docker build --platform linux/amd64 -t chatroom-api backend/ && \
docker tag chatroom-api:latest 050451400186.dkr.ecr.us-west-2.amazonaws.com/chatroom-api:latest && \
docker push 050451400186.dkr.ecr.us-west-2.amazonaws.com/chatroom-api:latest && \
aws apprunner start-deployment \
  --service-arn "arn:aws:apprunner:us-west-2:050451400186:service/chatroom-api/bcb76b5740c14bf9937db70eb58cbfe8" \
  --region us-west-2
```

### Check Status

```bash
aws apprunner describe-service \
  --service-arn "arn:aws:apprunner:us-west-2:050451400186:service/chatroom-api/bcb76b5740c14bf9937db70eb58cbfe8" \
  --region us-west-2 \
  --query "Service.Status" --output text
```

## Environment Variables (in App Runner)

| Key | Value |
|-----|-------|
| `AWS_REGION` | `us-west-2` |
| `DYNAMODB_PREFIX` | `chatroom-dev` |
| `PORT` | `8000` |

## Dockerfile

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Limitations

> [!warning] App Runner doesn't support WebSocket
> The service uses SSE (Server-Sent Events) for real-time in production. WebSocket is available when running locally (`python -m uvicorn app.main:app`).

## Related
- [[infrastructure/Terraform]]
- [[backend/Real-time]]
- [[architecture/Overview]]
