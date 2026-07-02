"use client";

import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { motion, useAnimate, useAnimation } from "framer-motion";

// Helper for transition spring presets
const transition = { type: "spring", stiffness: 300, damping: 20 };

// 1. Stack Icon (Logo)
export const StackIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 22, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".layer-top", { y: -2, scale: 1.05 }, { duration: 0.3, ease: "easeOut" });
    animate(".layer-bottom", { y: 1, opacity: 0.7 }, { duration: 0.3, ease: "easeOut" });
  };
  const stop = () => {
    animate(".layer-top", { y: 0, scale: 1 }, { duration: 0.25, ease: "easeInOut" });
    animate(".layer-bottom", { y: 0, opacity: 1 }, { duration: 0.25, ease: "easeInOut" });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ overflow: "visible" }}
    >
      <motion.path className="layer-top" d="M12 6l-8 4l8 4l8 -4l-8 -4" />
      <motion.path className="layer-bottom" d="M4 14l8 4l8 -4" />
    </motion.svg>
  );
});
StackIcon.displayName = "StackIcon";

// 2. Layout Dashboard Icon (Overview)
export const LayoutDashboardIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".grid-1", { scale: 1.1, x: -1, y: -1 }, { duration: 0.2 });
    animate(".grid-2", { scale: 1.1, x: 1, y: -1 }, { duration: 0.2 });
    animate(".grid-3", { scale: 1.1, x: -1, y: 1 }, { duration: 0.2 });
    animate(".grid-4", { scale: 1.1, x: 1, y: 1 }, { duration: 0.2 });
  };
  const stop = () => {
    animate(".grid-1", { scale: 1, x: 0, y: 0 }, { duration: 0.2 });
    animate(".grid-2", { scale: 1, x: 0, y: 0 }, { duration: 0.2 });
    animate(".grid-3", { scale: 1, x: 0, y: 0 }, { duration: 0.2 });
    animate(".grid-4", { scale: 1, x: 0, y: 0 }, { duration: 0.2 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.rect className="grid-1" x="3" y="3" width="7" height="9" rx="1" />
      <motion.rect className="grid-2" x="14" y="3" width="7" height="5" rx="1" />
      <motion.rect className="grid-3" x="3" y="16" width="7" height="5" rx="1" />
      <motion.rect className="grid-4" x="14" y="12" width="7" height="9" rx="1" />
    </motion.svg>
  );
});
LayoutDashboardIcon.displayName = "LayoutDashboardIcon";

// 3. Gitlab Icon (Repositories)
export const GitlabIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const controls = useAnimation();
  const start = () => controls.start({ scale: 1.1, rotate: [0, -10, 10, 0], transition: { duration: 0.4 } });
  const stop = () => controls.start({ scale: 1, rotate: 0 });
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      animate={controls}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 13.29a10.08 10.08 0 0 0-.17-1.07l-1.3-4a1 1 0 0 0-.93-.7H16.4l-1.63-5a1 1 0 0 0-1.9 0l-1.63 5H6.4a1 1 0 0 0-.93.7l-1.3 4a10.08 10.08 0 0 0-.17 1.07 1 1 0 0 0 .36.83l7.9 5.92a1 1 0 0 0 1.2 0l7.9-5.92a1 1 0 0 0 .36-.83z" />
    </motion.svg>
  );
});
GitlabIcon.displayName = "GitlabIcon";

// 4. Brain Circuit Icon (Knowledge Graph)
export const BrainCircuitIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".circle-node", { scale: [1, 1.3, 1] }, { duration: 0.6, repeat: Infinity });
    animate(".connect-line", { opacity: [0.3, 1, 0.3] }, { duration: 0.8, repeat: Infinity });
  };
  const stop = () => {
    animate(".circle-node", { scale: 1 });
    animate(".connect-line", { opacity: 1 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a4 4 0 0 0-4 4v1a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V6a4 4 0 0 0-4-4z" />
      <path d="M10 10v4a2 2 0 0 1-2 2H4" />
      <path d="M14 10v4a2 2 0 0 0 2 2h4" />
      <motion.circle className="circle-node" cx="4" cy="16" r="2" />
      <motion.circle className="circle-node" cx="20" cy="16" r="2" />
      <motion.path className="connect-line" d="M12 10v4" />
      <motion.circle className="circle-node" cx="12" cy="16" r="2" />
    </motion.svg>
  );
});
BrainCircuitIcon.displayName = "BrainCircuitIcon";

// 5. Chart Line Icon (PR Insights)
export const ChartLineIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".line-path", { pathLength: [0, 1] }, { duration: 0.6, ease: "easeOut" });
  };
  const stop = () => {
    animate(".line-path", { pathLength: 1 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 3v18h18" />
      <motion.path className="line-path" d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
    </motion.svg>
  );
});
ChartLineIcon.displayName = "ChartLineIcon";

