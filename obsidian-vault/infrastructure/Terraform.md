# Terraform Infrastructure

**File**: `infra/main.tf` (266 lines)

## Provider

```hcl
provider "aws" {
  region = "us-west-2"
}
```

## Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-west-2` | AWS region |
| `environment` | `dev` | Environment prefix |

All table names follow: `chatroom-{environment}-{table}`

## Resources (5 DynamoDB Tables)

| Resource | Table Name | Billing |
|----------|-----------|---------|
| `aws_dynamodb_table.users` | `chatroom-dev-users` | PAY_PER_REQUEST |
| `aws_dynamodb_table.chat_rooms` | `chatroom-dev-chat-rooms` | PAY_PER_REQUEST |
| `aws_dynamodb_table.room_members` | `chatroom-dev-room-members` | PAY_PER_REQUEST |
| `aws_dynamodb_table.messages` | `chatroom-dev-messages` | PAY_PER_REQUEST |
| `aws_dynamodb_table.connections` | `chatroom-dev-connections` | PAY_PER_REQUEST |

See [[data-model/Tables Overview]] for full schema details.

## Outputs

Each table exports `name` and `arn`:
```
users_table_name        = "chatroom-dev-users"
users_table_arn         = "arn:aws:dynamodb:us-west-2:050451400186:table/chatroom-dev-users"
chat_rooms_table_name   = "chatroom-dev-chat-rooms"
room_members_table_name = "chatroom-dev-room-members"
messages_table_name     = "chatroom-dev-messages"
connections_table_name  = "chatroom-dev-connections"
```

## Commands

```bash
cd infra/
terraform init              # Download AWS provider
terraform plan              # Preview: 5 tables to add
terraform apply -auto-approve  # Deploy (~23 seconds)
terraform destroy           # Tear down everything
```

## State

Terraform state is stored locally in `infra/terraform.tfstate`. Not checked into git.

## Related
- [[data-model/Tables Overview]]
- [[infrastructure/Deployment]]
