"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface CardItem {
  imgUrl?: string;
  alt?: string;
  linkUrl?: string;
  company?: string;
  incident?: string;
  badge?: string;
}

interface SocialCardsProps {
  cards: CardItem[];
}

const MAX_VISIBLE = 7;
const HALF = 3;

const FAN_POSITIONS = [
  { rot: -21, scale: 0.7756, x: -24, y: 5.0, zIndex: 1 },
  { rot: -14, scale: 0.8498, x: -17, y: 2.5, zIndex: 2 },
  { rot: -7,  scale: 0.9346, x: -9,  y: 0.8, zIndex: 3 },
  { rot: 0,   scale: 1.0,    x: 0,   y: 0.0, zIndex: 10 },
  { rot: 7,   scale: 0.9346, x: 9,   y: 0.8, zIndex: 3 },
  { rot: 14,  scale: 0.8498, x: 17,  y: 2.5, zIndex: 2 },
  { rot: 21,  scale: 0.7756, x: 24,  y: 5.0, zIndex: 1 },
];

function getResponsiveMultiplier(width: number) {
  if (width < 480) return 0.35;
  if (width < 640) return 0.45;
  if (width < 768) return 0.55;
  if (width < 1024) return 0.75;
  return 0.9; // Adjusted down slightly to guarantee fit on 1024px and 1200px screens!
}

function getSlotConfig(totalCards: number, slot: number) {
  if (totalCards >= MAX_VISIBLE) return FAN_POSITIONS[slot];
  const center = totalCards >> 1;
  const distance = totalCards > 1 ? (slot - center) / center : 0;
  const absDistance = Math.abs(distance);
  return {
    rot: distance * 21,
    scale: 1.0 - 0.2244 * absDistance * absDistance,
    x: distance * 24,
    y: absDistance * absDistance * 5.0,
    zIndex: 10 - Math.abs(slot - center),
  };
}

const ARROW_CLASSES =
  "relative flex items-center justify-center rounded-full border-[1.5px] border-[#30363d] hover:border-[#2bee4b]/40 bg-[#161b22] text-[#8b949e] hover:text-white cursor-pointer shrink-0 z-30 outline-none shadow-xl active:opacity-70 transition-all duration-300";