// 6. Message Circle Icon (Chat)
export const MessageCircleIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const controls = useAnimation();
  const start = () => controls.start({ y: [-2, 1, -1, 0], scale: [1, 1.05, 0.98, 1], transition: { duration: 0.35 } });
  const stop = () => controls.start({ y: 0, scale: 1 });
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      animate={controls}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </motion.svg>
  );
});
MessageCircleIcon.displayName = "MessageCircleIcon";

// 7. Gear Icon (Settings)
export const GearIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => animate(scope.current, { rotate: 90 }, { duration: 0.35, ease: "easeOut" });
  const stop = () => animate(scope.current, { rotate: 0 }, { duration: 0.25 });
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </motion.svg>
  );
});
GearIcon.displayName = "GearIcon";

// 8. Github Icon (Source identity)
export const GithubIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const controls = useAnimation();
  const start = () => controls.start({ scale: 1.1, y: -1, rotate: [0, -5, 5, 0], transition: { duration: 0.3 } });
  const stop = () => controls.start({ scale: 1, y: 0, rotate: 0 });
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      animate={controls}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </motion.svg>
  );
});
GithubIcon.displayName = "GithubIcon";

// 9. Refresh Icon (Sync actions)
export const RefreshIcon = forwardRef<any, { size?: number; className?: string; color?: string; isSpinning?: boolean }>((props, ref) => {
  const { size = 16, className = "", color = "currentColor", isSpinning = false } = props;
  const [shouldSpin, setShouldSpin] = useState(isSpinning);

  useEffect(() => {
    setShouldSpin(isSpinning);
  }, [isSpinning]);

  const start = () => setShouldSpin(true);
  const stop = () => setShouldSpin(false);
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      animate={shouldSpin ? { rotate: 360 } : { rotate: 0 }}
      transition={shouldSpin ? { repeat: Infinity, ease: "linear", duration: 1.2 } : { duration: 0.2 }}
      onHoverStart={!isSpinning ? start : undefined}
      onHoverEnd={!isSpinning ? stop : undefined}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </motion.svg>
  );
});
RefreshIcon.displayName = "RefreshIcon";

// 10. Plug Connected Icon
export const PlugConnectedIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 16, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".plug-left", { x: 2 }, { duration: 0.2 });
    animate(".plug-right", { x: -2 }, { duration: 0.2 });
  };
  const stop = () => {
    animate(".plug-left", { x: 0 });
    animate(".plug-right", { x: 0 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path className="plug-left" d="M19 5h-2.5a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5H19M22 8h-3" />
      <motion.path className="plug-right" d="M5 19h2.5a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 7.5 13H5M2 16h3" />
      <path d="M12 22v-3" />
      <path d="M12 5V2" />
    </motion.svg>
  );
});
PlugConnectedIcon.displayName = "PlugConnectedIcon";

// 11. Plug Connected X Icon
export const PlugConnectedXIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 16, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".plug-x", { rotate: 45 }, { duration: 0.2 });
  };
  const stop = () => {
    animate(".plug-x", { rotate: 0 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 5h-2.5a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5H19" />
      <path d="M5 19h2.5A1.5 1.5 0 0 0 9 17.5v-3A1.5 1.5 0 0 0 7.5 13H5" />
      <motion.path className="plug-x" d="m14 14-4-4m0 4 4-4" stroke="#F2596E" />
    </motion.svg>
  );
});
PlugConnectedXIcon.displayName = "PlugConnectedXIcon";

// 12. Satellite Dish Icon (Syncing status)
export const SatelliteDishIcon = forwardRef<any, { size?: number; className?: string; color?: string; animateAlways?: boolean }>((props, ref) => {
  const { size = 16, className = "", color = "currentColor", animateAlways = true } = props;
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (animateAlways) {
      animate(".dish-wave-1", { opacity: [0.2, 1, 0.2] }, { duration: 1.2, repeat: Infinity, delay: 0 });
      animate(".dish-wave-2", { opacity: [0.2, 1, 0.2] }, { duration: 1.2, repeat: Infinity, delay: 0.4 });
    }
  }, [animateAlways, animate]);

  const start = () => {
    if (!animateAlways) {
      animate(".dish-wave-1", { opacity: [0.2, 1, 0.2] }, { duration: 1.0, repeat: Infinity });
    }
  };
  const stop = () => {
    if (!animateAlways) {
      animate(".dish-wave-1", { opacity: 1 });
    }
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 10a10 10 0 0 1 16 0" />
      <motion.path className="dish-wave-2" d="M7 13a6 6 0 0 1 10 0" />
      <motion.path className="dish-wave-1" d="M10 16a2 2 0 0 1 4 0" />
      <circle cx="12" cy="20" r="1" />
    </motion.svg>
  );
});
SatelliteDishIcon.displayName = "SatelliteDishIcon";

