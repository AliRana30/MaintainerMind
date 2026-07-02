"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
  useMotionValueEvent,
} from "framer-motion";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import MarketingNavbar from "@/components/layout/MarketingNavbar";
import { Lens } from "@/components/ui/lens";
import { Meteors } from "@/components/ui/meteors";
import { Highlighter } from "@/components/ui/highlighter";
import { ScrollVelocityContainer, ScrollVelocityRow } from "@/components/ui/scroll-velocity";
import { TextAnimate } from "@/registry/magicui/text-animate";

// ─── Spring physics configurations ─────────────────────────────────────────
const SPRING_SOFT = { type: "spring", stiffness: 200, damping: 20 } as const;
const SPRING_CTA = { type: "spring", stiffness: 400, damping: 20 } as const;
const SPRING_WORD = { type: "spring", stiffness: 300, damping: 25 } as const;
const SPRING_BOUNCE = { type: "spring", stiffness: 180, damping: 12 } as const;

// ─── PREMIUM CUSTOM SVG ICONS ──────────────────────────────────────────────

function BrainNetworkLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M16 6C12 6 9 9 9 13C9 15.5 10.5 17.5 11 19C11.5 20.5 11 22 13 23.5C14.5 24.5 15.5 25.5 16 26.5"
        stroke="#2bee4b"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      <motion.path
        d="M16 6C20 6 23 9 23 13C23 15.5 21.5 17.5 21 19C20.5 20.5 21 22 19 23.5C17.5 24.5 16.5 25.5 16 26.5"
        stroke="#2bee4b"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
      />
      <line x1="16" y1="6" x2="16" y2="26" stroke="#2bee4b" strokeWidth="2" strokeDasharray="2 2" />
      <motion.circle
        cx="16"
        cy="6"
        r="2.5"
        fill="#0d1117"
        stroke="#2bee4b"
        strokeWidth="1.5"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle
        cx="9"
        cy="13"
        r="2"
        fill="#2bee4b"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
      />
      <motion.circle
        cx="23"
        cy="13"
        r="2"
        fill="#2bee4b"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
      />
    </svg>
  );
}

function SleekArrowRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" className="origin-left transition-transform duration-300 group-hover:scale-x-110" />
      <polyline points="12 5 19 12 12 19" className="transition-transform duration-300 group-hover:translate-x-1" />
    </svg>
  );
}

function CustomPullRequestIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className} 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 15V9a4 4 0 0 0-4-4H9" />
      <line x1="6" y1="9" x2="6" y2="15" />
    </svg>
  );
}

function SubtleDeveloperBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1d2433_1px,transparent_1px),linear-gradient(to_bottom,#1d2433_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_80%,transparent_100%)] opacity-[0.22]" />
      <div className="absolute inset-0 opacity-[0.022] text-[#e6edf3]">
        <div className="absolute top-[12%] left-[8%] rotate-[-12%]">
          <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
            <path d="M18 15V9a4 4 0 0 0-4-4H9" /><line x1="6" y1="9" x2="6" y2="15" />
          </svg>
        </div>
        <div className="absolute top-[18%] right-[10%] rotate-[15%]">
          <svg className="w-24 h-24" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </div>
        <div className="absolute top-[48%] left-[12%] rotate-[8%]">
          <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <div className="absolute top-[52%] right-[14%] rotate-[-18%]">
          <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
          </svg>
        </div>
        <div className="absolute bottom-[20%] left-[9%] rotate-[-6%]">
          <svg className="w-22 h-22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        </div>
        <div className="absolute bottom-[16%] right-[8%] rotate-[12%]">
          <svg className="w-18 h-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="4" /><line x1="1.05" y1="12" x2="8" y2="12" /><line x1="16" y1="12" x2="22.95" y2="12" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Word Swap (Hero) ──────────────────────────────────────────────────────
const WORDS_HERO = ["remember", "recall", "improve", "evolve"];

function WordSwap() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS_HERO.length), 2500);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="relative inline-block overflow-hidden align-bottom h-[1.15em] w-[8.5ch]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={WORDS_HERO[index]}
          className="absolute left-0 text-[#2bee4b] font-bold"
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -25, opacity: 0 }}
          transition={SPRING_WORD}
        >
          {WORDS_HERO[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ─── Stat Counter (Hero) ───────────────────────────────────────────────────
function StatCounter({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
    const suffix = value.replace(/[0-9.]/g, "");
    const isDecimal = value.includes(".");
    const steps = 45;
    const duration = 1500;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numeric * eased;
      setDisplay(
        (isDecimal ? current.toFixed(1) : Math.floor(current).toString()) +
        suffix
      );
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-left w-full">
      <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight tabular-nums">
        {display}
      </div>
      <div className="text-[10px] sm:text-xs text-white mt-1.5 leading-snug font-semibold uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

// ─── PR Card (Hero) ────────────────────────────────────────────────────────
const prDecisions = [
  {
    type: "decision",
    text: "Background execution was originally chosen to avoid blocking in PR #122",
  },
  {
    type: "decision",
    text: "Cognify latency exceeded 400ms under load, violating SLA rules",
  },
  {
    type: "warning",
    text: "Removing background worker requires strict database isolation",
  },
];

function PRCard() {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCycle((c) => c + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      style={{ perspective: 800, rotateX: 8, rotateY: -4 }}
      className="relative w-full max-w-[480px]"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={cycle}
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -15 }}
          transition={SPRING_SOFT}
          className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden w-full"
        >
          <div className="border-b border-[#30363d] px-5 py-4 flex items-center justify-between gap-3 bg-[#161b22]">
            <div className="flex items-center gap-2.5">
              <CustomPullRequestIcon className="w-5 h-5 text-[#2bee4b] animate-pulse" />
              <span className="text-sm font-semibold text-white tracking-tight">
                #389: Remove background cognify for latency optimization
              </span>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#2bee4b]/10 text-[#2bee4b] border border-[#2bee4b]/20 font-bold uppercase tracking-wider">
              Open
            </span>
          </div>

          <div className="px-5 py-5 bg-[#0d1117]/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#2bee4b] shadow-[0_0_12px_rgba(43,238,75,0.1)]">
                <BrainNetworkLogo className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-tight">
                  MaintainerMind
                </div>
                <div className="text-[11px] text-white font-medium mt-0.5">
                  🧠 3 design decisions recalled
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pl-11">
              {prDecisions.map((d, i) => (
                <motion.div
                  key={`${cycle}-${i}`}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    ...SPRING_SOFT,
                    delay: 0.25 + i * 0.15,
                  }}
                  className={`text-xs px-3.5 py-2.5 rounded-lg border leading-relaxed ${d.type === "warning"
                    ? "bg-amber-500/5 border-amber-500/20 text-amber-300 font-medium"
                    : "bg-[#0d1117] border-[#30363d] text-white"
                    }`}
                >
                  {d.type === "warning" ? "⚠️ " : "• "}
                  {d.text}
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 }}
                className="flex items-center justify-between pt-2 border-t border-[#30363d]/40"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#2bee4b]/15 text-[#2bee4b] border border-[#2bee4b]/30 font-bold uppercase tracking-wider">
                    91% confident
                  </span>
                </div>
                <span className="text-[10px] text-white font-mono">
                  resolved from 847 commits
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── React Flow Background Nodes (Hero) ────────────────────────────────────
const NODE_TYPES_MAP = [
  "PR", "Issue", "Decision", "File", "Commit", "Author",
  "PR", "Decision", "File", "Issue", "Commit", "Author",
  "PR", "Decision", "File"
];

const COLOR_MAP: Record<string, string> = {
  PR: "#2bee4b",
  Issue: "#f97316",
  Decision: "#a78bfa",
  File: "#38bdf8",
  Commit: "#fb7185",
  Author: "#fbbf24",
};

function CustomNode({ data }: NodeProps) {
  const type = (data as { type: string }).type;
  const color = COLOR_MAP[type] ?? "#8b949e";
  return (
    <div
      style={{ borderColor: `${color}44`, boxShadow: `0 0 15px ${color}11` }}
      className="px-3 py-1.5 rounded-md bg-[#161b22] border text-[10px] font-mono font-semibold"
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <span style={{ color }}>{type}</span>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

const flowNodes: Node[] = NODE_TYPES_MAP.map((type, i) => ({
  id: `n${i}`,
  type: "custom",
  position: {
    x: 80 + (i % 5) * 180 + (Math.floor(i / 5) % 2 === 0 ? 0 : 90),
    y: 60 + Math.floor(i / 5) * 160,
  },
  data: { type },
}));

const flowEdges: Edge[] = [
  { id: "e0", source: "n0", target: "n2", animated: true, style: { stroke: "#2bee4b22", strokeWidth: 1.5 } },
  { id: "e1", source: "n1", target: "n3", animated: true, style: { stroke: "#a78bfa22", strokeWidth: 1.5 } },
  { id: "e2", source: "n2", target: "n4", animated: true, style: { stroke: "#2bee4b22", strokeWidth: 1.5 } },
  { id: "e3", source: "n5", target: "n0", animated: true, style: { stroke: "#fbbf2422", strokeWidth: 1.5 } },
  { id: "e4", source: "n6", target: "n7", animated: true, style: { stroke: "#2bee4b22", strokeWidth: 1.5 } },
  { id: "e5", source: "n8", target: "n9", animated: true, style: { stroke: "#38bdf822", strokeWidth: 1.5 } },
  { id: "e6", source: "n10", target: "n11", animated: true, style: { stroke: "#fb718522", strokeWidth: 1.5 } },
  { id: "e7", source: "n12", target: "n13", animated: true, style: { stroke: "#a78bfa22", strokeWidth: 1.5 } },
];


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION A — PROBLEM (Natural scroll layout)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ScrollProblemSection() {
  const bars = [
    { label: "Reviewing Hallucinations", hours: 8, pct: 100, color: "bg-red-500/80 border-red-400/40" },
    { label: "Triaging Raw Spam", hours: 6, pct: 75, color: "bg-red-500/50 border-red-400/20" },
    { label: "Actual Project Coding", hours: 2, pct: 25, color: "bg-[#2bee4b]/80 border-[#2bee4b]/40" },
  ];

  const decisions = [
    { 
      title: "Why OAuth was removed", 
      year: "2021", 
      desc: "OAuth token leak incident forced fallback to GitHub App installation.", 
      tag: "Security",
      icon: (
        <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
    { 
      title: "Session isolation decision", 
      year: "2022", 
      desc: "Isolated session memory limits to local Redis cluster nodes.", 
      tag: "Architecture",
      icon: (
        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
      )
    },
    { 
      title: "Redis caching strategy", 
      year: "2023", 
      desc: "Implemented strict LRU cache eviction policies with a 2-hour TTL.", 
      tag: "Performance",
      icon: (
        <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )
    },
    { 
      title: "Why v2 API was redesigned", 
      year: "2024", 
      desc: "Replaced JSON polling loops with gRPC event stream triggers.", 
      tag: "Refactoring",
      icon: (
        <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      )
    },
  ];

  return (
    <div className="w-full bg-[#0d1117] border-t border-[#30363d]/40 flex flex-col">

      {/* ─── PHASE 1 SECTION ─── */}
      <section className="relative w-full py-24 sm:py-32 border-b border-[#30363d]/20 px-6 overflow-hidden">
        <SubtleDeveloperBackground />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={SPRING_SOFT}
            className="flex-1 flex flex-col gap-4 text-left"
          >
            <span className="text-[#f97316] font-bold uppercase tracking-widest text-xs sm:text-sm">Phase 01 — The Noise</span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              AI floods the queue.
            </h2>
            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-7xl sm:text-8xl font-black text-[#2bee4b] tracking-tighter tabular-nums">47</span>
              <span className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider">PRs</span>
            </div>
            <p className="text-lg sm:text-xl text-[#8b949e] leading-relaxed max-w-md mt-2 font-medium">
              In 21 days. All AI-generated. All invalid.
            </p>
          </motion.div>

          <div className="flex-1 w-full max-w-[460px] flex flex-col gap-4">
            {[
              { id: 1, title: "PR #849: docs: fix grammar typos" },
              { id: 2, title: "PR #850: refactor: optimize array filter" },
              { id: 3, title: "PR #851: chore: update package locks" },
              { id: 4, title: "PR #852: feat: add cognitive test stub" },
            ].map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ ...SPRING_BOUNCE, delay: i * 0.1 }}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-lg flex items-center gap-4 transition-colors duration-300 hover:border-red-500/20"
              >
                <CustomPullRequestIcon className="w-5.5 h-5.5 text-red-400 shrink-0" />
                <div className="truncate text-left">
                  <div className="text-sm font-bold text-white truncate">{card.title}</div>
                  <div className="text-[11px] text-red-400/80 font-semibold mt-0.5">Failed Automated Lints</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PHASE 2 SECTION ─── */}
      <section className="relative w-full py-24 sm:py-32 border-b border-[#30363d]/20 px-6 overflow-hidden">
        <SubtleDeveloperBackground />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={SPRING_SOFT}
            className="flex-1 flex flex-col gap-4 text-left"
          >
            <span className="text-red-400 font-bold uppercase tracking-widest text-xs sm:text-sm">Phase 02 — The Burnout</span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Maintainers drown.
            </h2>
            <p className="text-lg sm:text-xl text-[#8b949e] leading-relaxed max-w-md mt-4 font-medium">
              8 hours of a maintainer's day — gone.
            </p>
          </motion.div>

          <div className="flex-1 w-full max-w-[500px] flex flex-col gap-6">
            {bars.map((bar, i) => (
              <div key={bar.label} className="flex flex-col gap-3">
                <div className="flex justify-between text-xs font-bold tracking-wide uppercase">
                  <span className="text-white">{bar.label}</span>
                  <span className="text-white">{bar.hours}h</span>
                </div>
                <div className="h-6 w-full bg-[#161b22] border border-[#30363d] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${bar.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ ...SPRING_SOFT, delay: 0.2 + i * 0.15 }}
                    className={`h-full border-r rounded-full ${bar.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PHASE 3 SECTION ─── */}
      <section className="relative w-full py-24 sm:py-32 px-6 overflow-hidden">
        <SubtleDeveloperBackground />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={SPRING_SOFT}
            className="flex-1 flex flex-col gap-4 text-left"
          >
            <span className="text-[#a78bfa] font-bold uppercase tracking-widest text-xs sm:text-sm">Phase 03 — The Loss</span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Knowledge disappears.
            </h2>
            <p className="text-lg sm:text-xl text-[#8b949e] leading-relaxed max-w-md mt-4 font-medium">
              It's gone. No PR. No issue. Just a closed Slack thread.
            </p>
          </motion.div>

          <div className="flex-1 w-full max-w-[480px] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {decisions.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ ...SPRING_SOFT, delay: i * 0.12 }}
                className="group relative bg-[#131316] border border-[#232328] rounded-xl p-5 flex flex-col justify-between h-[175px] shadow-lg text-left overflow-hidden transition-all duration-300 hover:border-[#6E56F2]/40 hover:bg-[#1B1B1F] hover:translate-y-[-2px]"
              >
                {/* Visual Accent */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(18,183,106,0.03),transparent)] pointer-events-none" />
                <div className="absolute right-[-15px] bottom-[-15px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none scale-150">
                  {card.icon}
                </div>

                <div className="flex items-center justify-between z-10 relative">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#8A8A92] tracking-wider uppercase">{card.year}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-[#232328] bg-[#131316] text-[#8A8A92] font-semibold">{card.tag}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#1B1B1F] border border-[#232328] group-hover:border-[#6E56F2]/20 transition-colors">
                    {card.icon}
                  </div>
                </div>

                <div className="flex flex-col gap-1 z-10 relative mt-2">
                  <div className="text-sm font-semibold text-[#F2F2F3] leading-snug group-hover:text-white transition-colors">{card.title}</div>
                  <p className="text-[11px] text-[#8A8A92] leading-normal font-normal line-clamp-2 mt-1">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION B — EVIDENCE (Editorial Spam Crisis with Highlighters)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SectionEvidence() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-24 border-t border-[#30363d]/40 relative text-center">
      <SubtleDeveloperBackground />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <span className="text-[#2bee4b] font-bold uppercase tracking-widest text-xs sm:text-sm">
          Proof in Production
        </span>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
          The open-source <Highlighter action="underline" color="#ff9800" delay={0.15}>spam crisis</Highlighter>.
        </h2>

        <div className="mt-8 space-y-8 text-lg sm:text-xl md:text-2xl text-[#8b949e] leading-relaxed font-medium max-w-3xl">
          <p>
            The open-source ecosystem is facing a{" "}
            <Highlighter action="highlight" color="#f87171" delay={0.3}>
              relentless wave of automated, AI-generated contributions
            </Highlighter>
            .
          </p>
          <p>
            What used to be a collaborative space is now flooded with{" "}
            <Highlighter action="underline" color="#fbbf24" delay={0.45}>
              low-quality pull requests
            </Highlighter>{" "}
            and completely fabricated security reports. Maintainers like Daniel Stenberg (creator of curl) are forced to spend critical hours triaging{" "}
            <Highlighter action="highlight" color="#2bee4b" delay={0.6}>
              hallucinated CVE vulnerabilities
            </Highlighter>{" "}
            that look highly technical but are entirely fake.
          </p>
          <p className="text-white">
            This isn’t just noise — it is a{" "}
            <Highlighter action="underline" color="#a78bfa" delay={0.75}>
              systemic developer burnout engine
            </Highlighter>{" "}
            distracting teams from core engineering tasks.
          </p>
        </div>
      </div>
    </section>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION B.5 — SCROLL VELOCITY DIVISION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SectionScrollVelocity() {
  return (
    <div className="w-full bg-[#0d1117] py-16 border-t border-b border-[#30363d]/40 relative overflow-hidden flex flex-col items-center justify-center">
      <ScrollVelocityContainer className="text-4xl font-extrabold tracking-[-0.02em] md:text-6xl uppercase text-white/95">
        <ScrollVelocityRow baseVelocity={2} direction={1} className="font-sans">
          MAINTAINERMIND · COGNEE MEMORY · LONG-TERM RETRIEVAL · KNOWLEDGE GRAPH RECALL · ZERO SPAM ·
        </ScrollVelocityRow>
        <ScrollVelocityRow baseVelocity={2} direction={-1} className="text-[#2bee4b] font-sans">
          AI-POWERED TRIAGE · SEMANTIC SEARCH · PERSISTED DESIGN DECISIONS · BURNOUT PROTECTION ·
        </ScrollVelocityRow>
      </ScrollVelocityContainer>

      {/* Sleek edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-[#0d1117] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-[#0d1117] to-transparent z-10" />
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION C — SOLUTION (animated data flow)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FLOW_STEPS = [
  { label: "GitHub Event", desc: "Webhook triggered on PR actions", icon: "🐙", isCognee: false },
  { label: "Webhook", desc: "Event parsed and queued", icon: "⚡", isCognee: false },
  { label: "cognee.remember()", desc: "PR contents indexed", icon: "🧠", isCognee: true },
  { label: "Knowledge Graph", desc: "Cognitive connections mapped", icon: "🕸️", isCognee: false },
  { label: "cognee.recall()", desc: "Semantic history queried", icon: "🔍", isCognee: true },
  { label: "PR Comment", desc: "Automated response posted", icon: "💬", isCognee: false },
];

function SectionSolution() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % FLOW_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-[#30363d]/40 flex flex-col items-center relative overflow-hidden">
      <SubtleDeveloperBackground />

      {/* Section Header */}
      <div className="text-center max-w-xl mb-16 relative z-10">
        <span className="text-[#2bee4b] font-bold uppercase tracking-widest text-xs">The Architecture</span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mt-2">
          How MaintainerMind works.
        </h2>
      </div>

      <div className="w-full relative z-10">
        {/* DESKTOP HORIZONTAL STEPPER */}
        <div className="hidden md:block relative w-full px-4">
          {/* Connecting line */}
          <div className="absolute top-6 left-12 right-12 h-[2px] bg-[#30363d]/50 z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-[#2bee4b] via-emerald-400 to-[#2bee4b]"
              initial={{ width: "0%" }}
              animate={{ width: `${(activeStep / (FLOW_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          <div className="grid grid-cols-6 gap-4 relative z-10">
            {FLOW_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              const isPast = idx < activeStep;
              return (
                <div key={step.label} className="flex flex-col items-center text-center">
                  {/* Glowing Node Circle */}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      borderColor: isActive
                        ? step.isCognee ? "#2bee4b" : "#e6edf3"
                        : isPast ? "#2bee4b" : "#30363d",
                      backgroundColor: isActive
                        ? step.isCognee ? "rgba(43, 238, 75, 0.1)" : "rgba(230, 237, 243, 0.05)"
                        : "#161b22"
                    }}
                    transition={SPRING_BOUNCE}
                    className="w-12 h-12 rounded-full border flex items-center justify-center text-base z-10 shadow-[0_0_20px_rgba(0,0,0,0.4)] relative cursor-pointer"
                    onClick={() => setActiveStep(idx)}
                  >
                    <span className="select-none">{step.icon}</span>
                    {isActive && (
                      <span className="absolute inset-0 rounded-full border border-[#2bee4b] animate-ping opacity-65" />
                    )}
                  </motion.div>

                  {/* Title & Description */}
                  <div className="mt-5 flex flex-col items-center">
                    <span className="text-[9px] font-mono font-bold text-[#8b949e] uppercase mb-1">
                      Step 0{idx + 1}
                    </span>
                    <h3 className={`text-xs font-mono font-bold transition-colors duration-300 ${isActive
                      ? step.isCognee ? "text-[#2bee4b]" : "text-white"
                      : "text-[#8b949e]"
                      }`}>
                      {step.label}
                    </h3>
                    <p className="text-[10px] text-[#8b949e] mt-2 leading-relaxed max-w-[120px] font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MOBILE VERTICAL TIMELINE */}
        <div className="md:hidden flex flex-col gap-6 relative pl-6 before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-[2px] before:bg-[#30363d]/50">
          {/* Animated vertical tracker */}
          <div className="absolute left-[11px] top-4 bottom-4 w-[2px] z-0 overflow-hidden">
            <motion.div
              className="w-full bg-[#2bee4b]"
              initial={{ height: "0%" }}
              animate={{ height: `${(activeStep / (FLOW_STEPS.length - 1)) * 100}%` }}
              style={{ originY: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {FLOW_STEPS.map((step, idx) => {
            const isActive = activeStep === idx;
            const isPast = idx < activeStep;
            return (
              <div
                key={step.label}
                onClick={() => setActiveStep(idx)}
                className="flex gap-4 items-start relative z-10 cursor-pointer"
              >
                {/* Node indicator */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    borderColor: isActive
                      ? step.isCognee ? "#2bee4b" : "#e6edf3"
                      : isPast ? "#2bee4b" : "#30363d",
                    backgroundColor: isActive ? "#161b22" : "#0d1117"
                  }}
                  transition={SPRING_BOUNCE}
                  className="w-6 h-6 rounded-full border bg-[#161b22] flex items-center justify-center text-xs shrink-0 z-10"
                >
                  <span className="select-none text-xs">{step.icon}</span>
                </motion.div>

                {/* Card */}
                <motion.div
                  animate={{
                    borderColor: isActive ? "#30363d" : "transparent",
                    backgroundColor: isActive ? "#161b22" : "transparent",
                  }}
                  className="flex-1 p-3 rounded-xl border border-transparent flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-mono font-bold ${isActive
                      ? step.isCognee ? "text-[#2bee4b]" : "text-white"
                      : "text-[#8b949e]"
                      }`}>
                      {step.label}
                    </h3>
                    <span className="text-[9px] font-mono text-[#484f58]">0{idx + 1}</span>
                  </div>
                  <p className="text-xs text-[#8b949e] leading-relaxed font-medium mt-1">
                    {step.desc}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROMPT 08: SECTION B — COMPETITIVE TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AnimatedCheck() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2bee4b"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 mx-auto text-[#2bee4b]"
      initial={{ pathLength: 0, scale: 0.5 }}
      whileInView={{ pathLength: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <polyline points="20 6 9 17 4 12" />
    </motion.svg>
  );
}

function GrayCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mx-auto opacity-70">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RedCross() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mx-auto opacity-65">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SectionCompetitive() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const rows = [
    { name: "CodeRabbit", memory: false, reasoning: false, scope: true, selfImprove: false },
    { name: "Greptile", memory: false, reasoning: false, scope: true, selfImprove: false },
    { name: "GitHub Copilot", memory: false, reasoning: false, scope: false, selfImprove: false },
    { name: "MaintainerMind", memory: true, reasoning: true, scope: true, selfImprove: true, highlight: true },
  ];

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-6 py-24 border-t border-[#30363d]/40 relative">
      <SubtleDeveloperBackground />
      <div className="mb-16 text-center relative z-10">
        <span className="text-[#2bee4b] font-bold uppercase tracking-widest text-xs">How We Compare</span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-2">
          Competitive Analysis
        </h2>
      </div>

      <div className="w-full overflow-x-auto relative z-10 border border-[#30363d] rounded-2xl bg-[#161b22]/20 backdrop-blur-md shadow-2xl scrollbar-thin">
        <table className="w-full border-collapse text-left text-sm select-none min-w-[640px]">
          <thead>
            <tr className="border-b border-[#30363d] text-white font-semibold text-xs uppercase tracking-wider bg-[#161b22]/40">
              <th className="py-4 px-4 sm:py-5 sm:px-6 sticky left-0 bg-[#0d1117] z-20 w-[140px] sm:w-[220px] border-r border-[#30363d]/80">Tool</th>
              <th className="py-4 px-4 sm:py-5 sm:px-6 text-center">Persistent Memory</th>
              <th className="py-4 px-4 sm:py-5 sm:px-6 text-center">Graph Reasoning</th>
              <th className="py-4 px-4 sm:py-5 sm:px-6 text-center">Per-Repo Scope</th>
              <th className="py-4 px-4 sm:py-5 sm:px-6 text-center">Self-Improving</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isMM = row.highlight;
              return (
                <motion.tr
                  key={row.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ ...SPRING_SOFT, delay: i * 0.1 }}
                  className={`border-b border-[#30363d]/60 font-medium transition-colors last:border-b-0 ${isMM
                    ? "bg-[#0d2918]/60 text-white border-y border-emerald-500/20 shadow-[inset_0_0_20px_rgba(43,238,75,0.05)]"
                    : "text-white hover:bg-[#161b22]/30"
                    }`}
                >
                  <td className={`py-4 px-4 sm:py-5 sm:px-6 font-bold sticky left-0 z-10 transition-colors border-r border-[#30363d]/80 ${isMM ? "bg-[#0d2918] text-[#2bee4b]" : "bg-[#0d1117]"
                    }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="truncate">{row.name}</span>
                      {isMM && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#2bee4b]/15 border border-[#2bee4b]/35 uppercase tracking-widest font-bold w-fit">You</span>}
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:py-5 sm:px-6 text-center">
                    {isMM ? <AnimatedCheck /> : row.memory ? <GrayCheck /> : <RedCross />}
                  </td>
                  <td className="py-4 px-4 sm:py-5 sm:px-6 text-center">
                    {isMM ? <AnimatedCheck /> : row.reasoning ? <GrayCheck /> : <RedCross />}
                  </td>
                  <td className="py-4 px-4 sm:py-5 sm:px-6 text-center">
                    {isMM ? <AnimatedCheck /> : row.scope ? <GrayCheck /> : <RedCross />}
                  </td>
                  <td className="py-4 px-4 sm:py-5 sm:px-6 text-center">
                    {isMM ? <AnimatedCheck /> : row.selfImprove ? <GrayCheck /> : <RedCross />}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROMPT 08: SECTION C — FINAL CTA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SectionFinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative w-full border-t border-[#30363d]/40 py-32 bg-[#0d1117] flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(43,238,75,0.035) 0%, transparent 65%)"
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1d2433_1px,transparent_1px),linear-gradient(to_bottom,#1d2433_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.08]" />

      <div className="relative z-10 max-w-4xl px-6 text-center flex flex-col items-center gap-9">
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING_SOFT, delay: 0.15 }}
          className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-3xl"
        >
          Your codebase has memory. <br />
          <span className="bg-gradient-to-br from-white via-white to-[#2bee4b] bg-clip-text text-transparent">
            Your maintainers shouldn't have to.
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING_SOFT, delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-2"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={SPRING_CTA}>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2.5 px-8 py-4 bg-[#2bee4b] text-black font-extrabold rounded-md shadow-[0_0_24px_rgba(43,238,75,0.45)] hover:shadow-[0_0_36px_rgba(43,238,75,0.7)] transition-shadow text-base"
            >
              Connect Your Repo <SleekArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={SPRING_CTA}>
            {/* Fixed the star on GitHub link to point to the real topoteretes/cognee repository! */}
            <a
              href="https://github.com/topoteretes/cognee"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#30363d] text-white font-semibold rounded-md hover:border-[#2bee4b] hover:text-[#2bee4b] transition-all text-base"
            >
              Star on GitHub
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN MARKETING PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function MarketingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const flowX = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), SPRING_SOFT);
  const flowY = useSpring(useTransform(mouseY, [0, 1], [-10, 10]), SPRING_SOFT);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    },
    [mouseX, mouseY]
  );

  return (
    <div
      className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans overflow-hidden selection:bg-[#2bee4b]/30 selection:text-[#2bee4b]"
      onMouseMove={handleMouseMove}
    >
      {/* ─── Navbar ─── */}
      <MarketingNavbar />

      <motion.section
        ref={heroRef}
        style={{ y: heroY }}
        className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden"
      >
        <SubtleDeveloperBackground />

        {/* React Flow background */}
        <motion.div
          style={{ x: flowX, y: flowY }}
          className="absolute inset-0 z-0 pointer-events-none opacity-25"
        >
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            fitView
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#30363d" gap={40} size={1.2} />
          </ReactFlow>
        </motion.div>

        {/* Vignette */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, #0d1117 75%)",
          }}
        />

        {/* Meteors layer */}
        <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
          <Meteors number={28} color="#2bee4b" minSpeed={10} maxSpeed={20} minDelay={0} maxDelay={8} />
        </div>

        {/* Ambient orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[#2bee4b]/8 blur-[140px] pointer-events-none z-[1]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-500/8 blur-[120px] pointer-events-none z-[1]" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-7">
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SOFT, delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.2] tracking-tight text-left text-white"
            >
              <TextAnimate animation="blurInUp" by="character" once>
                The codebase memory agent that helps
              </TextAnimate>{" "}
              <span className="inline-block whitespace-nowrap">
                <TextAnimate animation="blurInUp" by="character" once>
                  maintainers
                </TextAnimate>{" "}
                <WordSwap />
              </span>
            </motion.h1>

            {/* Sub - Changed text-color to high-contrast white */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SOFT, delay: 0.35 }}
              className="text-lg md:text-xl text-white max-w-lg leading-relaxed font-medium text-left"
            >
              Never re-explain a design decision. Your codebase remembers.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SOFT, delay: 0.45 }}
              className="flex flex-wrap gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_CTA}
              >
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#2bee4b] text-black font-extrabold rounded-md shadow-[0_0_24px_#2bee4b66] hover:shadow-[0_0_36px_#2bee4b99] transition-shadow text-left"
                >
                  Connect GitHub Repo <SleekArrowRight className="w-4.5 h-4.5" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SOFT, delay: 0.55 }}
              className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 border-t border-[#30363d]/60 mt-4 w-full"
            >
              <StatCounter value="44%" label="of maintainers report burnout" />
              <StatCounter value="1.7×" label="more defects in AI-written PRs" />
              <StatCounter value="0" label="tools with long-term repo memory" />
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING_SOFT, delay: 0.45 }}
            className="flex justify-center lg:justify-end w-full"
          >
            <div className="w-full max-w-[480px] flex flex-col gap-4">
              {/* Lens-wrapped PR Card */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-[#30363d] shadow-[0_0_40px_rgba(43,238,75,0.06)]">
                <Lens
                  zoomFactor={1.3}
                  lensSize={120}
                  isStatic={false}
                  ariaLabel="Knowledge graph preview zoom"
                  className="w-full"
                >
                  <div className="w-full bg-[#161b22] px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2bee4b]" />
                      <span className="text-[11px] text-[#484f58] font-mono ml-2 tracking-wide">cognee knowledge graph — live session</span>
                    </div>
                    <div className="font-mono text-[11px] sm:text-xs space-y-2 select-none">
                      {[
                        { label: "PR #389", rel: "MODIFIED", target: "background-cognify.ts", color: "#2bee4b" },
                        { label: "PR #389", rel: "RECALLS", target: "latency SLA (2024)", color: "#a78bfa" },
                        { label: "DECISION", rel: "SUPERSEDES", target: "async-worker queue", color: "#f97316" },
                        { label: "COMMIT b3d8a", rel: "AFFECTS", target: "webhook-handler.ts", color: "#38bdf8" },
                        { label: "@dan_dev", rel: "AUTHORED", target: "8 related PRs", color: "#fbbf24" },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center gap-2 text-[#8b949e]">
                          <span style={{ color: row.color }} className="font-bold shrink-0">{row.label}</span>
                          <span className="text-[#484f58] shrink-0">→</span>
                          <span className="text-[#484f58] uppercase text-[9px] tracking-widest shrink-0">{row.rel}</span>
                          <span className="text-[#484f58]">:</span>
                          <span className="text-[#e6edf3] truncate">{row.target}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#21262d] flex items-center justify-between text-[10px]">
                      <span className="text-[#484f58] font-mono">5 nodes · 8 edges recalled</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#2bee4b]/10 text-[#2bee4b] font-bold border border-[#2bee4b]/20">91% confidence</span>
                    </div>
                  </div>
                </Lens>
                <div className="bg-[#0d1117] border-t border-[#21262d] px-5 py-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#161b22] border border-[#21262d] flex items-center justify-center text-[#2bee4b] text-[9px]">🧠</div>
                  <span className="text-xs text-[#8b949e] font-medium">Hover to zoom into the knowledge graph</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── SECTION A: PROBLEM (Scroll-driven Sticky / Mobile-optimized) ─── */}
      <ScrollProblemSection />

      {/* ─── SECTION B: EVIDENCE (Using Card Fan Carousel) ─── */}
      <SectionEvidence />

      {/* ─── SCROLL VELOCITY DIVIDER ─── */}
      <SectionScrollVelocity />

      {/* ─── SECTION C: SOLUTION (Animated Data Flow) ─── */}
      <SectionSolution />


      {/* ─── PROMPT 08: SECTION B — COMPETITIVE ANALYSIS TABLE ─── */}
      <SectionCompetitive />

      {/* ─── PROMPT 08: SECTION C — FINAL CTA ─── */}
      <SectionFinalCTA />



      {/* ─── Footer ─── */}
      <footer className="border-t border-[#30363d]/60 py-12 bg-[#0d1117] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#8b949e] font-medium">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#2bee4b]">
              <BrainNetworkLogo className="h-5 w-5" />
            </div>
            <span className="font-bold text-white tracking-tight">MaintainerMind</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
