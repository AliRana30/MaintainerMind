"use client";

import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";

const colorMap: Record<string, string> = {
  pullRequest: "#6E56F2", // Brand violet
  issue: "#D78B00",       // Warning amber
  commit: "#79747E",      // On-surface-variant gray
  decision: "#6E56F2",    // Success violet
  contributor: "#E3589B", // Tonal pink
  file: "#0091EA",        // Tonal blue
};

const labelMap: Record<string, string> = {
  pullRequest: "Pull Request",
  issue: "Issue",
  commit: "Commit",
  decision: "Decision",
  contributor: "Contributor",
  file: "File",
};

export function GraphCircleNode({ data, selected, type }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const color = colorMap[type] || "#6E56F2";
  const label = labelMap[type] || type;

  // Calculate size based on degree (number of connections)
  const degree = data.degree || 0;
  const radius = Math.min(16, Math.max(8, 8 + degree * 1.5));
  const size = radius * 2;

  const showLabel = isHovered || selected;

  return (
    <div
      className="relative flex items-center justify-center transition-all duration-200"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible Handles at Center for direct edge connections */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Glowing Circle Node */}
      <div
        className="rounded-full transition-all duration-200 cursor-pointer"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          border: selected ? "2.5px solid #1C1B1F" : "1.5px solid #FFFFFF",
          boxShadow: selected
            ? `0 0 14px ${color}, 0 4px 6px rgba(0,0,0,0.15)`
            : isHovered
            ? `0 0 10px ${color}`
            : "0 2px 4px rgba(0,0,0,0.05)",
          transform: isHovered ? "scale(1.15)" : "scale(1)",
        }}
      />

      {/* Tooltip Label (Visible on Hover or Selection) */}
      {showLabel && (
        <div
          className="absolute bottom-full mb-2 bg-[#1C1B1F] text-white text-[10px] font-semibold py-1.5 px-3 rounded-xl whitespace-nowrap shadow-m3-l3 z-50 pointer-events-none flex flex-col items-center gap-0.5 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color }}>
            {label}
          </span>
          <span className="truncate max-w-[220px]">
            {data.title}
          </span>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-[#1C1B1F]" />
        </div>
      )}
    </div>
  );
}

export const nodeTypes = {
  pullRequest: (props: any) => <GraphCircleNode {...props} type="pullRequest" />,
  issue: (props: any) => <GraphCircleNode {...props} type="issue" />,
  commit: (props: any) => <GraphCircleNode {...props} type="commit" />,
  decision: (props: any) => <GraphCircleNode {...props} type="decision" />,
  contributor: (props: any) => <GraphCircleNode {...props} type="contributor" />,
  file: (props: any) => <GraphCircleNode {...props} type="file" />,
};
