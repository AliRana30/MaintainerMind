"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface HighlighterProps {
  children: React.ReactNode;
  action?: "highlight" | "underline";
  color?: string;
  delay?: number;
}

export function Highlighter({
  children,
  action = "highlight",
  color = "#2bee4b",
  delay = 0.2,
}: HighlighterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  if (action === "underline") {
    return (
      <span ref={ref} className="relative inline-block px-1">
        <span className="relative z-10">{children}</span>
        <svg
          className="absolute left-0 -bottom-2 w-full h-[12px] pointer-events-none overflow-visible z-0"
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M 2 8 C 25 3, 50 11, 75 6 C 85 4, 95 9, 98 5.5"
            fill="none"
            stroke={color}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Secondary subtle shadow path for sketchy realism */}
          <motion.path
            d="M 4 9 C 30 5, 55 12, 80 7 C 88 5, 96 10, 97 7"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 0.95 } : { pathLength: 0 }}
            transition={{ duration: 0.8, delay: delay + 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ opacity: 0.4 }}
          />
        </svg>
      </span>
    );
  }

  return (
    <span ref={ref} className="relative inline-block px-2 py-0.5">
      <motion.span
        aria-hidden
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 0.22 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0.5 inset-y-[1px] rounded-[3px] origin-left z-0 skew-x-[-10deg] rotate-[-0.8deg]"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 4px ${color}30`,
        }}
      />
      <motion.span
        aria-hidden
        initial={{ scaleY: 0, opacity: 0 }}
        animate={inView ? { scaleY: 1, opacity: 0.55 } : { scaleY: 0, opacity: 0 }}
        transition={{ duration: 0.3, delay: delay - 0.05 }}
        className="absolute left-0 top-[2px] bottom-[2px] w-[3px] rounded-full z-0 skew-x-[-10deg] rotate-[-0.8deg] origin-top"
        style={{ backgroundColor: color }}
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}
