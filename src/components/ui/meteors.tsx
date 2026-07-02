"use client";

import React, { useEffect, useState } from "react";

interface MeteorsProps {
  number?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minDelay?: number;
  maxDelay?: number;
  color?: string;
}

interface MeteorData {
  id: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
  length: number;
  opacity: number;
}

export function Meteors({
  number = 20,
  minSpeed = 8,
  maxSpeed = 16,
  minDelay = 0,
  maxDelay = 6,
  color = "#2bee4b",
}: MeteorsProps) {
  const [meteors, setMeteors] = useState<MeteorData[]>([]);

  useEffect(() => {
    const list = Array.from({ length: number }, (_, i) => {
      const left = Math.random() * 120 - 10; // % — can start slightly off-screen
      const top = Math.random() * 60 - 20;   // %
      const duration = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      const length = 80 + Math.random() * 120; // px tail length
      const opacity = 0.3 + Math.random() * 0.5;

      return { id: i, left, top, duration, delay, length, opacity };
    });
    setMeteors(list);
  }, [number, minSpeed, maxSpeed, minDelay, maxDelay]);

  return (
    <>
      {meteors.map((m) => (
        <span
          key={m.id}
          className="pointer-events-none absolute block animate-meteor-fall"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: `${m.length}px`,
            height: "1px",
            background: `linear-gradient(to right, transparent, ${color})`,
            opacity: m.opacity,
            transform: `rotate(-45deg)`,
            transformOrigin: "right center",
            animation: `meteor-fall ${m.duration}s linear ${m.delay}s infinite`,
            borderRadius: "9999px",
            filter: `drop-shadow(0 0 4px ${color}80)`,
          }}
        />
      ))}

      {/* Inject keyframes once */}
      <style>{`
        @keyframes meteor-fall {
          0% {
            transform: rotate(-45deg) translateX(0) translateY(0);
            opacity: var(--m-opacity, 0.6);
          }
          10% {
            opacity: var(--m-opacity, 0.6);
          }
          70% {
            opacity: 0;
          }
          100% {
            transform: rotate(-45deg) translateX(600px) translateY(600px);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
