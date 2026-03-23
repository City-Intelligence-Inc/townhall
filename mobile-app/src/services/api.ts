import { API_URL, WS_URL } from '../constants/api';
import { Room, Message, Member } from '../constants/types';

// ── Auth token management (mirrors web frontend pattern) ──────
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenProvider(fn: () => Promise<string | null>) {
  _getToken = fn;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts?.headers as Record<string, string>),
  };

  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {}
  }

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Rooms ──────────────────────────────────────────────────────
export async function getRooms(): Promise<Room[]> {
  return apiFetch('/api/rooms/');
}

export async function createRoom(name: string, description: string): Promise<Room> {
  return apiFetch('/api/rooms/', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

// ── Messages ───────────────────────────────────────────────────
export async function getMessages(roomId: string): Promise<Message[]> {
  return apiFetch(`/api/messages/${roomId}`);
}

export async function sendMessage(
  roomId: string,
  userId: string,
  username: string,
  content: string,
  avatarUrl?: string,
): Promise<Message> {
  return apiFetch(`/api/messages/${roomId}`, {
    method: 'POST',
    body: JSON.stringify({
      sender_id: userId,
      sender_name: username,
      content,
      avatar_url: avatarUrl,
    }),
  });
}

// ── Members ────────────────────────────────────────────────────
export async function getMembers(roomId: string): Promise<Member[]> {
  return apiFetch(`/api/members/${roomId}`);
}

export async function joinRoom(roomId: string, userId: string, username: string): Promise<void> {
  await apiFetch(`/api/members/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, username }),
  });
}

// ── Users ──────────────────────────────────────────────────────
export async function syncUser(
  userId: string,
  username: string,
  email: string,
  avatarUrl?: string,
): Promise<void> {
  await apiFetch('/api/users/', {
    method: 'POST',
    body: JSON.stringify({ id: userId, username, email, avatar_url: avatarUrl }),
  });
}

// ── Connections (presence) ─────────────────────────────────────
export async function getActiveUsers(roomId: string): Promise<any[]> {
  const data = await apiFetch(`/api/connections/room/${roomId}`);
  return data.connections || data || [];
}

export async function registerConnection(
  roomId: string,
  userId: string,
): Promise<{ connection_id: string }> {
  return apiFetch('/api/connections/', {
    method: 'POST',
    body: JSON.stringify({ room_id: roomId, user_id: userId }),
  });
}

export async function heartbeat(roomId: string, userId: string): Promise<void> {
  await apiFetch('/api/connections/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ room_id: roomId, user_id: userId }),
  });
}

export async function removeUserRoomConnection(userId: string, roomId: string): Promise<void> {
  await apiFetch(`/api/connections/user/${userId}/room/${roomId}`, { method: 'DELETE' });
}

export async function removeConnection(connectionId: string): Promise<void> {
  await apiFetch(`/api/connections/${connectionId}`, { method: 'DELETE' });
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
