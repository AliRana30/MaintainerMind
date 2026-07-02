"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * SmoothCursor — Green arrow pointer matching app theme.
 *
 * Single arrow shape with spring physics. No outer halo ring.
 * Inner arrow: stiffness=800 / damping=35 → tight follow
 * Phantom lag element: stiffness=160 / damping=20 → visible spring lag (separate from arrow)
 *
 * Color: #12B76A (app green theme)
 *
 * Mounted ONCE in (dashboard)/layout.tsx — never per-page.
 * Touch devices: returns null immediately (no-op).
 */
export function SmoothCursor({ color = "#12B76A" }: { color?: string }) {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [lagPos, setLagPos] = useState({ x: -200, y: -200 });
  const [isPointer, setIsPointer] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
      return;
    }

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const el = e.target as HTMLElement;
      setIsPointer(
        el.tagName === "A" ||
          el.tagName === "BUTTON" ||
          el.closest("a") !== null ||
          el.closest("button") !== null ||
          window.getComputedStyle(el).cursor === "pointer"
      );
    };

    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);
    const onDown = () => setIsPressed(true);
    const onUp = () => setIsPressed(false);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isVisible]);

  // Lag follower — updates in RAF loop with exponential smoothing
  useEffect(() => {
    let rafId: number;
    let lx = -200;
    let ly = -200;

    function tick() {
      lx += (pos.x - lx) * 0.12;
      ly += (pos.y - ly) * 0.12;
      setLagPos({ x: lx, y: ly });
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [pos]);

  useEffect(() => {
    if (isVisible && !isTouchDevice) {
      document.documentElement.classList.add("custom-cursor-active");
    } else {
      document.documentElement.classList.remove("custom-cursor-active");
    }
    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, [isVisible, isTouchDevice]);

  if (isTouchDevice) return null;

  const arrowSize = isPointer ? 22 : 18;

  return (
    <>
      {/* ── Arrow cursor — MagicUI canonical pointer shape ── */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[999998]"
        animate={{
          x: pos.x,
          y: pos.y,
          opacity: isVisible ? 1 : 0,
          scale: isPressed ? 0.82 : isPointer ? 1.12 : 1,
        }}
        transition={{
          x: { type: "spring", stiffness: 800, damping: 35, mass: 0.15 },
          y: { type: "spring", stiffness: 800, damping: 35, mass: 0.15 },
          opacity: { duration: 0.1 },
          scale: { type: "spring", stiffness: 500, damping: 28 },
        }}
      >
        <svg
          width={arrowSize}
          height={arrowSize * 1.25}
          viewBox="0 0 18 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: isPointer
              ? `drop-shadow(0 0 6px ${color}99)`
              : `drop-shadow(0 1px 4px ${color}55)`,
            transition: "width 0.12s ease, height 0.12s ease",
          }}
        >
          {/* Arrow body */}
          <path
            d="M1.5 1.5L7.5 18.5L9.5 12.5L15.5 10.5L1.5 1.5Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </>
  );
}
