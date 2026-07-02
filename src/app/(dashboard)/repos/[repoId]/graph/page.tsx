"use client";

import React, { Suspense, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Download,
  Search,
  Check,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "@/lib/store";

// ─── NODE SHAPE SVG RENDERERS ───────────────────────────────────────────────
// Each type gets a semantically distinct shape so the legend is self-evident.
// All shapes are drawn centered at (0,0) with given radius.
function renderNodeShape(
  type: string,
  r: number,
  color: string,
  isSelected: boolean,
  isHovered: boolean
) {
  const stroke = isSelected ? "#1C1B1F" : "#FFFFFF";
  const sw = isSelected ? 2.5 : 1.5;
  const shadow = isSelected
    ? `drop-shadow(0 0 10px ${color})`
    : isHovered
    ? `drop-shadow(0 0 6px ${color})`
    : "none";
  const scale = isHovered ? 1.15 : 1;

  const sharedProps = {
    fill: color,
    stroke,
    strokeWidth: sw,
    style: { filter: shadow, transform: `scale(${scale})`, transformOrigin: "center", transition: "transform 0.15s" },
  };

  switch (type) {
    case "pullRequest": {
      // Hexagon — evokes a PR badge / Jira ticket shape
      const hex = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 180) * (60 * i - 30);
        return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
      }).join(" ");
      return <polygon points={hex} {...sharedProps} />;
    }
    case "issue": {
      // Circle with inner dot — evokes a GitHub issue indicator
      return (
        <>
          <circle r={r} {...sharedProps} />
          <circle r={r * 0.35} fill="white" opacity={0.5} stroke="none" />
        </>
      );
    }
    case "commit": {
      // Triangle pointing up — evokes git commit arrow / changelog
      const h = r * 1.15;
      const pts = `0,${-h} ${r},${h * 0.6} ${-r},${h * 0.6}`;
      return <polygon points={pts} {...sharedProps} />;
    }
    case "decision": {
      // Diamond — evokes a decision node in flowcharts
      const pts = `0,${-r} ${r},0 0,${r} ${-r},0`;
      return <polygon points={pts} {...sharedProps} />;
    }
    case "contributor": {
      // Star — evokes a person / starred contributor
      const outer = r;
      const inner = r * 0.45;
      const pts = Array.from({ length: 10 }, (_, i) => {
        const angle = (Math.PI / 180) * (36 * i - 90);
        const rad = i % 2 === 0 ? outer : inner;
        return `${rad * Math.cos(angle)},${rad * Math.sin(angle)}`;
      }).join(" ");
      return <polygon points={pts} {...sharedProps} />;
    }
    case "file": {
      // Rounded square — evokes a file/document
      const s = r * 0.85;
      return <rect x={-s} y={-s} width={s * 2} height={s * 2} rx={s * 0.35} ry={s * 0.35} {...sharedProps} />;
    }
    default:
      return <circle r={r} {...sharedProps} />;
  }
}

const colorMap: Record<string, string> = {
  pullRequest: "#6E56F2", // Primary violet
  issue: "#D78B00",       // Warning amber
  commit: "#79747E",      // On-surface-variant gray
  decision: "#6E56F2",    // Success/Decision violet
  contributor: "#E3589B", // Tonal pink
  file: "#0091EA",        // Tonal blue
};

function KnowledgeGraphPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRepoStore = useDashboardStore((state) => state.selectedRepo);
  const repoId = (params?.repoId as string) || searchParams.get("repo") || (selectedRepoStore ? selectedRepoStore.replace("/", "-") : "cognee-cognee");
  
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  
  // Local states
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedLayout, setSelectedLayout] = useState("force");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Use TanStack Query to fetch Graph Data, ensuring it re-fetches when repoId or filters change
  const { data: graphQueryData, isLoading: queryIsLoading, isFetching: queryIsFetching } = useQuery({
    queryKey: ["graph-data", repoId, timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/repos/${repoId}/graph?range=${timeRange}`);
      if (!res.ok) {
        throw new Error("Failed to fetch graph data");
      }
      const data = await res.json();
      return {
        nodes: data.nodes || [],
        edges: data.edges || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Track if this is the first load to avoid showing skeleton on filter changes
  const hasLoadedOnce = useRef(false);

  const isLoading = !hasLoadedOnce.current && queryIsLoading;
  const isFetching = hasLoadedOnce.current && queryIsFetching;

  const selectedNodeId = useDashboardStore((state) => state.selectedNodeId);
  useEffect(() => {
    if (selectedNodeId && nodes.length > 0) {
      const foundNode = nodes.find((n: any) => n.id === selectedNodeId);
      if (foundNode) {
        setSelectedNode(foundNode);
      }
    }
  }, [selectedNodeId, nodes]);

  useEffect(() => {
    setFeedbackGiven(null);
  }, [selectedNode?.id]);

  const detailPanelRef = useRef<HTMLDivElement>(null);

  // Zoom/Pan States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const runSimulation = (currentNodes: any[], currentEdges: any[], layoutType: string) => {
    let nds = currentNodes.map((n, i) => ({
      ...n,
      x: n.x ?? (400 + Math.sin(i) * 200),
      y: n.y ?? (300 + Math.cos(i) * 150),
      vx: 0,
      vy: 0,
    }));

    if (layoutType === "force") {
      const k = 130; 
      const repulsion = -260; 
      const gravity = 0.035; 
      const center = { x: 450, y: 300 };

      for (let step = 0; step < 90; step++) {
        for (let i = 0; i < nds.length; i++) {
          for (let j = i + 1; j < nds.length; j++) {
            const dx = nds[i].x - nds[j].x;
            const dy = nds[i].y - nds[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 300) {
              const force = repulsion / (dist * dist);
              nds[i].vx -= (dx / dist) * force;
              nds[i].vy -= (dy / dist) * force;
              nds[j].vx += (dx / dist) * force;
              nds[j].vy += (dy / dist) * force;
            }
          }
        }

        currentEdges.forEach((edge) => {
          const source = nds.find((n) => n.id === edge.source);
          const target = nds.find((n) => n.id === edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - k) * 0.055;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        nds.forEach((node) => {
          node.vx += (center.x - node.x) * gravity;
          node.vy += (center.y - node.y) * gravity;
          node.x += node.vx;
          node.y += node.vy;
          node.vx *= 0.75;
          node.vy *= 0.75;
        });
      }
    } else if (layoutType === "dagre") {
      const typeColumns: Record<string, number> = {
        contributor: 0,
        commit: 1,
        pullRequest: 2,
        issue: 2,
        decision: 3,
        file: 3,
      };
      const columnCounts = [0, 0, 0, 0];
      nds.forEach((node) => {
        const col = typeColumns[node.type] ?? 1;
        const row = columnCounts[col]++;
        node.x = col * 220 + 120;
        node.y = row * 90 + 120;
      });
    } else if (layoutType === "radial") {
      const center = { x: 450, y: 300 };
      const radiusStep = 110;
      nds.forEach((node, index) => {
        const ring = Math.floor(index / 6) + 1;
        const ringIndex = index % 6;
        const angle = (ringIndex / 6) * 2 * Math.PI + (ring * 0.25);
        const radius = ring * radiusStep;
        node.x = center.x + radius * Math.cos(angle);
        node.y = center.y + radius * Math.sin(angle);
      });
    }

    return nds;
  };

  const animateToPositions = (targetNodes: any[]) => {
    const startPositions = nodes.map((n) => ({
      id: n.id,
      x: n.x ?? 400,
      y: n.y ?? 300,
    }));

    const duration = 500;
    const startTime = performance.now();

    const animateStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const start = startPositions.find((p) => p.id === node.id);
          const target = targetNodes.find((t) => t.id === node.id);
          if (start && target) {
            return {
              ...node,
              x: start.x + (target.x - start.x) * ease,
              y: start.y + (target.y - start.y) * ease,
            };
          }
          return node;
        })
      );

      if (progress < 1) {
        requestAnimationFrame(animateStep);
      }
    };

    requestAnimationFrame(animateStep);
  };

  const handleLayoutChange = (layout: string) => {
    setSelectedLayout(layout);
    const targetNodes = runSimulation(nodes, edges, layout);
    animateToPositions(targetNodes);
  };

  const fitView = useCallback((currentNodes: any[]) => {
    if (!containerRef.current || currentNodes.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    currentNodes.forEach((n) => {
      const cx = n.x ?? 400;
      const cy = n.y ?? 300;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
    });

    const graphW = (maxX - minX) || 100;
    const graphH = (maxY - minY) || 100;
    const graphCenterX = minX + graphW / 2;
    const graphCenterY = minY + graphH / 2;

    const scaleX = (rect.width * 0.8) / graphW;
    const scaleY = (rect.height * 0.8) / graphH;
    const newZoom = Math.min(2, Math.max(0.2, Math.min(scaleX, scaleY)));

    setZoom(newZoom);
    setPan({
      x: rect.width / 2 - graphCenterX * newZoom,
      y: rect.height / 2 - graphCenterY * newZoom,
    });
  }, []);

  const [liveUpdates, setLiveUpdates] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [traversalActive, setTraversalActive] = useState(false);
  const [activeEdgeIds, setActiveEdgeIds] = useState<string[]>([]);

  const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({
    pullRequest: true,
    issue: true,
    commit: true,
    decision: true,
    contributor: true,
    file: true,
  });

  // Zoom helpers
  const zoomIn = () => setZoom((z) => Math.min(3, z * 1.25));
  const zoomOut = () => setZoom((z) => Math.max(0.1, z / 1.25));
  const resetView = () => {
    if (nodes.length > 0) {
      fitView(nodes);
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    if (graphQueryData) {
      const laidOutNodes = runSimulation(graphQueryData.nodes, graphQueryData.edges, selectedLayout);
      setNodes(laidOutNodes);
      setEdges(graphQueryData.edges);
      
      if (!hasLoadedOnce.current) {
        setTimeout(() => fitView(laidOutNodes), 50);
        hasLoadedOnce.current = true;
      }
    }
  }, [graphQueryData, selectedLayout, fitView]);

  useEffect(() => {
    if (!liveUpdates) return;

    const eventSource = new EventSource(`/api/repos/${repoId}/graph/updates`);

    eventSource.addEventListener("new_node", (e: any) => {
      try {
        const node = JSON.parse(e.data);
        if (node && node.id) {
          setNodes((nds) => {
            if (nds.some((n) => n.id === node.id)) return nds;
            const freshNode = {
              ...node,
              x: 400 + Math.random() * 200,
              y: 300 + Math.random() * 200,
            };
            return [...nds, freshNode];
          });
        }
      } catch (err) {
        console.error("SSE parsing error", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [repoId, liveUpdates]);

  const toggleNodeType = (type: string) => {
    setVisibleTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const tracePath = useCallback((pathEdges: string[]) => {
    pathEdges.forEach((edgeId, index) => {
      setTimeout(() => {
        setActiveEdgeIds((prev) => {
          if (prev.includes(edgeId)) return prev;
          return [...prev, edgeId];
        });
      }, index * 600);

      setTimeout(() => {
        setActiveEdgeIds((prev) => prev.filter((id) => id !== edgeId));
      }, (index + 1) * 600);
    });
  }, []);

  const handleForgetNode = async () => {
    if (!selectedNode) return;
    setIsDeleting(true);
    try {
      const datasetName = `repo:${selectedNode.data.repo || "cognee/cognee"}`;
      const res = await fetch("/api/memory/forget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset: datasetName, dataId: selectedNode.id }),
      });
      if (res.ok) {
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFeedback = async (rating: "HELPFUL" | "NOT_HELPFUL") => {
    setFeedbackGiven(rating);
    try {
      await fetch(`/api/repos/${repoId}/pr-insights/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          prNumber: selectedNode.id.includes("pr") ? 1 : null,
          contextText: selectedNode.data.title + " " + selectedNode.data.description,
        }),
      });
    } catch (err) {
      console.error("Failed to submit memory feedback:", err);
    }
  };

  const simulateRecallTraversal = async () => {
    if (traversalActive) return;
    setTraversalActive(true);
    try {
      const queryText = selectedNode?.data?.title || "Prisma transitions";
      const res = await fetch(`/api/repos/${repoId}/graph/recall`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const nodeIds = data.recalledNodeIds || [];
        
        if (nodeIds.length > 0) {
          const matchedNode = nodes.find((n) => nodeIds.includes(n.id));
          if (matchedNode) {
            setSelectedNode(matchedNode);
          }

          const pathEdges: string[] = [];
          edges.forEach((edge) => {
            if (nodeIds.includes(edge.source) || nodeIds.includes(edge.target)) {
              pathEdges.push(edge.id);
            }
          });

          if (pathEdges.length > 0) {
            tracePath(pathEdges);
          }
        }
      }
    } catch (err) {
      console.error("Recall path traversal failed:", err);
    } finally {
      setTraversalActive(false);
    }
  };

  // Zoom and Pan Handlers on the outer Wrapper
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".node-element")) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    // Critical: stop Lenis (parent layout) from intercepting graph wheel events
    // Must use native listener (not React synthetic) with passive:false for preventDefault to work
    e.stopPropagation();
    e.preventDefault();

    setZoom((prevZoom) => {
      // Normalize deltaY across trackpads (deltaMode 1=lines, 0=pixels)
      const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY;
      // Gentle exponential: 0.001 per pixel
      const scaleFactor = Math.pow(0.999, delta);
      const newZoom = Math.min(4, Math.max(0.1, prevZoom * scaleFactor));

      // Zoom toward cursor (not screen center)
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setPan((prev) => ({
          x: mouseX - (mouseX - prev.x) * (newZoom / prevZoom),
          y: mouseY - (mouseY - prev.y) * (newZoom / prevZoom),
        }));
      }
      return newZoom;
    });
  }, []);

  // Attach native non-passive wheel listener so preventDefault works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Filtered dataset — type visibility is purely client-side (no API call on toggle)
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesType = visibleTypes[node.type] ?? true;
      const matchesSearch = 
        searchQuery === "" || 
        (node.data.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.data.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [nodes, searchQuery, visibleTypes]);

  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter((edge) => {
      return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
    });
  }, [edges, filteredNodes]);

  // Canvas Mouse Coordinates converter
  const getGraphCoords = (clientX: number, clientY: number) => {
    const el = canvasRef.current || containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const coords = getGraphCoords(e.clientX, e.clientY);
    const clickedNode = nodes.find((node) => {
      const degree = edges.filter(e => e.source === node.id || e.target === node.id).length;
      const radius = Math.min(16, Math.max(8, 8 + degree * 1.5));
      const dist = Math.sqrt((node.x - coords.x) ** 2 + (node.y - coords.y) ** 2);
      return dist <= radius + 6;
    });
    setSelectedNode(clickedNode || null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    const coords = getGraphCoords(e.clientX, e.clientY);
    const hovered = nodes.find((node) => {
      const degree = edges.filter(e => e.source === node.id || e.target === node.id).length;
      const radius = Math.min(16, Math.max(8, 8 + degree * 1.5));
      const dist = Math.sqrt((node.x - coords.x) ** 2 + (node.y - coords.y) ** 2);
      return dist <= radius + 6;
    });
    setHoveredNodeId(hovered ? hovered.id : null);
  };

  // HTML5 Canvas draw loop
  useEffect(() => {
    if (nodes.length < 150) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Edges
    filteredEdges.forEach((edge) => {
      const s = nodes.find(n => n.id === edge.source);
      const t = nodes.find(n => n.id === edge.target);
      if (!s || !t) return;

      const isSelected = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
      const isHovered = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
      const isHighlighted = isSelected || isHovered;
      const isActive = activeEdgeIds.includes(edge.id);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = isActive || isHighlighted ? "#6E56F2" : "#E4E1EC";
      ctx.lineWidth = isActive ? 3 : isHighlighted ? 2 : 1;
      ctx.globalAlpha = isActive ? 1.0 : isHighlighted ? 0.6 : 0.2;
      
      if (isActive) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
    });

    ctx.globalAlpha = 1.0;
    ctx.setLineDash([]);

    // 2. Draw Nodes
    filteredNodes.forEach((node) => {
      const color = colorMap[node.type] || "#6E56F2";
      const degree = edges.filter(e => e.source === node.id || e.target === node.id).length;
      const radius = Math.min(16, Math.max(8, 8 + degree * 1.5));
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNodeId === node.id;

      ctx.beginPath();
      const r = isHovered ? radius * 1.15 : radius;
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeStyle = isSelected ? "#1C1B1F" : "#FFFFFF";
      ctx.stroke();
    });

    ctx.restore();
  }, [nodes, filteredEdges, filteredNodes, pan, zoom, selectedNode, hoveredNodeId, activeEdgeIds, edges]);

  // Compute container position of tooltip
  const activeTooltipNode = hoveredNodeId ? nodes.find(n => n.id === hoveredNodeId) : selectedNode;
  const tooltipCoords = useMemo(() => {
    if (!activeTooltipNode) return null;
    return {
      x: activeTooltipNode.x * zoom + pan.x,
      y: activeTooltipNode.y * zoom + pan.y,
    };
  }, [activeTooltipNode, zoom, pan]);

  const tooltipDegree = activeTooltipNode ? edges.filter(e => e.source === activeTooltipNode.id || e.target === activeTooltipNode.id).length : 0;
  const tooltipRadius = activeTooltipNode ? Math.min(16, Math.max(8, 8 + tooltipDegree * 1.5)) : 0;

  const exportPng = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#F5F2FA";
      ctx.fillRect(0, 0, 1200, 800);
      
      ctx.save();
      // Center & scale diagram in the export canvas
      ctx.translate(200, 100);
      
      filteredEdges.forEach((edge) => {
        const s = nodes.find(n => n.id === edge.source);
        const t = nodes.find(n => n.id === edge.target);
        if (s && t) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = "#E4E1EC";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      filteredNodes.forEach((node) => {
        const color = colorMap[node.type] || "#6E56F2";
        const degree = edges.filter(e => e.source === node.id || e.target === node.id).length;
        const radius = Math.min(16, Math.max(8, 8 + degree * 1.5));
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      ctx.restore();

      const png = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = png;
      downloadLink.download = "knowledge-graph.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const useCanvasRender = nodes.length >= 150;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className={`relative flex flex-col h-[calc(100vh-56px)] bg-[#F5F2FA] overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 h-screen w-screen" : "w-full"
      }`}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F5F2FA] z-30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 max-w-4xl w-full">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="h-24 bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl animate-pulse flex flex-col justify-between p-3 shadow-m3-l1"
              >
                <div className="h-2.5 bg-[#EBE7FF] rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-[#EBE7FF] rounded w-full" />
                  <div className="h-3 bg-[#EBE7FF] rounded w-2/3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 relative z-10 w-full h-full flex">
          {/* Custom Canvas/SVG Viewport */}
          <div 
            ref={containerRef}
            className="flex-1 h-full min-w-0 relative select-none cursor-grab active:cursor-grabbing overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={useCanvasRender ? handleCanvasMouseMove : handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={useCanvasRender ? handleCanvasClick : undefined}
          >
            {/* Time-range refetch spinner — shown without hiding the canvas */}
            {isFetching && (
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-[#EBE7FF] border border-[#E4E1EC] rounded-full px-3 py-1.5 shadow-m3-l1 pointer-events-none">
                <div className="w-3 h-3 border-2 border-[#6E56F2]/30 border-t-[#6E56F2] rounded-full animate-spin" />
                <span className="text-[10px] font-semibold text-[#21005D]">Updating graph…</span>
              </div>
            )}
            {useCanvasRender ? (
              <canvas
                ref={canvasRef}
                className="w-full h-full block bg-[#F5F2FA]"
              />
            ) : (
              <svg 
                className="w-full h-full block bg-[#F5F2FA]"
              >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Draw Edges */}
                  {filteredEdges.map((edge) => {
                    const s = nodes.find(n => n.id === edge.source);
                    const t = nodes.find(n => n.id === edge.target);
                    if (!s || !t) return null;
                    
                    const isSelected = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
                    const isHovered = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
                    const isHighlighted = isSelected || isHovered;
                    const isActive = activeEdgeIds.includes(edge.id);

                    return (
                      <line
                        key={edge.id}
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={isActive || isHighlighted ? "#6E56F2" : "#E4E1EC"}
                        strokeWidth={isActive ? 3 : isHighlighted ? 2 : 1}
                        opacity={isActive ? 1.0 : isHighlighted ? 0.6 : 0.2}
                        strokeDasharray={isActive ? "5 5" : "none"}
                        className={isActive ? "edge-trail-active" : ""}
                        style={{ transition: "stroke 0.2s, stroke-width 0.2s, opacity 0.2s" }}
                      />
                    );
                  })}

                  {/* Draw Nodes — distinct semantic shapes per type */}
                  {filteredNodes.map((node) => {
                    const color = colorMap[node.type] || "#6E56F2";
                    const degree = edges.filter(e => e.source === node.id || e.target === node.id).length;
                    const radius = Math.min(16, Math.max(8, 8 + degree * 1.5));
                    const isSelected = selectedNode?.id === node.id;
                    const isHovered = hoveredNodeId === node.id;
                    // Larger hit area for easy clicking
                    const hitRadius = radius + 8;

                    return (
                      <g 
                        key={node.id} 
                        transform={`translate(${node.x}, ${node.y})`}
                        className="node-element cursor-pointer"
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(node);
                        }}
                      >
                        {/* Invisible hit target */}
                        <circle r={hitRadius} fill="transparent" stroke="none" />
                        {/* Selected glow ring */}
                        {isSelected && (
                          <circle r={radius + 5} fill="none" stroke={color} strokeWidth={2} opacity={0.3} />
                        )}
                        {/* Semantic shape */}
                        {renderNodeShape(node.type, radius, color, isSelected, isHovered)}
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}

            {/* Hover/Selection Floating Tooltip Label */}
            {activeTooltipNode && tooltipCoords && (
              <div
                className="absolute bg-[#1C1B1F] text-white text-[10px] font-semibold py-1.5 px-3 rounded-xl shadow-m3-l3 z-50 pointer-events-none flex flex-col items-center gap-0.5 animate-in fade-in zoom-in-95 duration-100"
                style={{
                  left: tooltipCoords.x,
                  top: tooltipCoords.y - tooltipRadius - 14,
                  transform: "translateX(-50%) translateY(-100%)",
                }}
              >
                <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: colorMap[activeTooltipNode.type] || "#6E56F2" }}>
                  {activeTooltipNode.type.replace(/([A-Z])/g, " $1")}
                </span>
                <span className="truncate max-w-[220px]">
                  {activeTooltipNode.data.title}
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-[#1C1B1F]" />
              </div>
            )}

            {/* Left Filter & Controls Panel */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.25, ease: [0.2, 0, 0, 1] }}
              className="absolute left-4 top-4 bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-3 w-56 shadow-m3-l1 z-20 space-y-4 text-left"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#79747E]" />
                <input 
                  type="text"
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FBFAFE] border border-[#E4E1EC] focus:border-[#6E56F2] rounded-xl text-xs text-[#1C1B1F] placeholder-[#79747E] outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#79747E] block">Node Types</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(visibleTypes).map((type) => {
                    const isVisible = visibleTypes[type];
                    return (
                      <button
                        key={type}
                        onClick={() => toggleNodeType(type)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          isVisible 
                            ? "bg-[#EBE7FF] border-[#6E56F2] text-[#21005D]" 
                            : "bg-transparent border-[#E4E1EC] text-[#79747E] opacity-50"
                        }`}
                      >
                        {type.replace(/([A-Z])/g, " $1")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#79747E] block">Time Range</span>
                <div className="flex gap-1 bg-[#FBFAFE] border border-[#E4E1EC] rounded-xl p-0.5">
                  {["7d", "30d", "90d", "all"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        timeRange === range 
                          ? "bg-[#EBE7FF] text-[#6E56F2] border border-[#E4E1EC]" 
                          : "text-[#49454F] hover:text-[#1C1B1F]"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#79747E] block">Layout Engine</span>
                <div className="flex gap-1 bg-[#FBFAFE] border border-[#E4E1EC] rounded-xl p-0.5">
                  {["force", "dagre", "radial"].map((lay) => (
                    <button
                      key={lay}
                      onClick={() => handleLayoutChange(lay)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                        selectedLayout === lay 
                          ? "bg-[#EBE7FF] text-[#6E56F2] border border-[#E4E1EC]" 
                          : "text-[#49454F] hover:text-[#1C1B1F]"
                      }`}
                    >
                      {lay}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shape + Color Legend Strip */}
              <div className="space-y-1.5 pt-1 border-t border-[#E4E1EC]">
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#79747E] block">Legend</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[9px] font-semibold text-[#49454F]">
                  {([
                    { type: "pullRequest", color: "#6E56F2", label: "PR", shape: "hex" },
                    { type: "issue", color: "#D78B00", label: "Issue", shape: "circle" },
                    { type: "commit", color: "#79747E", label: "Commit", shape: "tri" },
                    { type: "decision", color: "#6E56F2", label: "Decision", shape: "diamond" },
                    { type: "contributor", color: "#E3589B", label: "Contrib", shape: "star" },
                    { type: "file", color: "#0091EA", label: "File", shape: "square" },
                  ] as const).map(({ type, color, label, shape }) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="-7 -7 14 14">
                        {renderNodeShape(type, 5.5, color, false, false)}
                      </svg>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={simulateRecallTraversal}
                disabled={traversalActive}
                className="w-full py-1.5 rounded-full bg-[#6E56F2]/10 border border-[#6E56F2]/20 hover:border-[#6E56F2]/40 text-[#6E56F2] text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50"
              >
                {traversalActive ? "Traversing..." : "Recall Graph Path"}
              </button>
            </motion.div>

            {/* Viewport Zoom & Export Tools */}
            <div 
              className={`absolute top-4 z-20 flex gap-1 bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-1 transition-all duration-300 shadow-m3-l1 right-4 ${
                selectedNode ? "md:right-[304px]" : "md:right-4"
              }`}
            >
              <button 
                onClick={zoomIn}
                className="p-1.5 rounded-xl bg-transparent text-[#49454F] hover:bg-[#EBE7FF] hover:text-[#1C1B1F] transition-colors cursor-pointer"
              >
                <ZoomIn className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={zoomOut}
                className="p-1.5 rounded-xl bg-transparent text-[#49454F] hover:bg-[#EBE7FF] hover:text-[#1C1B1F] transition-colors cursor-pointer"
              >
                <ZoomOut className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-xl bg-transparent text-[#49454F] hover:bg-[#EBE7FF] hover:text-[#1C1B1F] transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
              </button>
              <button 
                onClick={resetView}
                className="p-1.5 rounded-xl bg-transparent text-[#49454F] hover:bg-[#EBE7FF] hover:text-[#1C1B1F] transition-colors cursor-pointer"
              >
                <RefreshCw className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={exportPng}
                className="p-1.5 rounded-xl bg-transparent text-[#49454F] hover:bg-[#EBE7FF] hover:text-[#1C1B1F] transition-colors cursor-pointer"
              >
                <Download className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Right Side Detail Panel */}
          <div className={`${
            selectedNode ? "w-full md:w-72 h-[45vh] md:h-full border-t md:border-t-0 md:border-l absolute md:relative bottom-0 right-0" : "w-0 md:w-0 border-none hidden md:hidden"
          } bg-[#F0ECF5] border-[#E4E1EC] flex flex-col justify-between shadow-2xl z-20 overflow-hidden transition-all duration-300`}>
            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col h-full justify-between"
                >
                  <div 
                    ref={detailPanelRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#79747E]">
                        {selectedNode.type.replace(/([A-Z])/g, " $1")}
                      </span>
                      <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-1 rounded-xl border border-[#E4E1EC] text-[#49454F] hover:bg-[#E4E1EC] hover:text-[#1C1B1F] transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-[#1C1B1F] leading-snug">
                        {selectedNode.data.title}
                      </h2>
                      <p className="text-[11px] text-[#49454F] mt-1">
                        {selectedNode.data.meta}
                      </p>
                    </div>

                    <div className="border-t border-[#E4E1EC] my-3" />

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#79747E] block">Description</span>
                      <p className="text-xs text-[#49454F] leading-relaxed break-words">
                        {selectedNode.data.description || "No preview available for this node."}
                      </p>
                    </div>

                    {selectedNode.type === "pullRequest" && selectedNode.data.files && (
                      <div className="space-y-1 mt-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#79747E] block">Files Affected</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedNode.data.files.map((f: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-[#EBE7FF] rounded text-[9px] font-mono text-[#21005D]">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-[#E4E1EC] my-3" />
                    
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#79747E] block">Is this memory helpful?</span>
                      {feedbackGiven ? (
                        <span className="text-xs text-[#6E56F2] font-semibold flex items-center gap-1 animate-in fade-in duration-200">
                          <Check className="h-3.5 w-3.5" /> Feedback recorded!
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleFeedback("HELPFUL")}
                            className="flex-1 py-1 rounded-xl border border-[#E4E1EC] hover:bg-[#6E56F2]/10 hover:text-[#6E56F2] text-xs font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-1 text-[#1C1B1F]"
                          >
                            👍 Yes
                          </button>
                          <button 
                            onClick={() => handleFeedback("NOT_HELPFUL")}
                            className="flex-1 py-1 rounded-xl border border-[#E4E1EC] hover:bg-[#842029]/10 hover:text-[#842029] text-xs font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-1 text-[#1C1B1F]"
                          >
                            👎 No
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#79747E]">Related nodes</span>
                      <div className="space-y-1.5">
                        {filteredEdges
                          .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                          .map((e) => {
                            const targetId = e.source === selectedNode.id ? e.target : e.source;
                            const related = nodes.find((n) => n.id === targetId);
                            if (!related) return null;
                            return (
                              <motion.button
                                key={e.id}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => {
                                  setSelectedNode(related);
                                  fitView([related]);
                                }}
                                className="w-full text-left px-3 py-2 bg-[#F5F2FA] hover:bg-[#EBE7FF] rounded-xl text-xs text-[#1C1B1F] flex items-center justify-between cursor-pointer border border-transparent hover:border-[#E4E1EC] transition-all shadow-m3-l1"
                              >
                                <span className="truncate flex-1 pr-2">{related.data.title}</span>
                                <span className="text-[8px] font-bold uppercase tracking-wider text-[#79747E] shrink-0">{e.type}</span>
                              </motion.button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-[#E4E1EC] bg-[#F5F2FA]/50 space-y-2 shrink-0">
                    <button 
                      onClick={() => router.push(`/dashboard/chat?context=${selectedNode.id}`)}
                      className="w-full py-2 rounded-full bg-transparent text-[#6E56F2] hover:underline text-sm font-extrabold text-center block cursor-pointer"
                    >
                      Chat about this
                    </button>

                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-2 rounded-full bg-transparent text-[#842029] hover:opacity-80 text-sm font-extrabold text-center block cursor-pointer"
                    >
                      Forget this node
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#79747E] space-y-3 h-full"
                >
                  <div className="p-4 rounded-full bg-[#FBFAFE]">
                    <Search className="h-8 w-8 text-[#79747E] opacity-60 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1B1F]">No node selected</h3>
                    <p className="text-xs text-[#49454F] mt-1 max-w-[200px] leading-relaxed">
                      Click a node on the graph canvas to inspect its metadata, relationships, and code insights.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1B1F]/35 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-6 max-w-sm w-full space-y-4 text-left shadow-m3-l3"
            >
              <p className="text-sm text-[#1C1B1F] font-semibold leading-relaxed">
                Remove this node from memory? This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-1.5 rounded-full border border-[#E4E1EC] text-[#49454F] hover:bg-[#E4E1EC] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForgetNode}
                  disabled={isDeleting}
                  className="px-4 py-1.5 rounded-full border border-[#842029] text-[#842029] hover:bg-[#842029]/10 text-xs font-bold cursor-pointer disabled:opacity-55"
                >
                  {isDeleting ? "Removing..." : "Remove"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function KnowledgeGraphPage() {
  return (
    <Suspense fallback={null}>
      <KnowledgeGraphPageContent />
    </Suspense>
  );
}
