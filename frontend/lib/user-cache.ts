import * as api from "./api";

interface CachedUser {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
}

const cache = new Map<string, CachedUser>();
let allUsersFetched = false;

export async function fetchAllUsers() {
  if (allUsersFetched) return;
  try {
    const users = await api.listUsers();
    for (const u of users) {
      cache.set(u.userId || u.id, {
        id: u.userId || u.id,
        username: u.username,
        avatar_url: u.avatarUrl || u.avatar_url,
        email: u.email,
      });
    }
    allUsersFetched = true;
  } catch {}
}

export function getUser(userId: string): CachedUser | undefined {
  return cache.get(userId);
}

export function setUser(user: CachedUser) {
  cache.set(user.id, user);
}

export function getUserAvatar(userId: string): string | undefined {
  return cache.get(userId)?.avatar_url;
}

export function getUserName(userId: string): string {
  return cache.get(userId)?.username || userId;
}
