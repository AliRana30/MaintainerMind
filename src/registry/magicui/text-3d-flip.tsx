"use client";

import React from "react";
import { motion, HTMLMotionProps, Transition } from "framer-motion";

interface Text3DFlipProps extends Omit<HTMLMotionProps<"div">, "children" | "transition"> {
  children: string;
  className?: string;
  textClassName?: string;
  flipTextClassName?: string;
  rotateDirection?: "top" | "bottom" | "left" | "right";
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center";
  transition?: Transition;
}

export default function Text3DFlip({
  children,
  className,
  textClassName,
  flipTextClassName,
  rotateDirection = "top",
  staggerDuration = 0.03,
  staggerFrom = "first",
  transition = { type: "spring", damping: 25, stiffness: 160 },
  ...props
}: Text3DFlipProps) {
  const letters = children.split("");

  // Set rotation angles and axes based on rotateDirection
  const getRotationStyles = (isFlipped: boolean) => {
    switch (rotateDirection) {
      case "top":
        return {
          rotateX: isFlipped ? 90 : 0,
          y: isFlipped ? "-50%" : "0%",
        };
      case "bottom":
        return {
          rotateX: isFlipped ? -90 : 0,
          y: isFlipped ? "50%" : "0%",
        };
      case "left":
        return {
          rotateY: isFlipped ? -90 : 0,
          x: isFlipped ? "-50%" : "0%",
        };
      case "right":
        return {
          rotateY: isFlipped ? 90 : 0,
          x: isFlipped ? "50%" : "0%",
        };
      default:
        return { rotateX: 0, y: 0 };
    }
  };

  const getTargetRotation = () => {
    switch (rotateDirection) {
      case "top":
        return { rotateX: -90 };
      case "bottom":
        return { rotateX: 90 };
      case "left":
        return { rotateY: 90 };
      case "right":
        return { rotateY: -90 };
      default:
        return { rotateX: 0 };
    }
  };

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDuration,
        staggerDirection: staggerFrom === "last" ? -1 : 1,
      },
    },
  };

  const letterVariants = {
    initial: { rotateX: 0, rotateY: 0 },
    animate: {
      ...getTargetRotation(),
      transition: {
        ...transition,
      },
    },
  };

  return (
    <motion.div
      className={`relative flex flex-wrap justify-center items-center overflow-hidden py-2 select-none ${className || ""}`}
      variants={containerVariants}
      initial="initial"
      whileHover="animate"
      animate="initial"
      {...props}
    >
      {letters.map((char, index) => {
        if (char === " ") {
          return <span key={index} className="inline-block">&nbsp;</span>;
        }

        // Set face rotation styles
        const face1Rotate = rotateDirection === "top" || rotateDirection === "bottom" ? { rotateX: 0 } : { rotateY: 0 };
        
        let face2Rotate = {};
        if (rotateDirection === "top") face2Rotate = { rotateX: 90, originY: 0, originZ: -20 };
        else if (rotateDirection === "bottom") face2Rotate = { rotateX: -90, originY: 1, originZ: -20 };
        else if (rotateDirection === "left") face2Rotate = { rotateY: 90, originX: 0, originZ: -20 };
        else if (rotateDirection === "right") face2Rotate = { rotateY: -90, originX: 1, originZ: -20 };

        return (
          <span
            key={index}
            className="relative inline-block h-full cursor-pointer"
            style={{ perspective: "1000px" }}
          >
            <motion.span
              variants={letterVariants}
              className="relative block preserve-3d w-full h-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front Face */}
              <span
                className={`block backface-hidden ${textClassName || ""}`}
                style={{ backfaceVisibility: "hidden" }}
              >
                {char}
              </span>

              {/* Flipped Face */}
              <span
                className={`absolute inset-0 block backface-hidden ${flipTextClassName || ""}`}
                style={{
                  backfaceVisibility: "hidden",
                  ...face2Rotate,
                }}
              >
                {char}
              </span>
            </motion.span>
          </span>
        );
      })}
    </motion.div>
  );
}
