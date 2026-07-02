"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Lenis from "lenis";
import { 
  Network, 
  Target, 
  RefreshCw, 
  Trash2, 
  ArrowDown, 
  Sparkles, 
  AlertCircle,
  X,
  ArrowUp
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  Label, 
  ResponsiveContainer 
} from "recharts";

// Motion Easing / Springs
const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.2, 0, 0, 1] },
  },
};

interface CountUpCardProps {
  value: number;
  label: string;
  trend: string;
  icon: React.ComponentType<any>;
  suffix?: string;
  delayMs?: number;
}

function CountUpCard({ value, label, trend, icon: Icon, suffix = "", delayMs = 0 }: CountUpCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = value;
      const duration = 1200;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(start + (end - start) * ease));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  const isUp = trend.startsWith("↑");
  const arrowColor = isUp ? "text-[#0F5132]" : "text-[#79747E]";
  const formattedTrend = trend.replace(/[↑↓]/, "");

  return (
    <div className="bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-4 flex flex-col justify-between min-h-[120px] shadow-m3-l1">
      <div>
        <Icon className="h-4 w-4 text-[#49454F] mb-2" />
        <div className="text-2xl font-medium text-[#1C1B1F] tabular-nums">
          {displayValue}{suffix}
        </div>
        <div className="text-xs text-[#49454F] mt-1">{label}</div>
      </div>
      <div className="text-xs text-[#79747E] mt-2">
        <span className={`${arrowColor} font-bold mr-1`}>{isUp ? "↑" : "↓"}</span>
        <span>{formattedTrend}</span>
      </div>
    </div>
  );
}

function TimelineRow({ item }: { item: any }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: "-20px" });

  const getIcon = (type: string) => {
    if (type === "remember") return <ArrowDown className="h-3.5 w-3.5" />;
    if (type === "improve") return <Sparkles className="h-3.5 w-3.5" />;
    return <Trash2 className="h-3.5 w-3.5" />;
  };

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, x: -8 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className="flex items-start gap-3 py-3 border-b border-[#E4E1EC] last:border-0"
    >
      <div className="text-[#49454F] shrink-0 mt-0.5">
        {getIcon(item.type)}
      </div>
      <div className="flex-1">
        <div className="text-sm text-[#1C1B1F]">{item.action}</div>
        <div className="text-xs text-[#49454F] mt-0.5">{item.detail}</div>
      </div>
      <div className="text-xs text-[#79747E] shrink-0 font-mono">{item.time}</div>
    </motion.div>
  );
}

