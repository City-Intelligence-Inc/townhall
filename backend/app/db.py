import os
import boto3

_region = os.getenv("AWS_REGION", "us-west-2")
_prefix = os.getenv("DYNAMODB_PREFIX", "chatroom-dev")

dynamodb = boto3.resource("dynamodb", region_name=_region)

# Table references
users_table = dynamodb.Table(f"{_prefix}-users")
chat_rooms_table = dynamodb.Table(f"{_prefix}-chat-rooms")
room_members_table = dynamodb.Table(f"{_prefix}-room-members")
messages_table = dynamodb.Table(f"{_prefix}-messages")
connections_table = dynamodb.Table(f"{_prefix}-connections")
