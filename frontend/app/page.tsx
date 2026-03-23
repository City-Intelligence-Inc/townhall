"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Hash, Users, Zap, Shield, MessageSquare, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900">
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-neutral-900 tracking-tight">Townhall</span>
          </Link>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link href="/chat">
                <Button size="sm" className="text-[13px]">
                  Open Townhall
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-[13px] text-neutral-600">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="text-[13px]">
                    Get started
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium text-neutral-400 uppercase tracking-wider mb-4">
            City Intelligence
          </p>
          <h1 className="text-5xl font-semibold text-neutral-900 leading-[1.1] font-serif">
            Where your team
            <br />
            comes together
          </h1>
          <p className="mt-5 text-lg text-neutral-500 leading-relaxed max-w-lg">
            Townhall is a real-time messaging platform built for teams that value clarity,
            speed, and focus. No noise — just conversation.
          </p>
          <div className="mt-8 flex items-center gap-3">
            {isSignedIn ? (
              <Link href="/chat">
                <Button size="lg" className="text-[14px] h-11 px-6">
                  Open Townhall
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button size="lg" className="text-[14px] h-11 px-6">
                    Start for free
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" size="lg" className="text-[14px] h-11 px-6">
                    Sign in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* App preview */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden shadow-sm">
          <div className="flex h-[420px]">
            {/* Fake sidebar */}
            <div className="w-[220px] bg-neutral-100/80 border-r border-neutral-200 p-4 hidden sm:block">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-6 w-6 rounded bg-neutral-900 flex items-center justify-center">
                  <MessageSquare className="h-3 w-3 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-neutral-700">Townhall</span>
              </div>
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-2 px-1">Channels</p>
              <div className="space-y-0.5">
                {["general", "engineering", "design", "random"].map((ch, i) => (
                  <div
                    key={ch}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-[12px] ${
                      i === 0 ? "bg-neutral-900 text-white" : "text-neutral-500"
                    }`}
                  >
                    <Hash className="h-3 w-3 shrink-0 opacity-60" />
                    {ch}
                  </div>
                ))}
              </div>
            </div>
            {/* Fake chat */}
            <div className="flex-1 flex flex-col">
              <div className="h-10 border-b border-neutral-200 flex items-center px-4 gap-2">
                <Hash className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-[13px] font-semibold text-neutral-700">general</span>
              </div>
              <div className="flex-1 p-4 space-y-4">
                {[
                  { name: "Sarah Chen", msg: "Just shipped the new onboarding flow! Check it out when you get a chance.", time: "10:32 AM", color: "bg-blue-100 text-blue-700" },
                  { name: "Alex Rivera", msg: "Looks great! The animations are really smooth. Nice work.", time: "10:34 AM", color: "bg-amber-100 text-amber-700" },
                  { name: "Jordan Lee", msg: "Agreed — love the progress indicators. Can we add that pattern to the design system?", time: "10:35 AM", color: "bg-emerald-100 text-emerald-700" },
                ].map((m, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`h-8 w-8 rounded-full ${m.color} flex items-center justify-center text-[11px] font-semibold shrink-0`}>
                      {m.name[0]}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-neutral-800">{m.name}</span>
                        <span className="text-[10px] text-neutral-400">{m.time}</span>
                      </div>
                      <p className="text-[13px] text-neutral-600 leading-relaxed">{m.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-neutral-200">
                <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-400">
                  Message #general
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-neutral-100 bg-neutral-50/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-md mb-14">
            <h2 className="text-3xl font-semibold text-neutral-900 font-serif">
              Everything you need,
              <br />nothing you don&apos;t
            </h2>
            <p className="mt-3 text-[15px] text-neutral-500 leading-relaxed">
              Built for focused teams who want to communicate without the bloat.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Real-time messaging",
                desc: "Messages appear instantly across all connected clients via WebSocket — no polling, no delays.",
              },
              {
                icon: Hash,
                title: "Organized channels",
                desc: "Create channels for any topic. Keep conversations focused and easy to find.",
              },
              {
                icon: Users,
                title: "Presence & awareness",
                desc: "See who's online, who's typing, and who's in each channel at a glance.",
              },
              {
                icon: Shield,
                title: "Secure by default",
                desc: "Authentication powered by Clerk. Your identity and data are always protected.",
              },
              {
                icon: MessageSquare,
                title: "Persistent history",
                desc: "Messages stored in DynamoDB. Pick up any conversation right where you left off.",
              },
              {
                icon: Globe,
                title: "Deploy anywhere",
                desc: "Next.js frontend, FastAPI backend, DynamoDB persistence — all on AWS App Runner.",
              },
            ].map((f) => (
              <div key={f.title}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 mb-3">
                  <f.icon className="h-4 w-4 text-neutral-600" />
                </div>
                <h3 className="text-[14px] font-semibold text-neutral-900 mb-1">{f.title}</h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-100">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 font-serif">Ready to try Townhall?</h2>
          <p className="mt-3 text-[15px] text-neutral-500 max-w-md mx-auto">
            Create your workspace in seconds. No credit card required.
          </p>
          <div className="mt-8">
            {isSignedIn ? (
              <Link href="/chat">
                <Button size="lg" className="text-[14px] h-11 px-8">
                  Go to Townhall
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button size="lg" className="text-[14px] h-11 px-8">
                  Get started free
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-neutral-900">
              <MessageSquare className="h-2.5 w-2.5 text-white" />
            </div>
            <span className="text-[12px] text-neutral-400">Townhall by City Intelligence</span>
          </div>
          <p className="text-[12px] text-neutral-400">&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