export default function MemoryEvolutionPage() {
  const params = useParams();
  const router = useRouter();
  const repoId = (params?.repoId as string) || "";

  const containerRef = useRef<HTMLDivElement>(null);
  const listWrapperRef = useRef<HTMLDivElement>(null);
  const listContentRef = useRef<HTMLDivElement>(null);

  const [qualityScore, setQualityScore] = useState(0);
  const [pruneModalOpen, setPruneModalOpen] = useState(false);
  const [pruneOption, setPruneOption] = useState<"memory_only" | "delete_everything">("memory_only");
  const [pruneLoading, setPruneLoading] = useState(false);
  const [improveLoading, setImproveLoading] = useState(false);

  // Fetch memory stats
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["memory-stats", repoId],
    queryFn: async () => {
      const res = await fetch(`/api/repos/${repoId}/memory/stats`);
      if (!res.ok) throw new Error("Failed to fetch memory stats");
      return res.json();
    },
    enabled: !!repoId,
  });

  // Global scroll & Timeline nested scroll (Lenis removed for native scroll functionality)
  // Native CSS overflow-y-auto will handle scrolling natively.

  // Quality score count-up
  useEffect(() => {
    if (data?.score) {
      let start = 0;
      const end = data.score;
      const duration = 1200;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutCubic
        const ease = 1 - Math.pow(1 - progress, 3);
        setQualityScore(Math.round(start + (end - start) * ease));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [data?.score]);

  const handleImproveMemory = async () => {
    setImproveLoading(true);
    try {
      const res = await fetch(`/api/repos/${repoId}/memory/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetName: repoId }),
      });
      if (res.status === 429) {
        alert("Memory evolution is already running or ran recently.");
      } else {
        await refetch();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImproveLoading(false);
    }
  };

  const handlePruneConfirm = async () => {
    setPruneLoading(true);
    try {
      await fetch(`/api/repos/${repoId}/memory/forget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetName: repoId,
          memoryOnly: pruneOption === "memory_only",
        }),
      });
      setPruneModalOpen(false);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setPruneLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-[#6E56F2] animate-spin" />
        <span className="text-sm text-[#49454F]">Retrieving cognitive metrics...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div 
      ref={containerRef}
      className="max-w-5xl mx-auto px-6 py-6 overflow-y-auto h-[calc(100vh-64px)] scrollbar-none"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        
        {/* ─── MEMORY HEALTH HERO ─── */}
        <motion.div 
          variants={itemVariants}
          className="bg-[#F0ECF5] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-8 shadow-m3-l1"
        >
          {/* Left Hero Details */}
          <div className="flex-1 space-y-1 text-left">
            <span className="text-sm text-[#49454F] mb-1 block">Memory quality</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-6xl font-medium text-[#1C1B1F] tabular-nums">
                {qualityScore}
              </span>
              <span className="text-2xl text-[#49454F] font-normal">/100</span>
            </div>
            
            <div className="text-sm text-[#49454F] mt-2 flex items-center gap-1">
              <span>Memory score is</span>
              <span className="text-[#6E56F2] font-bold">{data.delta?.startsWith("+") ? "↑" : "↓"}</span>
              <span>{data.delta?.replace("+", "")} this week</span>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-1">
              <span className="w-2 h-2 rounded-full bg-[#6E56F2] animate-pulse" style={{ animationDuration: "2s" }} />
              <span className="text-xs text-[#49454F]">Actively learning</span>
            </div>
          </div>

          {/* Right Sparkline Chart */}
          <div className="w-[240px] h-[80px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.qualityHistory} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6E56F2" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ─── 4 METRIC CARDS ─── */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-left"
        >
          <CountUpCard value={data.nodeCount} label="Total Nodes" trend={`↑ ${Math.max(1, Math.floor(data.nodeCount * 0.05))} nodes`} icon={Network} delayMs={100} />
          <CountUpCard value={data.recallAccuracy} label="Recall Accuracy" trend="↑ 1.2%" icon={Target} suffix="%" delayMs={200} />
          <CountUpCard value={data.improveCalls} label="improve() Calls" trend={data.improveCallsThisWeek > 0 ? `↑ ${data.improveCallsThisWeek} this week` : "0 this week"} icon={RefreshCw} delayMs={300} />
          
          <div className="bg-[#F0ECF5] rounded-2xl p-4 flex flex-col justify-between min-h-[120px] shadow-m3-l1">
            <div>
              <Trash2 className="h-4 w-4 text-[#49454F] mb-2" />
              <div className="text-sm font-medium text-[#1C1B1F] truncate mt-1">
                {data.lastForget}
              </div>
              <div className="text-xs text-[#49454F] mt-1">Last forget()</div>
            </div>
            <div className="text-xs text-[#79747E] mt-2">
              <span className="text-[#79747E] font-bold mr-1">↓</span>
              <span>Pruned unused nodes</span>
            </div>
          </div>
        </motion.div>

        {/* ─── RECALL ACCURACY CHART ─── */}
        <motion.div variants={itemVariants} className="bg-[#F0ECF5] rounded-2xl p-5 shadow-m3-l1 text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[#49454F]">Recall accuracy</span>
            
            {/* Custom Legend */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6E56F2]" />
                <span className="text-xs text-[#49454F]">Helpful</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E4E1EC]" />
                <span className="text-xs text-[#79747E]">Not helpful</span>
              </div>
            </div>
          </div>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.accuracyHistory} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E1EC" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#79747E", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#79747E", fontSize: 11 }} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#F0ECF5", borderColor: "#E4E1EC", borderRadius: 12 }}
                  labelStyle={{ color: "#49454F", fontSize: 11 }}
                  itemStyle={{ color: "#1C1B1F", fontSize: 11 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="helpful" 
                  stroke="#6E56F2" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={800}
                />
                <Line 
                  type="monotone" 
                  dataKey="notHelpful" 
                  stroke="#79747E" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 2"
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ─── MEMORY GROWTH CHART ─── */}
        <motion.div variants={itemVariants} className="bg-[#F0ECF5] rounded-2xl p-5 shadow-m3-l1 text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[#49454F]">Memory growth</span>
          </div>

          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growthHistory} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6E56F2" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6E56F2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E1EC" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#79747E", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#79747E", fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#F0ECF5", borderColor: "#E4E1EC", borderRadius: 12 }}
                  labelStyle={{ color: "#49454F", fontSize: 11 }}
                  itemStyle={{ color: "#1C1B1F", fontSize: 11 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="nodes" 
                  stroke="#6E56F2" 
                  strokeWidth={2} 
                  fill="url(#violetGradient)"
                  isAnimationActive={true}
                  animationDuration={800}
                />
                {data.forgetEventDate && (
                  <ReferenceLine 
                    x={data.forgetEventDate} 
                    stroke="#E4E1EC" 
                    strokeDasharray="4 2"
                  >
                    <Label 
                      value="Pruned" 
                      fill="#79747E" 
                      fontSize={10} 
                      position="insideTopRight" 
                      offset={10}
                    />
                  </ReferenceLine>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ─── IMPROVE TIMELINE & FORGET PANEL GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          
          {/* Improve Timeline */}
          <motion.div variants={itemVariants} className="bg-[#F0ECF5] rounded-2xl p-5 flex flex-col h-[350px] shadow-m3-l1">
            <span className="text-sm font-medium text-[#49454F] mb-3 block">Memory activity</span>
            
            <div 
              ref={listWrapperRef}
              className="flex-1 overflow-y-auto pr-1 scrollbar-none max-h-72"
            >
              <div ref={listContentRef} className="space-y-1">
                {data.timelineEvents.map((item: any) => (
                  <TimelineRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Forget History Panel */}
          <motion.div variants={itemVariants} className="bg-[#F0ECF5] rounded-2xl p-5 flex flex-col justify-between h-[350px] shadow-m3-l1">
            <div className="space-y-3">
              <span className="text-sm font-medium text-[#49454F] block">Forget history</span>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[#79747E] uppercase tracking-wide border-b border-[#E4E1EC] pb-2">
                      <th className="font-semibold pb-2">Date</th>
                      <th className="font-semibold pb-2">Scope</th>
                      <th className="font-semibold pb-2 text-right">Pruned</th>
                      <th className="font-semibold pb-2 text-right">Before</th>
                      <th className="font-semibold pb-2 text-right">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.forgetHistory.map((row: any) => (
                      <tr key={row.id} className="text-[#49454F] border-b border-[#E4E1EC] py-2.5">
                        <td className="py-2.5 font-mono">{row.date}</td>
                        <td className="py-2.5 max-w-[120px] truncate">{row.scope}</td>
                        <td className="py-2.5 text-right font-mono text-[#1C1B1F]">{row.nodesPruned}</td>
                        <td className="py-2.5 text-right font-mono text-[#1C1B1F]">{row.before}</td>
                        <td className="py-2.5 text-right font-mono text-[#1C1B1F]">{row.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E4E1EC]">
              <button
                onClick={handleImproveMemory}
                disabled={improveLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E4E1EC] bg-[#F5F2FA]/30 text-xs font-semibold text-[#1C1B1F] hover:border-[#6E56F2] hover:bg-[#EBE7FF] transition-all cursor-pointer shadow-m3-l1"
              >
                <RefreshCw className={`h-3 w-3 ${improveLoading ? "animate-spin text-[#6E56F2]" : ""}`} />
                <span>Evolve Memory</span>
              </button>

              <motion.button
                onClick={() => setPruneModalOpen(true)}
                whileTap={{ scale: 0.97 }}
                className="bg-[#F5F2FA]/30 border border-[#E4E1EC] text-xs text-[#49454F] hover:border-[#842029] hover:text-[#842029] rounded-full px-4 py-2 transition-all cursor-pointer font-semibold shadow-m3-l1"
              >
                Prune Memory
              </motion.button>
            </div>
          </motion.div>
        </div>

      </motion.div>

      {/* ─── MODAL DIALOG ─── */}
      <AnimatePresence>
        {pruneModalOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setPruneModalOpen(false)}
              className="fixed inset-0 bg-[#1C1B1F]/35 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-5 w-96 max-w-full shadow-m3-l3 relative text-left"
              >
                <button 
                  onClick={() => setPruneModalOpen(false)}
                  className="absolute top-4 right-4 text-[#49454F] hover:text-[#1C1B1F] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <h3 className="text-base font-semibold text-[#1C1B1F]">
                  Prune repository memory
                </h3>
                <p className="text-xs text-[#49454F] mt-2 leading-relaxed">
                  Pruning optimizes memory storage, relationship weighting, and query response latency.
                </p>

                {/* Option Toggle */}
                <div className="bg-[#F5F2FA] rounded-full p-1 flex gap-1 mt-4 relative">
                  <button
                    onClick={() => setPruneOption("memory_only")}
                    className="flex-1 py-1.5 text-center text-xs font-semibold rounded-full relative z-10 transition-colors cursor-pointer"
                  >
                    <span className={pruneOption === "memory_only" ? "text-[#1C1B1F]" : "text-[#79747E]"}>
                      Clear memory only
                    </span>
                  </button>

                  <button
                    onClick={() => setPruneOption("delete_everything")}
                    className="flex-1 py-1.5 text-center text-xs font-semibold rounded-full relative z-10 transition-colors cursor-pointer"
                  >
                    <span className={pruneOption === "delete_everything" ? "text-[#1C1B1F]" : "text-[#79747E]"}>
                      Delete everything
                    </span>
                  </button>

                  {/* Active Slide indicator */}
                  <motion.div
                    layoutId="activePruneIndicator"
                    className="absolute top-1 bottom-1 bg-[#FBFAFE] rounded-full"
                    style={{
                      left: pruneOption === "memory_only" ? "4px" : "calc(50% + 2px)",
                      right: pruneOption === "memory_only" ? "calc(50% + 2px)" : "4px",
                    }}
                    transition={SPRING_SOFT}
                  />
                </div>

                {/* Warnings banner */}
                <AnimatePresence mode="wait">
                  {pruneOption === "delete_everything" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[11px] text-[#842029] mt-3 font-semibold">
                        This permanently removes all ingested data and cannot be undone.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons Action bar */}
                <div className="flex gap-2 justify-end mt-5">
                  <button
                    onClick={() => setPruneModalOpen(false)}
                    className="border border-[#E4E1EC] text-[#49454F] rounded-full px-4 py-2 text-xs font-semibold hover:bg-[#F0ECF5] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <motion.button
                    onClick={handlePruneConfirm}
                    disabled={pruneLoading}
                    whileTap={{ scale: 0.97 }}
                    className="bg-gradient-to-b from-[#ff8b97] to-[#842029] text-white rounded-full px-4 py-2 text-xs font-semibold hover:opacity-95 transition-colors duration-150 cursor-pointer disabled:opacity-50 shadow-m3-l1"
                  >
                    {pruneLoading ? "Pruning..." : "Confirm"}
                  </motion.button>
                </div>

              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
