"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Hash, Users, SendHorizontal, Smile, Paperclip, Trash2, X, FileText, Image as ImageIcon, MessageSquare, Share, Bookmark, MoreHorizontal, Copy, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
  sort_key?: string;
}

interface ChatAreaProps {
  roomName: string;
  roomDescription?: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onDeleteMessage?: (messageId: string, sortKey?: string) => void;
  onEditMessage?: (messageId: string, sortKey: string, newContent: string) => void;
  onToggleReaction?: (messageId: string, sortKey: string, emoji: string) => void;
  onToggleMembers: () => void;
  showMembers: boolean;
  typingUsers?: string[];
  onTyping?: () => void;
  currentUserId?: string;
  replyingTo?: Message | null;
  onReply?: (msg: Message) => void;
  onCancelReply?: () => void;
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

// Markdown components styled for chat
const mdComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="my-1 rounded-md bg-neutral-100 border border-neutral-200 px-3 py-2 overflow-x-auto">
          <code className="text-[13px] font-mono text-neutral-800">{children}</code>
        </pre>
      );
    }
    return <code className="rounded bg-neutral-100 border border-neutral-200 px-1 py-0.5 text-[13px] font-mono text-rose-600">{children}</code>;
  },
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{children}</a>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside my-1">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside my-1">{children}</ol>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-neutral-300 pl-3 my-1 text-neutral-600 italic">{children}</blockquote>
  ),
};

