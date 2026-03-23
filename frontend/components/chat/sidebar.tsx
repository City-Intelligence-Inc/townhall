"use client";

import { useState, useCallback, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Hash, Plus, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import * as api from "@/lib/api";

interface Room {
  room_id: string;
  name: string;
  description?: string;
  unread_count?: number;
}

interface SidebarProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, description: string) => void;
}

interface SearchResult {
  id: string;
  room_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export function Sidebar({ rooms, activeRoomId, onSelectRoom, onCreateRoom }: SidebarProps) {
  const { user } = useUser();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.searchMessages(query);
        setSearchResults(data.results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    onCreateRoom(slug, desc.trim());
    setName("");
    setDesc("");
    setCreateOpen(false);
  };

  return (
    <div className="flex flex-col w-[260px] bg-neutral-50 border-r border-neutral-200 h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-neutral-200">
        <h2 className="text-[15px] font-semibold text-neutral-900 tracking-tight">Townhall</h2>
        <button
          title="Search"
          onClick={() => { setSearchOpen((s) => !s); setSearchQuery(""); setSearchResults([]); }}
          className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors ${
            searchOpen ? "bg-neutral-200 text-neutral-900" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60"
          }`}
        >
          {searchOpen ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Search panel */}
      {searchOpen && (
        <div className="border-b border-neutral-200 px-3 py-2">
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search messages..."
            className="h-8 text-[13px]"
            autoFocus
          />
          {searching && (
            <p className="text-[11px] text-neutral-400 mt-2 px-1">Searching...</p>
          )}
          {searchResults.length > 0 && (
            <ScrollArea className="max-h-60 mt-2">
              <div className="space-y-1">
                {searchResults.map((r) => {
                  const roomName = rooms.find((rm) => rm.room_id === r.room_id)?.name || "unknown";
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        onSelectRoom(r.room_id);
                        setSearchOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <Hash className="h-2.5 w-2.5" />
                        <span>{roomName}</span>
                        <span className="ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[12px] text-neutral-700 truncate mt-0.5">
                        <span className="font-medium">{r.sender_name}</span>: {r.content}
                      </p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          {searchQuery && !searching && searchResults.length === 0 && (
            <p className="text-[11px] text-neutral-400 mt-2 px-1">No results found</p>
          )}
        </div>
      )}

      {/* Channels */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <div className="flex items-center gap-1 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              <ChevronDown className="h-3 w-3" />
              Channels
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="text-neutral-400 hover:text-neutral-700 transition-colors rounded p-0.5 hover:bg-neutral-200/60"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {rooms.map((room) => {
              const isActive = activeRoomId === room.room_id;
              const hasUnread = !isActive && room.unread_count && room.unread_count > 0;
              return (
                <div key={room.room_id}>
                  <button
                    onClick={() => onSelectRoom(room.room_id)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[13px] transition-colors ${
                      isActive
                        ? "bg-neutral-900 text-white"
                        : hasUnread
                          ? "text-neutral-900 font-semibold hover:bg-neutral-200/60"
                          : "text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900"
                    }`}
                  >
                    <Hash className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-neutral-400" : "text-neutral-400"}`} />
                    <span className="truncate flex-1 text-left">{room.name}</span>
                    {hasUnread && (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                        {room.unread_count! > 99 ? "99+" : room.unread_count}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {rooms.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-neutral-400">
              No channels yet. Create one to get started.
            </p>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* User */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <UserButton
          appearance={{ elements: { avatarBox: "h-8 w-8" } }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-neutral-900 truncate">
            {user?.fullName || user?.username || "User"}
          </p>
          <p className="text-[11px] text-neutral-400 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </p>
        </div>
      </div>

      {/* Create channel modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setCreateOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">Create a channel</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Channels are where your team communicates.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Name</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. plan-budget"
                    className="pl-9"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Description <span className="font-normal text-neutral-400">(optional)</span>
                </label>
                <Input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What's this channel about?"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!name.trim()}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
