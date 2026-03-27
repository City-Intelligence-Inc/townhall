"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Hash, MessageSquare, Command } from "lucide-react";

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const cta = isSignedIn ? "/chat" : "/sign-up";
  const ctaLabel = isSignedIn ? "Go to chat" : "Try it free";

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Terminus</span>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link href="/chat" className="text-sm font-medium hover:underline underline-offset-4 py-3">Open chat</Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors py-3 px-2">Sign in</Link>
                <Link href="/sign-up" className="text-sm font-medium bg-neutral-900 text-white px-4 py-3 rounded-md hover:bg-neutral-800 active:bg-black transition-colors">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 md:pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-6" style={{ animation: "fadeIn 0.6s ease-out 0.1s both" }}>Real-time team messaging</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal leading-[1.05] mb-6 italic" style={{ animation: "fadeIn 0.8s ease-out 0.2s both" }}>
              Talk fast.<br />Ship faster.
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-xl mb-10" style={{ animation: "fadeIn 0.6s ease-out 0.5s both" }}>
              Channels, reactions, threads, typing indicators, presence tracking, and search.
              Built from scratch with Next.js, FastAPI, and DynamoDB.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6" style={{ animation: "fadeIn 0.6s ease-out 0.7s both" }}>
              <Link href={cta}
                className="text-base font-medium bg-neutral-900 text-white px-8 py-3.5 rounded-md hover:bg-neutral-800 active:bg-black transition-colors text-center">
                {ctaLabel}
              </Link>
              <span className="text-sm text-neutral-400">No account needed to explore</span>
            </div>
          </div>

          {/* Product preview — browser mockup */}
          <div className="mt-14 md:mt-20" style={{ animation: "fadeIn 0.8s ease-out 0.9s both" }}>
            <div className="border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
              {/* Browser chrome */}
              <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                </div>
                <div className="ml-4 bg-white border border-neutral-200 rounded px-3 py-0.5 text-xs text-neutral-400 flex-1 max-w-sm hidden sm:block">terminus.vercel.app/chat</div>
              </div>
              {/* App content mock */}
              <div className="bg-white flex h-[320px] sm:h-[380px]">
                {/* Mini sidebar */}
                <div className="w-[180px] bg-neutral-50 border-r border-neutral-200 p-3 hidden sm:block">
                  <div className="flex items-center gap-2 mb-5 px-1">
                    <div className="h-5 w-5 rounded bg-neutral-900 flex items-center justify-center">
                      <MessageSquare className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-[12px] font-semibold text-neutral-700">Terminus</span>
                  </div>
                  <p className="text-[9px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5 px-1">Channels</p>
                  <div className="space-y-0.5">
                    {[
                      { ch: "general", active: true },
                      { ch: "engineering", active: false, unread: 3 },
                      { ch: "design", active: false },
                      { ch: "shipped", active: false },
                    ].map((c) => (
                      <div key={c.ch} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] ${c.active ? "bg-neutral-900 text-white" : "text-neutral-500"}`}>
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
                <div className="flex-1 flex flex-col">
                  <div className="h-9 border-b border-neutral-200 flex items-center px-3 gap-1.5">
                    <Hash className="h-3 w-3 text-neutral-400" />
                    <span className="text-[12px] font-semibold text-neutral-700">general</span>
                  </div>
                  <div className="flex-1 p-3 space-y-3 overflow-hidden">
                    {[
                      { name: "Sarah", msg: "Just shipped the new onboarding flow!", time: "10:32", color: "bg-blue-100 text-blue-700", reactions: ["\u{1F44D}", "\u{1F525}"] },
                      { name: "Alex", msg: "The animations are smooth. Nice work.", time: "10:34", color: "bg-amber-100 text-amber-700" },
                      { name: "Jordan", msg: "Can we add that pattern to the design system?", time: "10:35", color: "bg-emerald-100 text-emerald-700", reply: true },
                    ].map((m, i) => (
                      <div key={i}>
                        {m.reply && (
                          <div className="flex items-center gap-1 ml-8 mb-0.5">
                            <div className="w-0.5 h-3 rounded-full bg-neutral-200" />
                            <span className="text-[9px] text-neutral-400">Sarah: Just shipped the new onboarding flow!</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <div className={`h-6 w-6 rounded-full ${m.color} flex items-center justify-center text-[9px] font-semibold shrink-0`}>{m.name[0]}</div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[11px] font-semibold text-neutral-800">{m.name}</span>
                              <span className="text-[9px] text-neutral-400">{m.time}</span>
                            </div>
                            <p className="text-[11px] text-neutral-600 leading-relaxed">{m.msg}</p>
                            {m.reactions && (
                              <div className="flex gap-1 mt-1">
                                {m.reactions.map((r) => (
                                  <span key={r} className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-[9px]">
                                    {r} <span className="text-neutral-400">2</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 ml-8">
                      <div className="flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-neutral-300 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1 h-1 rounded-full bg-neutral-300 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1 h-1 rounded-full bg-neutral-300 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-[9px] text-neutral-400">Alex is typing</span>
                    </div>
                  </div>
                  <div className="p-2 border-t border-neutral-200">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-400 flex items-center justify-between">
                      <span>Message #general</span>
                      <div className="flex items-center gap-1 text-[9px] text-neutral-300">
                        <Command className="h-2.5 w-2.5" /><span>K to search</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's inside — two-column staggered */}
      <section className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <h2 className="text-3xl md:text-4xl font-serif mb-2">What&apos;s inside</h2>
          <p className="text-neutral-500 mb-12 max-w-lg">Every feature you&apos;d expect from a production chat app — built in a weekend.</p>

          <div className="grid sm:grid-cols-2 gap-x-16 gap-y-8">
            {[
              { label: "Real-time SSE", detail: "Messages, typing indicators, reactions, and presence updates stream over Server-Sent Events. Sub-100ms delivery." },
              { label: "Emoji reactions", detail: "React to any message with quick emoji. Toggle on/off, see who reacted, counts update live." },
              { label: "Inline replies", detail: "Quote any message with a single click. Quoted preview appears above your reply." },
              { label: "Message editing", detail: "Edit your own messages inline. Changes broadcast to all clients instantly." },
              { label: "Full-text search", detail: "Cmd+K opens a search modal. Search across all messages, jump to any channel." },
              { label: "Typing indicators", detail: "See who's composing. 3-second debounce, animated dots, auto-expire." },
              { label: "Unread badges", detail: "Red count badges on channels with new messages. Auto-clear on room enter." },
              { label: "Presence tracking", detail: "Online/offline status per user. Connections table + 10-second heartbeat." },
            ].map((f) => (
              <div key={f.label}>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">{f.label}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-serif mb-6">Architecture</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { layer: "Frontend", stack: "Next.js 16 · React 19 · Tailwind", note: "SSE real-time, optimistic updates, Clerk auth" },
              { layer: "Backend", stack: "FastAPI · Python 3.13", note: "48 REST endpoints, JWT verification, SSE pub/sub" },
              { layer: "Data", stack: "DynamoDB (5 tables) · S3", note: "Serverless, PAY_PER_REQUEST, zero idle cost" },
            ].map((a) => (
              <div key={a.layer} className="border border-neutral-200 rounded-lg bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">{a.layer}</p>
                <p className="text-sm font-semibold text-neutral-900 mb-2">{a.stack}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{a.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-serif italic mb-2">See it in action</h2>
          <p className="text-neutral-500 max-w-md mb-8">Sign up, create a channel, and start chatting. Takes about 10 seconds.</p>
          <Link href={cta}
            className="text-base font-medium bg-neutral-900 text-white px-8 py-3.5 rounded-md hover:bg-neutral-800 active:bg-black transition-colors inline-block">
            {ctaLabel}
            <ArrowRight className="inline ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <span className="text-xs text-neutral-400">Terminus</span>
          <span className="text-xs text-neutral-400">&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
