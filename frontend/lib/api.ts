const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

// Rooms
export async function listRooms() {
  return apiFetch("/api/rooms/");
}

export async function getRoom(id: string) {
  return apiFetch(`/api/rooms/${id}`);
}

export async function createRoom(data: { id?: string; name: string; description?: string; created_by: string }) {
  return apiFetch("/api/rooms/", { method: "POST", body: JSON.stringify(data) });
}

// Members
export async function listMembers(roomId: string) {
  return apiFetch(`/api/members/${roomId}`);
}

export async function getUserRooms(userId: string) {
  return apiFetch(`/api/members/user/${userId}`);
}

export async function joinRoom(roomId: string, data: { user_id: string; role?: string }) {
  return apiFetch(`/api/members/${roomId}/join`, { method: "POST", body: JSON.stringify(data) });
}

export async function leaveRoom(roomId: string, userId: string) {
  return apiFetch(`/api/members/${roomId}/leave/${userId}`, { method: "DELETE" });
}

// Messages
export async function listMessages(roomId: string, limit = 50, lastKey?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (lastKey) params.set("last_key", lastKey);
  return apiFetch(`/api/messages/${roomId}?${params}`);
}

export async function sendMessage(roomId: string, data: { sender_id: string; content: string; sender_name?: string }) {
  return apiFetch(`/api/messages/${roomId}`, { method: "POST", body: JSON.stringify(data) });
}

export async function deleteMessage(roomId: string, key: string) {
  return apiFetch(`/api/messages/${roomId}/${key}`, { method: "DELETE" });
}

// Users
export async function syncUser(data: { id: string; username: string; email: string; avatar_url?: string }) {
  return apiFetch("/api/users/", { method: "POST", body: JSON.stringify(data) });
}

export async function getUser(id: string) {
  return apiFetch(`/api/users/${id}`);
}

// Connections (presence)
export async function getActiveUsers(roomId: string) {
  return apiFetch(`/api/connections/room/${roomId}`);
}

export async function registerConnection(data: { id: string; user_id: string; room_id: string }) {
  return apiFetch("/api/connections/", { method: "POST", body: JSON.stringify(data) });
}

export async function removeConnection(id: string) {
  return apiFetch(`/api/connections/${id}`, { method: "DELETE" });
}

// WebSocket
export function connectWebSocket(roomId: string, userId: string) {
  return new WebSocket(`${WS_URL}/ws/${roomId}/${userId}`);
}

// SSE
export function connectSSE(roomId: string) {
  return new EventSource(`${API}/api/sse/${roomId}`);
}
