"use client";

import React, { useRef, useEffect } from "react";
import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity, wrap } from "framer-motion";

// ─── Single velocity row ──────────────────────────────────────────────────────
interface ScrollVelocityRowProps {
  children: React.ReactNode;
  baseVelocity?: number;
  /** 1 = left→right, -1 = right→left */
  direction?: 1 | -1;
  className?: string;
}

export function ScrollVelocityRow({
  children,
  baseVelocity = 20,
  direction = 1,
  className,
}: ScrollVelocityRowProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 2], { clamp: false });

  // wrap keeps the x value within a range so the repeated content loops
  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);

  const directionFactor = useRef<number>(direction);

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    // Amplify with scroll velocity
    if (velocityFactor.get() < 0) {
      directionFactor.current = -direction;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = direction;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  // Render 4 copies for seamless loop
  const copies = [children, children, children, children];

  return (
    <div className="overflow-hidden whitespace-nowrap flex">
      <motion.div style={{ x }} className={`flex whitespace-nowrap ${className ?? ""}`}>
        {copies.map((child, i) => (
          <span key={i} className="mr-8 inline-block">
            {child}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Container that wraps all rows ────────────────────────────────────────────
interface ScrollVelocityContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollVelocityContainer({ children, className }: ScrollVelocityContainerProps) {
  return (
    <div className={`relative flex w-full flex-col gap-0 overflow-hidden ${className ?? ""}`}>
      {children}
    </div>
  );
}
