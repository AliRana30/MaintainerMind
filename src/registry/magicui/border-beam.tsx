"use client";

import React from "react";
import { motion } from "framer-motion";

export function BorderBeam({
  color = "#12B76A",
  duration = 8,
}: {
  color?: string;
  duration?: number;
}) {
  return (
    <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden z-10 border border-[#232328]/40">
      <motion.div
        className="absolute w-32 h-32 rounded-full blur-2xl opacity-35 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 75%)`,
          top: "-64px",
          left: "-64px",
        }}
        animate={{
          x: ["0px", "500px", "500px", "0px", "0px"],
          y: ["0px", "0px", "300px", "300px", "0px"],
        }}
        transition={{
          duration: duration,
          ease: "linear",
          repeat: Infinity,
        }}
      />
      {/* Top light trace */}
      <div className="absolute inset-0 rounded-xl border border-[#12B76A]/10" />
    </div>
  );
}
