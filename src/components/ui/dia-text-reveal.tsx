"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface DiaTextRevealProps {
  text: string;
  /** Gradient colors applied across characters. Default: #2bee4b → white */
  colors?: string[];
  className?: string;
  /** Delay between characters in ms. Default: 40 */
  charDelay?: number;
  /** Duration of each character's entrance. Default: 0.5s */
  duration?: number;
}

/**
 * DiaTextReveal — characters animate in diagonally (y + opacity + blur)
 * with a sweeping gradient color pass across the text.
 */
export function DiaTextReveal({
  text,
  colors = ["#2bee4b", "#a78bfa", "#e6edf3"],
  className = "",
  charDelay = 45,
  duration = 0.55,
}: DiaTextRevealProps) {
  const chars = Array.from(text);

  const getColor = (index: number, total: number) => {
    // Map index to a gradient across the provided colors array
    const progress = index / Math.max(total - 1, 1);
    const segmentCount = colors.length - 1;
    const segment = Math.min(Math.floor(progress * segmentCount), segmentCount - 1);
    const segmentProgress = (progress * segmentCount) - segment;

    // Parse hex colors and interpolate
    const from = hexToRgb(colors[segment]);
    const to = hexToRgb(colors[segment + 1] || colors[segment]);

    if (!from || !to) return colors[0];

    const r = Math.round(from.r + (to.r - from.r) * segmentProgress);
    const g = Math.round(from.g + (to.g - from.g) * segmentProgress);
    const b = Math.round(from.b + (to.b - from.b) * segmentProgress);

    return `rgb(${r},${g},${b})`;
  };

  return (
    <span className={`inline-flex flex-wrap ${className}`} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{
            opacity: 0,
            y: 24,
            x: -8,
            filter: "blur(6px)",
            color: colors[0],
          }}
          animate={{
            opacity: 1,
            y: 0,
            x: 0,
            filter: "blur(0px)",
            color: getColor(i, chars.length),
          }}
          transition={{
            duration,
            delay: i * (charDelay / 1000),
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block"
          style={{
            // Keep whitespace
            whiteSpace: char === " " ? "pre" : "normal",
          }}
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Hex to RGB helper ────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const val = parseInt(clean, 16);
  if (isNaN(val)) return null;
  return {
    r: (val >> 16) & 255,
    g: (val >> 8) & 255,
    b: val & 255,
  };
}
