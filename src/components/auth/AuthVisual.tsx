"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HEADLINES = [
  "Never re-explain a design decision again.",
  "Your repo's memory, queryable.",
  "Context before you open the diff.",
];

// Seeded coordinates for miniature force-directed node graph
const NODES = [
  { id: 1, cx: 120, cy: 120, r: 12, label: "PR #849" },
  { id: 2, cx: 220, cy: 90, r: 16, label: "cognee/remember" },
  { id: 3, cx: 320, cy: 140, r: 10, label: "Vector Index" },
  { id: 4, cx: 180, cy: 220, r: 14, label: "Audit Log" },
  { id: 5, cx: 280, cy: 240, r: 11, label: "NextAuth" },
  { id: 6, cx: 340, cy: 70, r: 9, label: "Neon DB" },
];

const EDGES = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 2, to: 4 },
  { from: 4, to: 5 },
  { from: 3, to: 5 },
  { from: 2, to: 6 },
];

export default function AuthVisual() {
  const [headlineIndex, setHeadlineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % HEADLINES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-12 overflow-hidden select-none">
      {/* 1. Morphy Expressive Gradient Mesh Background */}
      <motion.div
        className="absolute inset-0 z-0 opacity-40 filter blur-[80px]"
        animate={{
          background: [
            "radial-gradient(circle at 20% 30%, rgba(43, 238, 75, 0.25) 0%, rgba(37, 212, 68, 0.15) 40%, rgba(43, 238, 75, 0.05) 70%, transparent 100%)",
            "radial-gradient(circle at 80% 70%, rgba(134, 239, 172, 0.25) 0%, rgba(43, 238, 75, 0.15) 40%, rgba(34, 197, 94, 0.15) 70%, transparent 100%)",
            "radial-gradient(circle at 40% 80%, rgba(34, 197, 94, 0.2) 0%, rgba(43, 238, 75, 0.2) 40%, rgba(134, 239, 172, 0.1) 70%, transparent 100%)",
            "radial-gradient(circle at 20% 30%, rgba(43, 238, 75, 0.25) 0%, rgba(37, 212, 68, 0.15) 40%, rgba(43, 238, 75, 0.05) 70%, transparent 100%)",
          ],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 2. Interactive Preview Graph (Drifting force-directed node cluster) */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <svg viewBox="0 0 420 320" className="w-[85%] max-w-[400px] overflow-visible">
          <defs>
            <linearGradient id="node-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#25d444" />
              <stop offset="100%" stopColor="#2bee4b" />
            </linearGradient>
          </defs>

          {/* Render Connection Edges */}
          {EDGES.map((edge, idx) => {
            const source = NODES.find((n) => n.id === edge.from)!;
            const target = NODES.find((n) => n.id === edge.to)!;

            return (
              <motion.line
                key={`edge-${idx}`}
                x1={source.cx}
                y1={source.cy}
                x2={target.cx}
                y2={target.cy}
                stroke="#2bee4b"
                strokeWidth="1.2"
                strokeOpacity="0.3"
                animate={{
                  x1: [source.cx, source.cx + (idx % 2 === 0 ? 8 : -8), source.cx],
                  y1: [source.cy, source.cy + (idx % 3 === 0 ? 6 : -6), source.cy],
                  x2: [target.cx, target.cx + (idx % 2 === 0 ? -6 : 6), target.cx],
                  y2: [target.cy, target.cy + (idx % 3 === 0 ? -8 : 8), target.cy],
                }}
                transition={{
                  duration: 8 + (idx % 3) * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}

          {/* Render Nodes */}
          {NODES.map((node, idx) => (
            <motion.g
              key={`node-${node.id}`}
              animate={{
                x: [0, idx % 2 === 0 ? 8 : -8, 0],
                y: [0, idx % 3 === 0 ? 6 : -6, 0],
              }}
              transition={{
                duration: 8 + (idx % 3) * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Outer Glow */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={node.r + 8}
                fill="#2bee4b"
                opacity="0.15"
              />
              {/* Node Solid Circle */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={node.r}
                fill="url(#node-grad)"
              />
              {/* Inner Icon (Simulation) */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={node.r / 3}
                fill="#0d1117"
                opacity="0.8"
              />
              {/* Label */}
              <text
                x={node.cx}
                y={node.cy + node.r + 14}
                textAnchor="middle"
                className="fill-[#8A8A92] font-mono text-[9px] font-medium tracking-tight"
              >
                {node.label}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>

      {/* 3. Fade-Rotating Headline */}
      <div className="relative z-10 text-left min-h-[64px]">
        <AnimatePresence mode="wait">
          <motion.h2
            key={headlineIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-[22px] font-semibold text-[#F2F2F3] leading-snug tracking-tight max-w-[340px]"
          >
            {HEADLINES[headlineIndex]}
          </motion.h2>
        </AnimatePresence>
      </div>
    </div>
  );
}