// 13. Like Icon (Feedback 👍)
export const LikeIcon = forwardRef<any, { size?: number; className?: string; color?: string; onClick?: () => void }>((props, ref) => {
  const { size = 16, className = "", color = "currentColor", onClick } = props;
  const controls = useAnimation();
  const start = () => controls.start({ scale: [1, 1.35, 0.9, 1], rotate: [0, -10, 10, 0], transition: { duration: 0.45 } });
  const stop = () => controls.start({ scale: 1, rotate: 0 });
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.button
      onClick={onClick}
      animate={controls}
      onHoverStart={start}
      onHoverEnd={stop}
      type="button"
      className="inline-flex items-center justify-center p-1 hover:bg-[#1B1B1F] rounded-md transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    </motion.button>
  );
});
LikeIcon.displayName = "LikeIcon";

// 14. Trash Icon (Delete)
export const TrashIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 16, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".trash-lid", { y: -2, rotate: -5 }, { duration: 0.2 });
  };
  const stop = () => {
    animate(".trash-lid", { y: 0, rotate: 0 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path className="trash-lid" d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </motion.svg>
  );
});
TrashIcon.displayName = "TrashIcon";

// 15. Unlink Icon (Disconnect)
export const UnlinkIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 16, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".link-top", { x: -1, y: -1 }, { duration: 0.2 });
    animate(".link-bottom", { x: 1, y: 1 }, { duration: 0.2 });
  };
  const stop = () => {
    animate(".link-top", { x: 0, y: 0 });
    animate(".link-bottom", { x: 0, y: 0 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path className="link-top" d="m18.84 5.16-1.42 1.41M13.23 8.34a4 4 0 0 0-5.66 0l-4.24 4.24a4 4 0 0 0 5.66 5.66l1.41-1.41" />
      <motion.path className="link-bottom" d="m5.16 18.84 1.41-1.41M10.77 15.66a4 4 0 0 0 5.66 0l4.24-4.24a4 4 0 0 0-5.66-5.66l-1.41 1.41" />
    </motion.svg>
  );
});
UnlinkIcon.displayName = "UnlinkIcon";

// 16. Magnifier Icon (Search)
export const MagnifierIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 14, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".search-lens", { scale: 1.08 }, { duration: 0.2 });
    animate(".search-handle", { x: 1, y: 1 }, { duration: 0.2 });
  };
  const stop = () => {
    animate(".search-lens", { scale: 1 });
    animate(".search-handle", { x: 0, y: 0 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.circle className="search-lens" cx="11" cy="11" r="8" />
      <motion.path className="search-handle" d="m21 21-4.3-4.3" />
    </motion.svg>
  );
});
MagnifierIcon.displayName = "MagnifierIcon";

// 17. Eye Icon (Show Password)
export const EyeIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".eye-pupil", { scale: 1.2, y: -0.5 }, { duration: 0.2 });
  };
  const stop = () => {
    animate(".eye-pupil", { scale: 1, y: 0 }, { duration: 0.2 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <motion.circle className="eye-pupil" cx="12" cy="12" r="3" />
    </motion.svg>
  );
});
EyeIcon.displayName = "EyeIcon";

// 18. Eye Off Icon (Hide Password)
export const EyeOffIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".eye-lash", { rotate: 5, y: -0.5 }, { duration: 0.2 });
  };
  const stop = () => {
    animate(".eye-lash", { rotate: 0, y: 0 }, { duration: 0.2 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path className="eye-lash" d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" />
    </motion.svg>
  );
});
EyeOffIcon.displayName = "EyeOffIcon";

// 19. Triangle Alert Icon
export const TriangleAlertIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(scope.current, { rotate: [0, -8, 8, -6, 6, 0] }, { duration: 0.5, ease: "easeInOut" });
  };
  const stop = () => {
    animate(scope.current, { rotate: 0 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </motion.svg>
  );
});
TriangleAlertIcon.displayName = "TriangleAlertIcon";



// 21. Sparkles Icon
export const SparklesIcon = forwardRef<any, { size?: number; className?: string; color?: string }>((props, ref) => {
  const { size = 18, className = "", color = "currentColor" } = props;
  const [scope, animate] = useAnimate();
  const start = () => {
    animate(".sparkle-main", { rotate: 45, scale: 1.15 }, { duration: 0.3 });
    animate(".sparkle-sub1", { scale: 1.3, x: 2, y: -2 }, { duration: 0.3 });
    animate(".sparkle-sub2", { scale: 1.3, x: -1, y: 1 }, { duration: 0.3 });
  };
  const stop = () => {
    animate(".sparkle-main", { rotate: 0, scale: 1 });
    animate(".sparkle-sub1", { scale: 1, x: 0, y: 0 });
    animate(".sparkle-sub2", { scale: 1, x: 0, y: 0 });
  };
  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path className="sparkle-main" d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" style={{ originX: "12px", originY: "12px" }} />
      <motion.path className="sparkle-sub1" d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z" style={{ originX: "5px", originY: "6px" }} />
      <motion.path className="sparkle-sub2" d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" style={{ originX: "19px", originY: "20px" }} />
    </motion.svg>
  );
});
SparklesIcon.displayName = "SparklesIcon";
