"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Hash, Users, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

interface ChatAreaProps {
  roomName: string;
  roomDescription?: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onToggleMembers: () => void;
  showMembers: boolean;
  typingUsers?: string[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

export function ChatArea({
  roomName,
  roomDescription,
  messages,
  onSendMessage,
  onToggleMembers,
  showMembers,
  typingUsers = [],
}: ChatAreaProps) {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };

  // Group by date
  const groups: { label: string; msgs: Message[] }[] = [];
  let curDate = "";
  for (const msg of messages) {
    const d = new Date(msg.created_at).toDateString();
    if (d !== curDate) {
      curDate = d;
      groups.push({ label: formatDateLabel(msg.created_at), msgs: [msg] });
    } else {
      groups[groups.length - 1].msgs.push(msg);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="h-4 w-4 text-neutral-400 shrink-0" />
            <h1 className="text-[15px] font-semibold text-neutral-900 truncate">{roomName}</h1>
            {roomDescription && (
              <>
                <span className="mx-1 h-3.5 w-px bg-neutral-200" />
                <span className="text-[13px] text-neutral-400 truncate">{roomDescription}</span>
              </>
            )}
          </div>
          <button
            title={showMembers ? "Hide members" : "Show members"}
            onClick={onToggleMembers}
            className={`inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors ${
              showMembers ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Users className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-5 py-4">
            {/* Welcome banner */}
            {messages.length === 0 && (
              <div className="py-8">
                <div className="h-10 w-10 rounded-lg bg-neutral-100 flex items-center justify-center mb-3">
                  <Hash className="h-5 w-5 text-neutral-600" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 font-serif">
                  Welcome to #{roomName}
                </h2>
                <p className="mt-1 text-sm text-neutral-500 max-w-md">
                  This is the start of the <span className="font-medium text-neutral-700">#{roomName}</span> channel.
                  {roomDescription ? ` ${roomDescription}` : " Send a message to get the conversation going."}
                </p>
              </div>
            )}

            {groups.map((group, gi) => (
              <div key={gi}>
                {/* Date divider */}
                <div className="flex items-center my-5">
                  <div className="flex-1 h-px bg-neutral-200" />
                  <span className="mx-3 text-[11px] font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-neutral-200" />
                </div>

                {group.msgs.map((msg, mi) => {
                  const prev = mi > 0 ? group.msgs[mi - 1] : null;
                  const compact =
                    prev &&
                    prev.user_id === msg.user_id &&
                    new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 300000;

                  if (compact) {
                    return (
                      <div key={msg.id} className="group flex items-start pl-[52px] py-0.5 -mx-2 px-2 rounded hover:bg-neutral-50 transition-colors">
                        <span className="hidden group-hover:inline text-[11px] text-neutral-300 w-[40px] text-right mr-3 pt-0.5 shrink-0 tabular-nums">
                          {formatTime(msg.created_at)}
                        </span>
                        <p className="text-[14px] text-neutral-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="group flex items-start gap-3 py-2 -mx-2 px-2 rounded hover:bg-neutral-50 transition-colors">
                      <Avatar className="h-9 w-9 mt-0.5 shrink-0">
                        <AvatarImage src={msg.avatar_url} />
                        <AvatarFallback className="bg-neutral-200 text-neutral-600 text-xs font-medium">
                          {msg.username?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[14px] font-semibold text-neutral-900 hover:underline cursor-pointer">
                            {msg.username}
                          </span>
                          <span className="text-[11px] text-neutral-400 tabular-nums">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-[14px] text-neutral-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-5 py-1">
            <p className="text-xs text-neutral-400">
              <span className="font-medium text-neutral-500">{typingUsers.join(", ")}</span>
              {typingUsers.length === 1 ? " is" : " are"} typing...
            </p>
          </div>
        )}

        {/* Input */}
        <div className="px-5 pb-5 pt-1 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400/20 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${roomName}`}
                rows={1}
                className="flex-1 bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-400 resize-none outline-none leading-relaxed"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="h-8 w-8 rounded-md shrink-0 disabled:opacity-20"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
}
