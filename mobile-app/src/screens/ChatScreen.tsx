import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { MembersPanel } from '../components/chat/MembersPanel';
import { Colors } from '../constants/theme';
import { Room, Message, Member } from '../constants/types';
import * as api from '../services/api';

export default function ChatScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id ?? '';
  const username = user?.username || user?.firstName || 'User';
  const avatarUrl = user?.imageUrl;

  // Sync user + load rooms on mount
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        await api.syncUser(userId, username, avatarUrl);
        const allRooms = await api.getRooms();

        if (cancelled) return;

        if (allRooms.length === 0) {
          // Create default #general channel
          const general = await api.createRoom('general', 'Company-wide announcements and chat');
          await api.joinRoom(general.room_id, userId, username);
          setRooms([general]);
          setActiveRoomId(general.room_id);
        } else {
          setRooms(allRooms);
          setActiveRoomId(allRooms[0].room_id);
        }
      } catch {
        // offline / backend unreachable — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // Load messages + members + WebSocket when active room changes
  useEffect(() => {
    if (!activeRoomId || !userId) return;
    let cancelled = false;
    let connectionId: string | null = null;

    (async () => {
      try {
        const [msgs, mems] = await Promise.all([
          api.getMessages(activeRoomId),
          api.getMembers(activeRoomId),
        ]);
        if (cancelled) return;
        setMessages(msgs);
        setMembers(mems);

        const conn = await api.registerConnection(activeRoomId, userId);
        if (!cancelled) connectionId = conn.connection_id;
      } catch {
        // fail silently
      }
    })();

    // WebSocket for real-time messages
    const ws = api.connectWebSocket(activeRoomId, userId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      cancelled = true;
      ws.close();
      if (connectionId) api.removeConnection(connectionId);
    };
  }, [activeRoomId, userId]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!activeRoomId || !userId) return;

      // Optimistic update
      const optimistic: Message = {
        id: `temp-${Date.now()}`,
        user_id: userId,
        username,
        avatar_url: avatarUrl,
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        await api.sendMessage(activeRoomId, userId, username, content, avatarUrl);
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    },
    [activeRoomId, userId, username, avatarUrl],
  );

  const handleCreateRoom = useCallback(
    async (name: string, description: string) => {
      if (!userId) return;
      try {
        const room = await api.createRoom(name, description);
        await api.joinRoom(room.room_id, userId, username);
        setRooms((prev) => [...prev, room]);
        setActiveRoomId(room.room_id);
      } catch {
        // fail silently
      }
    },
    [userId, username],
  );

  const activeRoom = rooms.find((r) => r.room_id === activeRoomId);
  const screenWidth = Dimensions.get('window').width;

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.textMuted} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Chat area */}
      <ChatArea
        roomName={activeRoom?.name || 'general'}
        roomDescription={activeRoom?.description}
        messages={messages}
        onSendMessage={handleSend}
        onToggleMembers={() => setShowMembers((s) => !s)}
        onOpenSidebar={() => setShowSidebar(true)}
        showMembers={showMembers}
      />

      {/* Sidebar drawer */}
      <Modal
        visible={showSidebar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSidebar(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSidebar(false)}>
          <View style={styles.drawerOverlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.drawerContent, { width: Math.min(screenWidth * 0.82, 320) }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <Sidebar
              rooms={rooms}
              activeRoomId={activeRoomId}
              onSelectRoom={(id) => {
                setActiveRoomId(id);
                setShowSidebar(false);
              }}
              onCreateRoom={handleCreateRoom}
              userName={username}
              userAvatar={avatarUrl}
              onClose={() => setShowSidebar(false)}
              onSignOut={signOut}
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* Members panel */}
      <Modal
        visible={showMembers}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMembers(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMembers(false)}>
          <View style={styles.drawerOverlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.membersDrawer, { width: Math.min(screenWidth * 0.75, 280) }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <MembersPanel members={members} onClose={() => setShowMembers(false)} />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  drawerContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.sidebar,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  membersDrawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
});