export default function SocialCards({ cards }: SocialCardsProps) {
  const [width, setWidth] = useState(1200);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  // Measure window width safely in Next.js client component
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalCards = cards.length;
  const needsPagination = totalCards > MAX_VISIBLE;
  const [centerIndex, setCenterIndex] = useState(needsPagination ? HALF : totalCards >> 1);

  const getVisibleMap = useCallback((center: number) => {
    const map = new Map<number, number>();
    if (!needsPagination) {
      cards.forEach((_, i) => map.set(i, i));
      return map;
    }
    for (let slot = 0; slot < MAX_VISIBLE; slot++) {
      map.set(((center + slot - HALF) % totalCards + totalCards) % totalCards, slot);
    }
    return map;
  }, [totalCards, needsPagination, cards]);

  const cycle = useCallback((direction: "left" | "right") => {
    setCenterIndex(prev =>
      direction === "right" ? (prev + 1) % totalCards : (prev - 1 + totalCards) % totalCards
    );
  }, [totalCards]);

  const visibleMap = useMemo(() => getVisibleMap(centerIndex), [centerIndex, getVisibleMap]);

  const multiplier = getResponsiveMultiplier(width);
  const slotCount = needsPagination ? MAX_VISIBLE : totalCards;
  const centerSlot = slotCount >> 1;

  return (
    <section className="flex flex-col items-center w-full py-4 px-4 relative z-20 overflow-visible">
      {/* Fan Layout Container */}
      <div className="relative w-full max-w-[80rem] h-[380px] sm:h-[450px] flex items-center justify-center overflow-visible">
        {cards.map((card, cardIndex) => {
          const slot = visibleMap.get(cardIndex);
          const isVisible = slot !== undefined;

          // Compute base animations
          let targetX = 0;
          let targetY = 0;
          let targetRot = 0;
          let targetScale = 0.5;
          let zIndex = 0;
          let opacity = 0;

          if (isVisible && slot !== undefined) {
            opacity = 1;
            const base = getSlotConfig(slotCount, slot);
            targetX = base.x * multiplier * 16; // Convert rem estimation to px
            targetY = base.y * 16;
            targetRot = base.rot;
            targetScale = base.scale;
            zIndex = base.zIndex;

            // Apply hover displacements reactively
            if (hoveredSlot !== null) {
              const distance = Math.abs(slot - hoveredSlot);
              if (slot === hoveredSlot) {
                targetY -= 40; // Lift up
                targetScale *= 1.08;
                zIndex = 50; // Bring to top
              } else {
                const normalized = centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
                const pushStrength = 90 * (1 - Math.abs(normalized)) * (1 + 0.25 * Math.max(0, 3 - distance));

                if (slot < hoveredSlot) {
                  targetX -= pushStrength * multiplier;
                  targetRot -= 6 / (distance + 1);
                } else {
                  targetX += pushStrength * multiplier;
                  targetRot += 6 / (distance + 1);
                }
              }
            }
          }

          const hasText = !!card.company;
          const cardInner = hasText ? (
            <div className="relative w-full h-full bg-[#161b22] border border-[#30363d] hover:border-[#2bee4b]/40 rounded-2xl p-5 md:p-6 flex flex-col justify-between text-left shadow-2xl select-none group transition-colors duration-300">
              <div className="flex flex-col gap-3">
                <h4 className="text-base md:text-lg font-bold text-white tracking-tight">{card.company}</h4>
                <p className="text-[11px] md:text-[12px] text-[#8b949e] leading-relaxed font-medium">{card.incident}</p>
              </div>
              <div className="inline-flex self-start px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-400/20 text-[10px] font-bold uppercase tracking-wider">
                {card.badge}
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full overflow-hidden rounded-2xl">
              <img src={card.imgUrl} loading="lazy" alt={card.alt || `Card ${cardIndex}`} className="absolute inset-0 w-full h-full object-cover z-10" />
            </div>
          );

          return (
            <motion.div
              key={cardIndex}
              initial={false}
              animate={{
                x: targetX,
                y: targetY,
                rotate: targetRot,
                scale: targetScale,
                zIndex,
                opacity,
              }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 22,
              }}
              onMouseEnter={() => isVisible && setHoveredSlot(slot)}
              onMouseLeave={() => setHoveredSlot(null)}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[300px] sm:w-[280px] sm:h-[350px] origin-bottom cursor-pointer"
            >
              {card.linkUrl ? (
                <a href={card.linkUrl} target={card.linkUrl.startsWith("http") ? "_blank" : "_self"} rel="noopener noreferrer" className="block w-full h-full">{cardInner}</a>
              ) : (
                cardInner
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {needsPagination && (
        <div className="flex items-center justify-center gap-4 mt-6 z-30">
          <button className={`${ARROW_CLASSES} w-10 h-10 md:w-12 md:h-12`} onClick={() => cycle("left")} aria-label="Previous">
            {chevron("left")}
          </button>
          <div className="flex items-center gap-2">
            {cards.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === centerIndex ? "bg-[#2bee4b] scale-[1.3] shadow-[0_0_8px_#2bee4b]" : "bg-white/15"}`} />
            ))}
          </div>
          <button className={`${ARROW_CLASSES} w-10 h-10 md:w-12 md:h-12`} onClick={() => cycle("right")} aria-label="Next">
            {chevron("right")}
          </button>
        </div>
      )}
    </section>
  );
}

const chevron = (direction: "left" | "right") => (
  <svg className="relative z-[2] w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
  </svg>
);
