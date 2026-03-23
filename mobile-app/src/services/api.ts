import { API_URL, WS_URL } from '../constants/api';
import { Room, Message, Member } from '../constants/types';

// ── Rooms ──────────────────────────────────────────────────────
export async function getRooms(): Promise<Room[]> {
  const res = await fetch(`${API_URL}/api/rooms/`);
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
}

export async function createRoom(name: string, description: string): Promise<Room> {
  const res = await fetch(`${API_URL}/api/rooms/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error('Failed to create room');
  return res.json();
}

// ── Messages ───────────────────────────────────────────────────
export async function getMessages(roomId: string): Promise<Message[]> {
  const res = await fetch(`${API_URL}/api/messages/${roomId}`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function sendMessage(
  roomId: string,
  userId: string,
  username: string,
  content: string,
  avatarUrl?: string,
): Promise<Message> {
  const res = await fetch(`${API_URL}/api/messages/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      username,
      content,
      avatar_url: avatarUrl,
    }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

// ── Members ────────────────────────────────────────────────────
export async function getMembers(roomId: string): Promise<Member[]> {
  const res = await fetch(`${API_URL}/api/members/${roomId}`);
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

export async function joinRoom(roomId: string, userId: string, username: string): Promise<void> {
  await fetch(`${API_URL}/api/members/${roomId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, username }),
  });
}

// ── Users ──────────────────────────────────────────────────────
export async function syncUser(userId: string, username: string, avatarUrl?: string): Promise<void> {
  await fetch(`${API_URL}/api/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, username, avatar_url: avatarUrl }),
  });
}

// ── Connections (presence) ─────────────────────────────────────
export async function registerConnection(
  roomId: string,
  userId: string,
): Promise<{ connection_id: string }> {
  const res = await fetch(`${API_URL}/api/connections/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, user_id: userId }),
  });
  if (!res.ok) throw new Error('Failed to register connection');
  return res.json();
}

export async function removeConnection(connectionId: string): Promise<void> {
  await fetch(`${API_URL}/api/connections/${connectionId}`, { method: 'DELETE' });
}

// ── WebSocket ──────────────────────────────────────────────────
export function connectWebSocket(
  roomId: string,
  userId: string,
  onMessage: (msg: Message) => void,
): WebSocket {
  const ws = new WebSocket(`${WS_URL}/ws/${roomId}/${userId}`);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      // ignore non-JSON frames
    }
  };
  return ws;
}
