"use client";

import React, { useState, useEffect } from "react";
import { motion, Variant } from "framer-motion";

interface TextAnimateProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fadeIn" | "blurInUp" | "slideUp" | "scaleIn";
  by?: "character" | "word";
  once?: boolean;
  delay?: number;
  duration?: number;
  staggerDuration?: number;
}

const animationVariants: Record<string, { hidden: Variant; visible: Variant }> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  blurInUp: {
    hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  slideUp: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
};

export function TextAnimate({
  children,
  className,
  animation = "fadeIn",
  by = "word",
  once = true,
  delay = 0,
  duration = 0.35,
  staggerDuration = 0.02,
}: TextAnimateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Concatenate React children into string robustly
  const text = React.Children.toArray(children)
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : ""))
    .join("")
    .replace(/\s+/g, " "); // collapse whitespace

  // Guard: If not mounted or no valid string children, render standard SSR safe content
  if (!mounted || !text) {
    return <span className={className}>{children}</span>;
  }

  const words = text.split(" ");
  const variants = animationVariants[animation] || animationVariants.fadeIn;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDuration,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: variants.hidden,
    visible: {
      ...variants.visible,
      transition: {
        duration,
        ease: [0.2, 0, 0, 1],
      },
    },
  };

  return (
    <motion.span
      className={`inline ${className || ""}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, wordIndex) => {
        const isLastWord = wordIndex === words.length - 1;

        if (by === "character") {
          const chars = word.split("");
          return (
            <span key={wordIndex} className="inline-block whitespace-nowrap">
              {chars.map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  variants={itemVariants}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
              {!isLastWord && <span className="inline-block">&nbsp;</span>}
            </span>
          );
        } else {
          // by === "word"
          return (
            <span key={wordIndex} className="inline-block whitespace-nowrap">
              <motion.span
                variants={itemVariants}
                className="inline-block"
              >
                {word}
              </motion.span>
              {!isLastWord && <span className="inline-block">&nbsp;</span>}
            </span>
          );
        }
      })}
    </motion.span>
  );
}
