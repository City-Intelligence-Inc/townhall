"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Hash, MessageSquare, Command } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
              <MessageSquare className="h-3.5 w-3.5 text-neutral-900" />
            </div>
            <span className="text-[15px] font-semibold text-white tracking-tight">Townhall</span>
          </Link>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link href="/chat">
                <Button size="sm" className="text-[13px] bg-white text-neutral-900 hover:bg-neutral-200">
                  Open Townhall
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-[13px] text-neutral-400 hover:text-white">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="text-[13px] bg-white text-neutral-900 hover:bg-neutral-200">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — asymmetric, left-aligned, no centered text */}
      <section className="mx-auto max-w-5xl px-6 pt-28 pb-16">
        <div className="grid lg:grid-cols-[1fr,1.1fr] gap-16 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-800/60 border border-neutral-700/50 px-3 py-1 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[12px] text-neutral-400">Real-time chat, deployed on AWS</span>
            </div>
            <h1 className="text-[3.25rem] font-bold text-white leading-[1.08] tracking-tight">
              Talk fast.<br />
              Ship faster.
            </h1>
            <p className="mt-5 text-[17px] text-neutral-400 leading-relaxed max-w-md">
              Channels, threads, reactions, typing indicators, presence — the whole stack.
              Built from scratch with Next.js, FastAPI, and DynamoDB.
            </p>
            <div className="mt-8 flex items-center gap-3">
              {isSignedIn ? (
                <Link href="/chat">
                  <Button size="lg" className="h-11 px-6 text-[14px] bg-white text-neutral-900 hover:bg-neutral-200">
                    Open Townhall
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-up">
                    <Button size="lg" className="h-11 px-6 text-[14px] bg-white text-neutral-900 hover:bg-neutral-200">
                      Try it now
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button variant="outline" size="lg" className="h-11 px-6 text-[14px] border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white">
                      Sign in
                    </Button>
                  </Link>
                </>
              )}
            </div>
            {/* Tech stack badges */}
            <div className="mt-8 flex flex-wrap gap-2">
              {["Next.js 16", "FastAPI", "DynamoDB", "SSE", "Clerk Auth", "Tailwind"].map((t) => (
                <span key={t} className="text-[11px] text-neutral-500 bg-neutral-800/50 border border-neutral-800 rounded px-2 py-0.5">{t}</span>
              ))}
            </div>
          </div>

          {/* App preview — the hero visual */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl shadow-black/20 hidden lg:block">
            <div className="flex h-[400px]">
              {/* Mini sidebar */}
              <div className="w-[180px] bg-neutral-900 border-r border-neutral-800 p-3">
                <div className="flex items-center gap-2 mb-5 px-1">
                  <div className="h-5 w-5 rounded bg-white flex items-center justify-center">
                    <MessageSquare className="h-2.5 w-2.5 text-neutral-900" />
                  </div>
                  <span className="text-[12px] font-semibold text-neutral-300">Townhall</span>
                </div>
                <p className="text-[9px] font-medium text-neutral-600 uppercase tracking-wider mb-1.5 px-1">Channels</p>
                <div className="space-y-0.5">
                  {[
                    { ch: "general", active: true },
                    { ch: "engineering", active: false, unread: 3 },
                    { ch: "design", active: false },
                    { ch: "shipped", active: false },
                  ].map((c) => (
                    <div
                      key={c.ch}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] ${
                        c.active ? "bg-neutral-700 text-white" : "text-neutral-500"
                      }`}
                    >
                      <Hash className="h-2.5 w-2.5 shrink-0 opacity-50" />
                      <span className="flex-1">{c.ch}</span>
                      {c.unread && (
                        <span className="flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold px-0.5">{c.unread}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {/* Mini chat */}
              <div className="flex-1 flex flex-col bg-neutral-950">
                <div className="h-9 border-b border-neutral-800 flex items-center px-3 gap-1.5">
                  <Hash className="h-3 w-3 text-neutral-600" />
                  <span className="text-[12px] font-semibold text-neutral-400">general</span>
                </div>
                <div className="flex-1 p-3 space-y-3 overflow-hidden">
                  {[
                    { name: "Sarah", msg: "Just shipped the new onboarding flow!", time: "10:32", color: "bg-blue-500/20 text-blue-400", reactions: ["1F44D", "1F525"] },
                    { name: "Alex", msg: "The animations are smooth. Nice work.", time: "10:34", color: "bg-amber-500/20 text-amber-400" },
                    { name: "Jordan", msg: "Can we add that pattern to the design system?", time: "10:35", color: "bg-emerald-500/20 text-emerald-400", reply: true },
                  ].map((m, i) => (
                    <div key={i}>
                      {m.reply && (
                        <div className="flex items-center gap-1 ml-8 mb-0.5">
                          <div className="w-0.5 h-3 rounded-full bg-neutral-700" />
                          <span className="text-[9px] text-neutral-600">Sarah: Just shipped the new onboarding flow!</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <div className={`h-6 w-6 rounded-full ${m.color} flex items-center justify-center text-[9px] font-semibold shrink-0`}>
                          {m.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[11px] font-semibold text-neutral-300">{m.name}</span>
                            <span className="text-[9px] text-neutral-600">{m.time}</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">{m.msg}</p>
                          {m.reactions && (
                            <div className="flex gap-1 mt-1">
                              {m.reactions.map((r) => (
                                <span key={r} className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-[9px]">
                                  {String.fromCodePoint(parseInt(r, 16))} <span className="text-neutral-500">2</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Typing indicator */}
                  <div className="flex items-center gap-1.5 ml-8">
                    <div className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-neutral-600 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-1 rounded-full bg-neutral-600 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-1 rounded-full bg-neutral-600 animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-[9px] text-neutral-600">Alex is typing</span>
                  </div>
                </div>
                <div className="p-2 border-t border-neutral-800">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-[11px] text-neutral-600 flex items-center justify-between">
                    <span>Message #general</span>
                    <div className="flex items-center gap-1 text-[9px] text-neutral-700">
                      <Command className="h-2.5 w-2.5" /><span>K to search</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities — NOT a 3-column grid. Two-column staggered layout. */}
      <section className="border-t border-neutral-800/50">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">What&apos;s inside</h2>
          <p className="text-[15px] text-neutral-500 mb-12 max-w-lg">Every feature you&apos;d expect from a production chat app — built in a weekend.</p>

          <div className="grid sm:grid-cols-2 gap-x-16 gap-y-10">
            {[
              { label: "Real-time SSE", detail: "Messages, typing indicators, reactions, and presence updates stream over Server-Sent Events. Sub-100ms delivery." },
              { label: "Emoji reactions", detail: "React to any message with quick emoji. Toggle on/off, see who reacted, counts update live." },
              { label: "Inline replies", detail: "Quote any message with a single click. Quoted preview appears above your reply." },
              { label: "Message editing", detail: "Edit your own messages inline. Changes broadcast to all clients instantly." },
              { label: "Full-text search", detail: "Cmd+K opens a search modal. Search across all messages, jump to any channel." },
              { label: "Typing indicators", detail: "See who's composing. 3-second debounce, animated dots, auto-expire." },
              { label: "Unread badges", detail: "Red count badges on channels with new messages. Auto-clear on room enter." },
              { label: "Presence tracking", detail: "Online/offline status per user. Connections table + 10-second polling." },
            ].map((f) => (
              <div key={f.label} className="group">
                <h3 className="text-[14px] font-semibold text-neutral-200 mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                  {f.label}
                </h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed pl-3">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture strip — shows technical depth */}
      <section className="border-t border-neutral-800/50 bg-neutral-900/30">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-lg font-bold text-white tracking-tight mb-6">Architecture</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { layer: "Frontend", stack: "Next.js 16 + React 19 + Tailwind", note: "SSE real-time, optimistic updates, Clerk auth" },
              { layer: "Backend", stack: "FastAPI + Python 3.13", note: "48 REST endpoints, JWT auth, SSE pub/sub" },
              { layer: "Data", stack: "DynamoDB (5 tables) + S3", note: "Serverless, PAY_PER_REQUEST, zero idle cost" },
            ].map((a) => (
              <div key={a.layer} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">{a.layer}</p>
                <p className="text-[14px] font-semibold text-white mb-2">{a.stack}</p>
                <p className="text-[12px] text-neutral-500 leading-relaxed">{a.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — left-aligned, not centered */}
      <section className="border-t border-neutral-800/50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-2xl font-bold text-white tracking-tight">See it in action</h2>
          <p className="mt-2 text-[15px] text-neutral-500 max-w-md">
            Sign up, create a channel, and start chatting. Takes about 10 seconds.
          </p>
          <div className="mt-6">
            {isSignedIn ? (
              <Link href="/chat">
                <Button size="lg" className="h-11 px-8 text-[14px] bg-white text-neutral-900 hover:bg-neutral-200">
                  Go to Townhall
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button size="lg" className="h-11 px-8 text-[14px] bg-white text-neutral-900 hover:bg-neutral-200">
                  Get started free
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/50">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-white">
              <MessageSquare className="h-2.5 w-2.5 text-neutral-900" />
            </div>
            <span className="text-[12px] text-neutral-600">Townhall</span>
          </div>
          <p className="text-[12px] text-neutral-600">&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
