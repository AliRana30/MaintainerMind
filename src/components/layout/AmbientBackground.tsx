"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { BACKGROUND_CONFIGS, BackgroundIconConfig } from "@/lib/background-constants";

// --- SVG Icons (Static, lightweight, low-opacity background glyphs) ---

const GitHubIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const GitLabIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M22 13.29a10.08 10.08 0 0 0-.17-1.07l-1.3-4a1 1 0 0 0-.93-.7H16.4l-1.63-5a1 1 0 0 0-1.9 0l-1.63 5H6.4a1 1 0 0 0-.93.7l-1.3 4a10.08 10.08 0 0 0-.17 1.07 1 1 0 0 0 .36.83l7.9 5.92a1 1 0 0 0 1.2 0l7.9-5.92a1 1 0 0 0 .36-.83z" />
  </svg>
);

const AnthropicIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M12 2L2 22h4l3-7h6l3 7h4L12 2zm-2.2 11L12 7.8l2.2 5.2h-4.4z" />
  </svg>
);

const CodeIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const TerminalIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const Stack3IconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const LayersIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 12 12 17 22 12" />
    <polyline points="2 17 12 22 22 17" />
  </svg>
);

const BrainCircuitIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M12 2a4 4 0 0 0-4 4v1a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V6a4 4 0 0 0-4-4z" />
    <path d="M10 10v4a2 2 0 0 1-2 2H4" />
    <path d="M14 10v4a2 2 0 0 0 2 2h4" />
    <circle cx="4" cy="16" r="2" />
    <circle cx="20" cy="16" r="2" />
    <path d="M12 10v4" />
    <circle cx="12" cy="16" r="2" />
  </svg>
);

const CodeXmlIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
    <line x1="14" y1="4" x2="10" y2="20" />
  </svg>
);

const ChartLineIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M3 3v18h18" />
    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
  </svg>
);

const ChartBarIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const MessageCircleIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

// Map of components
const IconComponents: Record<string, React.ComponentType> = {
  "github": GitHubIconSvg,
  "gitlab": GitLabIconSvg,
  "brand-anthropic": AnthropicIconSvg,
  "code": CodeIconSvg,
  "terminal": TerminalIconSvg,
  "stack-3": Stack3IconSvg,
  "layers": LayersIconSvg,
  "brain-circuit": BrainCircuitIconSvg,
  "code-xml": CodeXmlIconSvg,
  "chart-line": ChartLineIconSvg,
  "chart-bar": ChartBarIconSvg,
  "message-circle": MessageCircleIconSvg,
};

export default function AmbientBackground() {
  const pathname = usePathname();

  // Match the path to configuration category
  const getPageCategory = (path: string): string => {
    if (path.includes("/graph")) return "graph";
    if (path.includes("/chat")) return "chat";
    if (path.includes("/insights") || path.includes("/prs")) return "insights";
    if (path.includes("/repositories") || path.includes("/repos")) return "repositories";
    return "overview";
  };

  const category = getPageCategory(pathname);
  const config = BACKGROUND_CONFIGS[category] || BACKGROUND_CONFIGS.overview;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Sparse Glyph Layer (Very low opacity 4% monochrome text-tertiary) */}
      <div className="absolute inset-0 z-0">
        {config.icons.map((item, idx) => {
          const IconComp = IconComponents[item.icon];
          if (!IconComp) return null;

          return (
            <div
              key={`${category}-icon-${idx}`}
              className="absolute transition-all duration-700 ease-in-out"
              style={{
                top: item.top,
                bottom: item.bottom,
                left: item.left,
                right: item.right,
                width: `${item.size}px`,
                height: `${item.size}px`,
                transform: `rotate(${item.rotation}deg)`,
                color: "var(--color-text-tertiary)",
                opacity: 0.04, // 4% Opacity
              }}
            >
              <IconComp />
            </div>
          );
        })}
      </div>

      {/* 2. Hero glow source ambient radial gradient mesh (Accent violet at 2% opacity, 800px radius blob) */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full pointer-events-none transition-all duration-700 ease-in-out z-0"
        style={{
          top: config.glowBlob.top ?? "auto",
          left: config.glowBlob.left ?? "auto",
          right: config.glowBlob.right ?? "auto",
          bottom: config.glowBlob.bottom ?? "auto",
          transform: config.glowBlob.transform ?? "none",
          background: "radial-gradient(circle, rgba(18, 183, 106, 0.02) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
