"use client";

import { useState, useEffect } from "react";
import { Hash, Plus, Users, SendHorizontal, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingProps {
  onComplete: () => void;
  userName?: string;
}

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to Townhall",
    description: "Your team's real-time messaging hub. Let us show you around — it only takes a moment.",
    visual: (
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-neutral-900 tracking-tight">Townhall</span>
      </div>
    ),
  },
  {
    icon: Hash,
    title: "Channels",
    description: "Conversations are organized into channels. Each one is a dedicated space — like #general for announcements or #engineering for dev talk.",
    visual: (
      <div className="space-y-1 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        {["general", "engineering", "design"].map((ch, i) => (
          <div key={ch} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${i === 0 ? "bg-neutral-900 text-white" : "text-neutral-500"}`}>
            <Hash className="h-3.5 w-3.5 opacity-60" />
            {ch}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Plus,
    title: "Create channels",
    description: "Click the + button next to Channels in the sidebar. Give it a name and your team can join instantly.",
    visual: (
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Channels</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-white">
          <Plus className="h-3.5 w-3.5" />
        </div>
      </div>
    ),
  },
  {
    icon: SendHorizontal,
    title: "Send messages",
    description: "Type your message and hit Enter. Messages are delivered instantly to everyone in the channel — no refresh needed.",
    visual: (
      <div className="flex items-end gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3">
        <span className="flex-1 text-sm text-neutral-400">Message #general</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-white">
          <SendHorizontal className="h-3.5 w-3.5" />
        </div>
      </div>
    ),
  },
  {
    icon: Users,
    title: "See who's here",
    description: "The members panel on the right shows who's in the channel and their online status. Toggle it with the people icon.",
    visual: (
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Online — 3</span>
        {["Sarah Chen", "Alex Rivera", "You"].map((name) => (
          <div key={name} className="flex items-center gap-2">
            <div className="relative">
              <div className="h-6 w-6 rounded-full bg-neutral-200 flex items-center justify-center text-[9px] font-medium text-neutral-600">
                {name[0]}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-neutral-50" />
            </div>
            <span className="text-xs text-neutral-700">{name}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export function Onboarding({ onComplete, userName }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  const close = () => {
    setExiting(true);
    setTimeout(onComplete, 400);
  };

  const handleNext = () => {
    if (isLast) {
      close();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${
        visible && !exiting ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={close} />

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-sm mx-4 transition-all duration-500 ${
          visible && !exiting ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="flex gap-1 px-5 pt-5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full overflow-hidden bg-neutral-100"
              >
                <div
                  className="h-full bg-neutral-900 rounded-full transition-all duration-500 ease-out"
                  style={{ width: i < step ? "100%" : i === step ? "100%" : "0%" }}
                />
              </div>
            ))}
          </div>

          <div className="px-5 pt-5 pb-5">
            {/* Visual preview */}
            <div className="mb-5">
              {current.visual}
            </div>

            {/* Icon + Title */}
            <div className="flex items-start gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-neutral-700" />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-neutral-900 leading-snug">
                  {step === 0 && userName ? `Welcome, ${userName.split(" ")[0]}` : current.title}
                </h2>
                <p className="text-[13px] text-neutral-500 leading-relaxed mt-1">
                  {current.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-100">
              <button
                onClick={close}
                className="text-[12px] text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-neutral-300 tabular-nums">
                  {step + 1}/{steps.length}
                </span>
                <Button onClick={handleNext} size="sm" className="text-[13px] h-8 px-4">
                  {isLast ? "Get started" : "Next"}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
