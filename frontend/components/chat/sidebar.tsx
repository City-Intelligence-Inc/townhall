"use client";

import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Hash, Plus, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Room {
  room_id: string;
  name: string;
  description?: string;
}

interface SidebarProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, description: string) => void;
}

export function Sidebar({ rooms, activeRoomId, onSelectRoom, onCreateRoom }: SidebarProps) {
  const { user } = useUser();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    onCreateRoom(slug, desc.trim());
    setName("");
    setDesc("");
    setCreateOpen(false);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col w-[260px] bg-neutral-50 border-r border-neutral-200 h-full select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900 tracking-tight">Townhall</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-500 hover:text-neutral-900">
                <Search className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Search</TooltipContent>
          </Tooltip>
        </div>

        {/* Channels */}
        <ScrollArea className="flex-1">
          <div className="px-2 py-3">
            <div className="flex items-center justify-between px-2 mb-1">
              <div className="flex items-center gap-1 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <ChevronDown className="h-3 w-3" />
                Channels
              </div>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <button className="text-neutral-400 hover:text-neutral-700 transition-colors rounded p-0.5 hover:bg-neutral-200/60">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create a channel</DialogTitle>
                    <DialogDescription>
                      Channels are where your team communicates. They&apos;re best organized around a topic.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
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
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!name.trim()}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-0.5">
              {rooms.map((room) => (
                <button
                  key={room.room_id}
                  onClick={() => onSelectRoom(room.room_id)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[13px] transition-colors ${
                    activeRoomId === room.room_id
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900"
                  }`}
                >
                  <Hash className={`h-3.5 w-3.5 shrink-0 ${activeRoomId === room.room_id ? "text-neutral-400" : "text-neutral-400"}`} />
                  <span className="truncate">{room.name}</span>
                </button>
              ))}
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
            afterSignOutUrl="/sign-in"
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
      </div>
    </TooltipProvider>
  );
}
