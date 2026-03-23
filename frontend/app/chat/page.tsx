"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { MembersPanel } from "@/components/chat/members-panel";

const DEFAULT_ROOMS = [
  { room_id: "1", name: "general", description: "Company-wide announcements and chat" },
  { room_id: "2", name: "random", description: "Water cooler conversation" },
  { room_id: "3", name: "engineering", description: "Dev discussions and code reviews" },
];

interface Message {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

export default function Home() {
  const { user } = useUser();
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState("1");
  const [showMembers, setShowMembers] = useState(true);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});

  const activeRoom = rooms.find((r) => r.room_id === activeRoomId);
  const messages = messagesByRoom[activeRoomId] || [];

  const handleSend = useCallback(
    (content: string) => {
      if (!user || !activeRoomId) return;
      const msg: Message = {
        id: crypto.randomUUID(),
        user_id: user.id,
        username: user.fullName || user.username || "User",
        avatar_url: user.imageUrl,
        content,
        created_at: new Date().toISOString(),
      };
      setMessagesByRoom((prev) => ({
        ...prev,
        [activeRoomId]: [...(prev[activeRoomId] || []), msg],
      }));
    },
    [user, activeRoomId],
  );

  const handleCreateRoom = useCallback((name: string, description: string) => {
    const room = { room_id: crypto.randomUUID(), name, description };
    setRooms((prev) => [...prev, room]);
    setActiveRoomId(room.room_id);
  }, []);

  const members = [
    {
      user_id: user?.id || "me",
      username: user?.fullName || user?.username || "You",
      avatar_url: user?.imageUrl,
      is_online: true,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={setActiveRoomId}
        onCreateRoom={handleCreateRoom}
      />
      <ChatArea
        roomName={activeRoom?.name || "general"}
        roomDescription={activeRoom?.description}
        messages={messages}
        onSendMessage={handleSend}
        onToggleMembers={() => setShowMembers((s) => !s)}
        showMembers={showMembers}
      />
      {showMembers && <MembersPanel members={members} />}
    </div>
  );
}
