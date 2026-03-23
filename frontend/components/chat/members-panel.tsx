"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Member {
  user_id: string;
  username: string;
  avatar_url?: string;
  is_online: boolean;
}

interface MembersPanelProps {
  members: Member[];
}

export function MembersPanel({ members }: MembersPanelProps) {
  const online = members.filter((m) => m.is_online);
  const offline = members.filter((m) => !m.is_online);

  return (
    <div className="w-[240px] bg-white border-l border-neutral-200 h-full flex flex-col">
      <div className="px-4 h-12 flex items-center border-b border-neutral-200 shrink-0">
        <h3 className="text-[13px] font-semibold text-neutral-900">Members</h3>
        <span className="ml-1.5 text-[11px] text-neutral-400">{members.length}</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          {online.length > 0 && (
            <div className="mb-4">
              <p className="px-2 mb-2 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Online &mdash; {online.length}
              </p>
              <div className="space-y-0.5">
                {online.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={m.avatar_url} />
                        <AvatarFallback className="bg-neutral-200 text-neutral-600 text-[10px] font-medium">
                          {m.username?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <span className="text-[13px] text-neutral-700 truncate">{m.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {offline.length > 0 && (
            <>
              {online.length > 0 && <Separator className="mb-4" />}
              <div>
                <p className="px-2 mb-2 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                  Offline &mdash; {offline.length}
                </p>
                <div className="space-y-0.5">
                  {offline.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-neutral-50 transition-colors cursor-pointer opacity-50"
                    >
                      <div className="relative">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={m.avatar_url} />
                          <AvatarFallback className="bg-neutral-100 text-neutral-400 text-[10px] font-medium">
                            {m.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-neutral-300 border-2 border-white" />
                      </div>
                      <span className="text-[13px] text-neutral-500 truncate">{m.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {members.length === 0 && (
            <p className="px-2 py-8 text-center text-xs text-neutral-400">No members</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