function MessageContent({ content }: { content: string }) {
  // Only use markdown if content has markdown-like syntax
  const hasMarkdown = /[*_`#\[\]>~-]/.test(content);
  if (!hasMarkdown) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as Record<string, React.ComponentType>}>
      {content}
    </ReactMarkdown>
  );
}

// Slack-style hover action bar
function MessageActionBar({
  isOwn,
  onDelete,
  onReply,
  content,
}: {
  isOwn: boolean;
  onDelete?: () => void;
  onReply?: () => void;
  content: string;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => { setCopied(false); setMoreOpen(false); }, 1200);
  };

  const actionBtn =
    "h-7 w-7 flex items-center justify-center rounded transition-colors text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100";

  return (
    <div className="absolute -top-4 right-4 hidden group-hover:flex items-center bg-white rounded-lg border border-neutral-200 shadow-sm z-10">
      {/* Quick emoji reactions */}
      <button className={actionBtn} title="React">
        <Smile className="h-4 w-4" />
      </button>
      {/* Reply / thread */}
      <button className={actionBtn} title="Reply in thread" onClick={onReply}>
        <MessageSquare className="h-4 w-4" />
      </button>
      {/* Share */}
      <button className={actionBtn} title="Share message">
        <Share className="h-4 w-4" />
      </button>
      {/* Bookmark */}
      <button className={actionBtn} title="Save for later">
        <Bookmark className="h-4 w-4" />
      </button>
      {/* More — opens dropdown with copy, pin, delete */}
      <div className="relative" ref={menuRef}>
        <button
          className={`${actionBtn} ${moreOpen ? "bg-neutral-100 text-neutral-800" : ""}`}
          title="More actions"
          onClick={() => setMoreOpen((s) => !s)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {moreOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg py-1 z-20">
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Copy className="h-3.5 w-3.5 text-neutral-400" />
              {copied ? "Copied!" : "Copy text"}
            </button>
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Pin className="h-3.5 w-3.5 text-neutral-400" />
              Pin to channel
            </button>
            {isOwn && onDelete && (
              <>
                <div className="my-1 border-t border-neutral-100" />
                <button
                  onClick={() => { onDelete(); setMoreOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete message
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatArea({
  roomName,
  roomDescription,
  messages,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onToggleReaction,
  onToggleMembers,
  showMembers,
  typingUsers = [],
  onTyping,
  currentUserId,
  replyingTo,
  onReply,
  onCancelReply,
}: ChatAreaProps) {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Upload file to S3 via backend
  const uploadFile = useCallback(async (file: File): Promise<{ url: string; key: string; name: string } | null> => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API}/api/uploads/`, { method: "POST", body: formData });
      if (!res.ok) return null;
      const data = await res.json();
      return { url: data.url, key: data.key, name: file.name };
    } catch {
      return null;
    }
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    // Add previews for images
    const withPreviews = files.map((file) => {
      if (file.type.startsWith("image/")) {
        return { file, preview: URL.createObjectURL(file) };
      }
      return { file };
    });
    setPendingFiles((prev) => [...prev, ...withPreviews]);
  }, []);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSend = useCallback(async () => {
    const hasText = input.trim();
    const hasFiles = pendingFiles.length > 0;
    if (!hasText && !hasFiles) return;

    // Upload pending files first
    if (hasFiles) {
      setUploading(true);
      for (const { file } of pendingFiles) {
        const result = await uploadFile(file);
        if (result) {
          const isImage = file.type.startsWith("image/");
          const fileMsg = isImage
            ? `![${result.name}](${result.url})`
            : `[${result.name}](${result.url})`;
          onSendMessage(fileMsg);
        }
      }
      // Clean up previews
      pendingFiles.forEach((pf) => { if (pf.preview) URL.revokeObjectURL(pf.preview); });
      setPendingFiles([]);
      setUploading(false);
    }

    // Send text message if any
    if (hasText) {
      onSendMessage(input.trim());
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  }, [input, pendingFiles, uploadFile, onSendMessage]);

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
    if (e.target.value.trim() && onTyping) onTyping();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFiles(files);
  }, [processFiles]);

  // Toolbar helpers
  const wrapSelection = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = input.substring(start, end);
    const newText = input.substring(0, start) + before + selected + after + input.substring(end);
    setInput(newText);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = end + before.length;
    }, 0);
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
    <div
      className="flex flex-col flex-1 min-w-0 bg-white relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-blue-400 rounded-lg m-2 pointer-events-none">
          <div className="text-center">
            <Paperclip className="h-10 w-10 text-blue-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-neutral-700">Drop files here</p>
            <p className="text-sm text-neutral-400 mt-1">Images, documents, or any file</p>
          </div>
        </div>
      )}

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
                const isOwn = msg.user_id === (currentUserId || user?.id);

                if (compact) {
                  return (
                    <div key={msg.id} className="group relative -mx-5 px-5 py-[5px] hover:bg-neutral-50/80 transition-colors">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 hidden group-hover:inline text-[11px] text-neutral-400 tabular-nums">
                        {formatTime(msg.created_at)}
                      </span>
                      <div className="pl-[56px] text-[15px] text-neutral-800 leading-[1.7]">
                        <MessageContent content={msg.content} />
                      </div>
                      <MessageActionBar
                        isOwn={isOwn}
                        content={msg.content}
                        onDelete={onDeleteMessage ? () => onDeleteMessage(msg.id, msg.sort_key) : undefined}
                        onReply={onReply ? () => onReply(msg) : undefined}
                      />
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="group relative flex items-start gap-4 -mx-5 px-5 pt-2 pb-1 mt-4 first:mt-0 hover:bg-neutral-50/80 transition-colors">
                    <Avatar className="h-10 w-10 mt-0.5 shrink-0">
                      <AvatarImage src={msg.avatar_url} />
                      <AvatarFallback className="bg-neutral-200 text-neutral-600 text-sm font-medium">
                        {msg.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[15px] font-bold text-neutral-900 hover:underline cursor-pointer">
                          {msg.username}
                        </span>
                        <span className="text-[12px] text-neutral-400 tabular-nums font-normal">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <div className="text-[15px] text-neutral-800 leading-[1.7] mt-1">
                        <MessageContent content={msg.content} />
                      </div>
                    </div>
                    <MessageActionBar
                      isOwn={isOwn}
                      content={msg.content}
                      onDelete={onDeleteMessage ? () => onDeleteMessage(msg.id, msg.sort_key) : undefined}
                      onReply={onReply ? () => onReply(msg) : undefined}
                    />
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

      {/* Pending file previews */}
      {pendingFiles.length > 0 && (
        <div className="px-4 pt-2 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto pb-1">
            {pendingFiles.map((pf, i) => (
              <div key={i} className="relative group shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden">
                {pf.preview ? (
                  <img src={pf.preview} alt={pf.file.name} className="h-20 w-20 object-cover" />
                ) : (
                  <div className="h-20 w-20 flex flex-col items-center justify-center gap-1 px-1">
                    <FileText className="h-6 w-6 text-neutral-400" />
                    <span className="text-[10px] text-neutral-500 truncate max-w-[72px] text-center">{pf.file.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removePendingFile(i)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-neutral-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {uploading && (
              <div className="h-20 w-20 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reply preview bar */}
      {replyingTo && (
        <div className="px-4 pt-1 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-2 rounded-t-lg border border-b-0 border-neutral-200 bg-neutral-50 px-3 py-2">
            <div className="h-full w-0.5 bg-blue-400 rounded-full self-stretch" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-blue-600">Replying to {replyingTo.username}</p>
              <p className="text-[12px] text-neutral-500 truncate">{replyingTo.content}</p>
            </div>
            <button onClick={onCancelReply} className="shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className={`px-4 pb-4 ${replyingTo ? "pt-0" : "pt-1"} shrink-0`}>
        <div className={`max-w-3xl mx-auto ${replyingTo ? "rounded-b-xl rounded-t-none" : "rounded-xl"} border border-neutral-200 bg-neutral-50/80 shadow-sm focus-within:border-neutral-300 focus-within:bg-white focus-within:shadow-md transition-all duration-200`}>
          <div className="flex items-center gap-0.5 px-3 pt-2.5 pb-1">
            <button type="button" title="Bold" onClick={() => wrapSelection("**", "**")} className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors text-xs font-bold">
              B
            </button>
            <button type="button" title="Italic" onClick={() => wrapSelection("_", "_")} className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors text-xs italic">
              I
            </button>
            <button type="button" title="Code" onClick={() => wrapSelection("`", "`")} className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors font-mono text-[11px]">
              {"</>"}
            </button>
            <div className="h-4 w-px bg-neutral-200 mx-1" />
            <button type="button" title="Link" onClick={() => wrapSelection("[", "](url)")} className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </button>
            <button type="button" title="Blockquote" onClick={() => wrapSelection("> ", "")} className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors text-sm">
              &ldquo;
            </button>
          </div>
          <div className="px-3 pb-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${roomName}`}
              rows={1}
              className="w-full bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-400 resize-none outline-none leading-relaxed min-h-[28px] max-h-[150px]"
            />
          </div>
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            <div className="flex items-center gap-0.5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.log,.zip"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                title="Attach file (drag & drop also works)"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <button type="button" title="Mention someone" className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors text-sm font-medium">
                @
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-300">
                {(input.trim() || pendingFiles.length > 0) ? "Enter to send" : ""}
              </span>
              <button
                onClick={handleSend}
                disabled={!input.trim() && pendingFiles.length === 0}
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-150 ${
                  (input.trim() || pendingFiles.length > 0)
                    ? "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                }`}
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
