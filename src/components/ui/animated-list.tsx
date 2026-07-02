"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ─── AnimatedList Core ────────────────────────────────────────────────────────
function AnimatedList({
  children,
  delay = 1200,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const [index, setIndex] = useState(0);
  const childrenArray = React.Children.toArray(children);

  useEffect(() => {
    if (index < childrenArray.length - 1) {
      const timer = setTimeout(() => setIndex((i) => i + 1), delay);
      return () => clearTimeout(timer);
    }
  }, [index, childrenArray.length, delay]);

  return (
    <div className="flex flex-col-reverse gap-2 items-center w-full">
      <AnimatePresence>
        {childrenArray.slice(0, index + 1).map((child, i) => (
          <motion.div
            key={(child as React.ReactElement).key ?? i}
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 28,
              mass: 0.8,
            }}
            className="w-full"
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── MaintainerMind notification types ───────────────────────────────────────
interface MaintainerEvent {
  title: string;
  description: string;
  icon: string;
  accent: string;
  tag: string;
  time: string;
}

const EVENTS: MaintainerEvent[] = [
  {
    icon: "🧠",
    title: "Knowledge indexed",
    description: "Caching strategy decision mapped to semantic graph",
    accent: "#2bee4b",
    tag: "cognee/cognee",
    time: "just now",
  },
  {
    icon: "🚫",
    title: "PR blocked",
    description: "AI-generated PR failed 3 design-decision checks",
    accent: "#f97316",
    tag: "vercel/next.js",
    time: "12s ago",
  },
  {
    icon: "🔗",
    title: "Decision recalled",
    description: "Recalled OAuth removal from 2021 for PR #912 review",
    accent: "#a78bfa",
    tag: "facebook/react",
    time: "43s ago",
  },
  {
    icon: "⚠️",
    title: "Spam wave detected",
    description: "14 near-identical AI PRs submitted in 8 minutes",
    accent: "#fbbf24",
    tag: "curl/curl",
    time: "1m ago",
  },
  {
    icon: "✅",
    title: "PR auto-approved",
    description: "Legitimate PR aligns with cached caching strategy",
    accent: "#2bee4b",
    tag: "cognee/cognee",
    time: "2m ago",
  },
  {
    icon: "📌",
    title: "Architecture node added",
    description: "Redis-to-Dragonfly migration decision persisted",
    accent: "#38bdf8",
    tag: "dragonfly/db",
    time: "3m ago",
  },
  {
    icon: "🧪",
    title: "Recall test passed",
    description: "GRAPH_COMPLETION returned 91% confidence on JWT query",
    accent: "#2bee4b",
    tag: "cognee/cognee",
    time: "4m ago",
  },
  {
    icon: "🔔",
    title: "Webhook received",
    description: "22 new events queued via BullMQ worker pipeline",
    accent: "#818cf8",
    tag: "maintainermind",
    time: "5m ago",
  },
];

// Repeat to create a long list for continuous scrolling
const ALL_EVENTS = Array.from({ length: 3 }, () => EVENTS).flat();

// ─── Single Event Card ────────────────────────────────────────────────────────
function EventCard({ title, description, icon, accent, tag, time }: MaintainerEvent) {
  return (
    <figure
      className="relative w-full max-w-[420px] mx-auto cursor-pointer overflow-hidden rounded-xl p-3.5
        bg-[#161b22] border border-[#21262d]
        dark:[box-shadow:0_-12px_40px_-12px_rgba(43,238,75,0.06)_inset]
        hover:border-[#30363d] hover:scale-[1.02]
        transition-all duration-200 ease-in-out"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}28` }}
        >
          <span>{icon}</span>
        </div>

        {/* Content */}
        <div className="flex flex-col overflow-hidden flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold text-white truncate">{title}</span>
            <span className="text-[#484f58] text-xs shrink-0">·</span>
            <span className="text-[10px] text-[#484f58] shrink-0 font-medium">{time}</span>
          </div>
          <p className="text-xs text-[#8b949e] truncate leading-snug mt-0.5">{description}</p>
        </div>

        {/* Accent dot */}
        <div
          className="w-1.5 h-1.5 rounded-full shrink-0 ml-1"
          style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
        />
      </div>

      {/* Tag chip */}
      <div className="mt-2.5 flex items-center gap-1.5 pl-[52px]">
        <span
          className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md tracking-wide"
          style={{
            color: accent,
            backgroundColor: `${accent}12`,
            border: `1px solid ${accent}20`,
          }}
        >
          {tag}
        </span>
      </div>
    </figure>
  );
}

// ─── The full animated list component with continuous cycling ─────────────────
export function MaintainerAnimatedList({ className }: { className?: string }) {
  const [visibleCount, setVisibleCount] = useState(1);
  const MAX_VISIBLE = 5;

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((c) => {
        if (c < ALL_EVENTS.length) return c + 1;
        return 1; // Reset for continuous loop
      });
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  const visible = ALL_EVENTS.slice(0, Math.min(visibleCount, MAX_VISIBLE));

  return (
    <div
      className={`relative flex flex-col overflow-hidden p-2 h-[340px] w-full ${className ?? ""}`}
    >
      <div className="flex flex-col-reverse gap-2 w-full items-center">
        <AnimatePresence initial={false}>
          {visible.map((item, idx) => (
            <motion.div
              key={`${item.title}-${visibleCount - idx}`}
              layout
              initial={{ scale: 0.88, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 28,
                mass: 0.85,
              }}
              className="w-full"
            >
              <EventCard {...item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom fade-out gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0d1117] to-transparent z-10" />
    </div>
  );
}
