export interface Room {
  room_id: string;
  name: string;
  description?: string;
}

export interface Message {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

export interface Member {
  user_id: string;
  username: string;
  avatar_url?: string;
  is_online: boolean;
}
