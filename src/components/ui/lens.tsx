"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface LensProps {
  children: React.ReactNode;
  zoomFactor?: number;
  lensSize?: number;
  isStatic?: boolean;
  staticPosition?: { x: number; y: number };
  ariaLabel?: string;
  className?: string;
}

export function Lens({
  children,
  zoomFactor = 1.8,
  lensSize = 140,
  isStatic = false,
  staticPosition = { x: 200, y: 150 },
  ariaLabel = "Zoom Area",
  className,
}: LensProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setContainerRect(rect);
  };

  const pos = isStatic ? staticPosition : mousePos;
  const halfLens = lensSize / 2;

  // Clamp lens so it doesn't go outside the container
  const clampedX = containerRect
    ? Math.max(halfLens, Math.min(containerRect.width - halfLens, pos.x))
    : pos.x;
  const clampedY = containerRect
    ? Math.max(halfLens, Math.min(containerRect.height - halfLens, pos.y))
    : pos.y;

  const show = isStatic || isHovering;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className ?? ""}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label={ariaLabel}
    >
      {/* Original content */}
      {children}

      {/* Lens circle */}
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="pointer-events-none absolute rounded-full overflow-hidden z-20"
          style={{
            width: lensSize,
            height: lensSize,
            left: clampedX - halfLens,
            top: clampedY - halfLens,
            boxShadow: `
              0 0 0 1px rgba(43,238,75,0.25),
              0 0 0 3px rgba(43,238,75,0.08),
              0 8px 32px rgba(0,0,0,0.5),
              inset 0 0 0 1px rgba(43,238,75,0.12)
            `,
          }}
        >
          {/* Zoomed clone of children via CSS scale transform on a clipping container */}
          <div
            className="absolute"
            style={{
              width: containerRect?.width ?? "100%",
              height: containerRect?.height ?? "100%",
              transformOrigin: `${clampedX}px ${clampedY}px`,
              transform: `scale(${zoomFactor}) translate(${-(clampedX - halfLens / zoomFactor)}px, ${-(clampedY - halfLens / zoomFactor)}px)`,
            }}
          >
            {children}
          </div>

          {/* Subtle inner ring highlight */}
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-[#2bee4b]/20 pointer-events-none" />
        </motion.div>
      )}

      {/* Crosshair lines when hovering */}
      {isHovering && !isStatic && (
        <>
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-[#2bee4b]/10 z-10"
            style={{ left: clampedX }}
          />
          <div
            className="pointer-events-none absolute left-0 right-0 h-px bg-[#2bee4b]/10 z-10"
            style={{ top: clampedY }}
          />
        </>
      )}
    </div>
  );
}
