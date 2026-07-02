"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ExternalLink, ArrowRight } from "lucide-react";
import { BorderBeam } from "@/registry/magicui/border-beam";
import { RefreshIcon, SatelliteDishIcon } from "@/components/icons/itshover-icons";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const MiniStatusIndicator = ({ status }: { status: string }) => {
  if (status === "SYNCING") {
    return <SatelliteDishIcon size={14} color="#664D03" />;
  }
  return <span className={`h-1.5 w-1.5 rounded-full shrink-0 mt-1.5 ${status === "SYNCED" ? "bg-[#0F5132]" : "bg-[#842029]"}`} />;
};



// --- 2. ACTIVE REPOSITORIES: TALL NARROW CARD + Edge-to-Edge Sparkline ---

function RepoMiniCard({ repo }: { repo: any }) {
  const [isHovered, setIsHovered] = useState(false);

  const ProviderIcon = () => {
    const isGitLab = repo.name.toLowerCase().includes("gitlab") || repo.provider === "gitlab";
    if (isGitLab) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-[#E24329]">
          <path d="M22 13.29a10.08 10.08 0 0 0-.17-1.07l-1.3-4a1 1 0 0 0-.93-.7H16.4l-1.63-5a1 1 0 0 0-1.9 0l-1.63 5H6.4a1 1 0 0 0-.93.7l-1.3 4a10.08 10.08 0 0 0-.17 1.07 1 1 0 0 0 .36.83l7.9 5.92a1 1 0 0 0 1.2 0l7.9-5.92a1 1 0 0 0 .36-.83z" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-[#49454F]">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    );
  };

  const CardSparkline = ({ trend }: { trend: number[] }) => {
    if (!trend || trend.length === 0) return null;
    const min = Math.min(...trend);
    const max = Math.max(...trend);
    const range = max - min || 1;
    const width = 140;
    const height = 66; // Fills the bottom third
    const points = trend
      .map((val, idx) => {
        const x = (idx / (trend.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");
    const fillPoints = `0,${height} ${points} ${width},${height}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute bottom-0 left-0 right-0 w-full h-[66px] overflow-visible pointer-events-none" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`spark-grad-${repo.id || repo.name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6E56F2" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6E56F2" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={fillPoints} fill={`url(#spark-grad-${repo.id || repo.name})`} />
        <polyline
          fill="none"
          stroke="#6E56F2"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      animate={{
        boxShadow: isHovered 
          ? "inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 8px rgba(33,0,93,0.10), 0 2px 4px rgba(33,0,93,0.08)"
          : "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 3px rgba(33,0,93,0.08), 0 1px 2px rgba(33,0,93,0.06)"
      }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => window.location.href = `/repos/${repo.id || repo.name.replace("/", "-")}/memory`}
      className="relative w-[140px] h-[200px] shrink-0 snap-start bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl flex flex-col justify-between p-3.5 overflow-hidden group cursor-pointer transition-colors"
    >
      <div className="flex justify-between items-start w-full z-10">
        <ProviderIcon />
        <MiniStatusIndicator status={repo.status} />
      </div>

      <div className="flex flex-col gap-0.5 z-10 mt-2 mb-auto text-left">
        <span className="font-semibold text-[13px] text-[#1C1B1F] truncate max-w-full leading-tight" title={repo.name}>
          {repo.name.split("/").pop()}
        </span>
        <span className="text-[10px] text-[#79747E] truncate leading-none">
          {repo.name.split("/")[0]}
        </span>
        <div className="text-[10px] text-[#49454F] font-mono mt-1.5">
          {repo.openPRs} PRs · {repo.commits} commits
        </div>
      </div>

      <CardSparkline trend={repo.trend || [5, 8, 12, 10, 15, 20]} />
    </motion.div>
  );
}

// --- 4. PRS NEEDING CONTEXT: RADIAL STAT CHART ---

const RadialStatChart = ({ value }: { value: number }) => {
  const percentage = 68; // Risk offset or context coverage percentage
  const chartData = [
    {
      name: "Risk Score",
      value: percentage,
      fill: "#6E56F2",
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
      <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            barSize={6}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              background={{ fill: "#E4E1EC" }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold text-[#1C1B1F] leading-none tabular-nums">
            {value}
          </span>
          <span className="text-[9px] text-[#49454F] uppercase font-semibold mt-0.5 tracking-wider">
            Awaiting
          </span>
        </div>
      </div>

      <div className="space-y-1 min-w-0 flex-1 text-left">
        <div className="text-[13px] font-semibold text-[#1C1B1F]">Asymmetric Focus</div>
        <p className="text-[12px] text-[#49454F] leading-normal font-normal">
          Merge risk spikes by {percentage}% when pull requests lack historical repository context.
        </p>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return res.json();
    },
    refetchInterval: 15000,
  });

  const [retryingIds, setRetryingIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const handleRetry = async (id: string, repoName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryingIds((prev) => [...prev, id]);
    try {
      // Extract repoId from the attention item id (format: "repo-fail-<repoId>")
      const repoId = id.replace("repo-fail-", "");
      await fetch(`/api/repos/${repoId}/retry-sync`, { method: "POST" });
      await refetch();
    } catch (err) {
      console.error("Retry sync failed", err);
    } finally {
      setRetryingIds((prev) => prev.filter((item) => item !== id));
      setCompletedIds((prev) => [...prev, id]);
    }
  };



  const attentionItems = (data?.attentionItems || [])
    .filter((item: any) => item.severity.toLowerCase() === "critical" || item.severity.toLowerCase() === "review")
    .slice(0, 3);

  const repositoryActivity = (data?.repositoryActivity || []).slice(0, 4);
  const recentKnowledge = (data?.recentKnowledge || []).slice(0, 5);
  const prIntelligence = data?.prIntelligence || [];

  const totalCommits = repositoryActivity.reduce((sum: number, repo: any) => sum + (repo.commits || 0), 0);

  const getCategoryColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("security")) return "#842029";
    if (t.includes("architecture") || t.includes("refactor")) return "#6E56F2";
    if (t.includes("performance") || t.includes("database")) return "#0F5132";
    return "#664D03";
  };

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-[#6E56F2]/30 border-t-[#6E56F2] rounded-full animate-spin" />
        <span className="text-xs text-[#49454F] font-semibold">Loading your workspace memory dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto py-2">
      {/* ─── HEADER ROW ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h1 className="text-[20px] font-semibold text-[#1C1B1F] leading-none">
            Good evening, {data?.user?.name || "Ali"}
          </h1>
          <p className="text-[13px] text-[#49454F]">
            {repositoryActivity.length} repositories synced &bull; {totalCommits} knowledge commits ingested
          </p>
        </div>

        <button 
          onClick={() => window.location.href = "/api/github/install"}
          className="bg-gradient-to-b from-[#8C76FF] to-[#6E56F2] hover:opacity-95 text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-colors duration-150 ease-out cursor-pointer self-start sm:self-auto shadow-m3-l1"
        >
          Connect Repository
        </button>
      </div>

      {repositoryActivity.length === 0 ? (
        /* Empty state when no repositories are connected */
        <div className="w-full border border-dashed border-[#E4E1EC] rounded-2xl p-12 flex flex-col items-center text-center space-y-5 bg-[#F5F2FA]/20 relative overflow-hidden">
          <div className="w-12 h-12 rounded-full bg-[#F0ECF5] border border-[#E4E1EC] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6E56F2" strokeWidth="1.5" className="w-6 h-6">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-[16px] font-semibold text-[#1C1B1F]">Connect your first repository</h3>
            <p className="text-[13px] text-[#49454F] leading-relaxed">
              Integrate long-term cognitive memory directly into your repository. We will automatically ingest commits and PR histories to feed your knowledge graphs.
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/api/github/install"}
            className="bg-gradient-to-b from-[#8C76FF] to-[#6E56F2] hover:opacity-95 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-m3-l1"
          >
            Connect Repository
          </button>
        </div>
      ) : (
        /* ─── ASYMMETRIC DASHBOARD LAYOUT ─── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          
          {/* 1. NEEDS ATTENTION — Borderless vertical timeline (No Card background) */}
          <div className="lg:col-span-7 relative flex flex-col justify-start min-h-[300px] text-left">
            <div className="space-y-4 w-full">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#49454F] uppercase tracking-[0.04em]">Needs Attention</span>
                {attentionItems.length > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#842029] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#842029]"></span>
                  </span>
                )}
              </div>

              {/* Timeline container */}
              <div className="relative pl-6 mt-2 space-y-6">
                {/* Thin vertical timeline accent-gradient line */}
                <div className="absolute left-[7px] top-1.5 bottom-1.5 w-[2px] bg-gradient-to-b from-[#6E56F2] via-[#842029] to-[#664D03]" />

                {attentionItems.length > 0 ? (
                  attentionItems.map((item: any) => {
                    const isCritical = item.severity.toLowerCase() === "critical";
                    const isRetrying = retryingIds.includes(item.id);
                    const isCompleted = completedIds.includes(item.id);

                    return (
                      <div 
                        key={item.id}
                        className={`relative flex items-center justify-between gap-4 transition-all duration-300 ${
                          isCompleted ? "opacity-30 translate-x-2" : ""
                        }`}
                      >
                        {/* Node Dot branching off the timeline */}
                        <div 
                          className={`absolute left-[-23px] top-[14px] w-2.5 h-2.5 rounded-full ring-4 ring-[#FBFAFE] z-10 ${
                            isCritical ? "bg-[#842029]" : "bg-[#664D03]"
                          }`}
                        />

                        <div className="min-w-0 flex-1 pl-1">
                          <div className="text-[10px] font-medium text-[#49454F] uppercase leading-none">{item.repo}</div>
                          <div 
                            className="text-[13px] font-medium text-[#1C1B1F] truncate mt-1.5 cursor-help"
                            title={item.description}
                          >
                            {item.description}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] text-[#79747E]">{item.timestamp}</span>
                          <button
                            disabled={isRetrying || isCompleted}
                            onClick={(e) => isCritical ? handleRetry(item.id, item.repo || "", e) : (window.location.href = `/repos/${item.repo.replace("/", "-")}/prs`)}
                            className={`h-7 px-3 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isCompleted
                                ? "bg-[#EBE7FF] border-[#EBE7FF] text-[#21005D]"
                                : "bg-[#F0ECF5] border border-[#E4E1EC] hover:border-[#6E56F2] hover:bg-[#EBE7FF] text-[#1C1B1F] shadow-m3-l1"
                            }`}
                          >
                            {isCritical ? (
                              <>
                                <RefreshIcon size={12} className={isRetrying ? "text-[#6E56F2]" : ""} isSpinning={isRetrying} />
                                <span>{isCompleted ? "Done" : isRetrying ? "Retrying" : "Retry"}</span>
                              </>
                            ) : (
                              <>
                                {item.actionLabel === "Review" ? <Eye className="w-3 h-3" strokeWidth={1.5} /> : <ExternalLink className="w-3 h-3" strokeWidth={1.5} />}
                                <span>{item.actionLabel}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-[#79747E] italic py-2">No critical reviews or failed syncs needing attention.</div>
                )}
              </div>
            </div>
          </div>

          {/* 2. ACTIVE REPOSITORIES — Horizontal Snap-Scroll Rail */}
          <div className="lg:col-span-5 flex flex-col gap-3 min-w-0 text-left">
            <div className="text-[11px] font-semibold text-[#49454F] uppercase tracking-[0.04em]">Active Repositories</div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 w-full scrollbar-none">
              {repositoryActivity.map((repo: any) => (
                <RepoMiniCard key={repo.id || repo.name} repo={repo} />
              ))}
            </div>
          </div>

          {/* 3. RECENT MEMORY — Dense single-column list (No card wrapper, color stripes) */}
          <div className="lg:col-span-8 flex flex-col justify-between min-h-[300px] text-left">
            <div className="space-y-4 w-full">
              <div className="text-[11px] font-semibold text-[#49454F] uppercase tracking-[0.04em]">Recent Memory</div>
              
              <div className="flex flex-col border-t border-b border-[#E4E1EC] divide-y divide-[#E4E1EC]">
                {recentKnowledge.length > 0 ? (
                  recentKnowledge.map((knowledge: any) => (
                    <div 
                      key={knowledge.id}
                      onClick={() => window.location.href = `/repos/${knowledge.repo.replace("/", "-")}/memory`}
                      className="py-3 pl-3.5 pr-2 flex items-center justify-between gap-4 cursor-pointer group relative hover:bg-[#F0ECF5] transition-all duration-200"
                    >
                      {/* Left-edge category-colored accent bar */}
                      <div 
                        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r transition-all duration-200"
                        style={{ backgroundColor: getCategoryColor(knowledge.type) }}
                      />

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#49454F] uppercase leading-none">{knowledge.repo}</span>
                          <span 
                            className="text-[9px] font-mono font-semibold uppercase tracking-wider leading-none"
                            style={{ color: getCategoryColor(knowledge.type) }}
                          >
                            {knowledge.type}
                          </span>
                        </div>
                        <div className="text-[13px] font-medium text-[#1C1B1F] truncate group-hover:text-[#6E56F2] transition-colors" title={knowledge.title}>
                          {knowledge.title}
                        </div>
                      </div>
                      <span className="text-[11px] text-[#79747E] shrink-0">{knowledge.timestamp}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#79747E] italic py-6 pl-2">No recent memory indexing activities.</div>
                )}
              </div>
            </div>

            {repositoryActivity.length > 0 && (
              <div className="flex justify-start mt-4 pt-2">
                <Link href={`/repos/${repositoryActivity[0].id || repositoryActivity[0].name.replace("/", "-")}/memory`} className="text-[12px] font-semibold text-[#6E56F2] hover:underline flex items-center gap-1">
                  <span>View all in Knowledge Graph</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            )}
          </div>

          {/* 4. PRS NEEDING CONTEXT — Asymmetric card with Radial Bar Chart */}
          <div className="lg:col-span-4 bg-[#F0ECF5] rounded-2xl p-5 flex flex-col justify-between min-h-[300px] shadow-m3-l2 relative overflow-hidden">
            <div className="space-y-6 w-full z-10">
              <div className="text-[11px] font-semibold text-[#49454F] uppercase tracking-[0.04em] text-left">PRs Needing Context</div>
              
              <RadialStatChart value={prIntelligence.length} />

              {/* Stacked avatars */}
              <div className="flex items-center justify-between py-1 border-t border-[#E4E1EC] pt-4">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#F0ECF5] bg-[#6E56F2] text-white flex items-center justify-center text-[10px] font-bold animate-none">C</div>
                  <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#F0ECF5] bg-[#0F5132] text-white flex items-center justify-center text-[10px] font-bold animate-none">R</div>
                  <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#F0ECF5] bg-[#664D03] text-white flex items-center justify-center text-[10px] font-bold animate-none">T</div>
                </div>
                <span className="text-[11px] text-[#49454F]">3 active review agents</span>
              </div>
            </div>

            {repositoryActivity.length > 0 && (
              <button
                onClick={() => window.location.href = `/repos/${repositoryActivity[0].id || repositoryActivity[0].name.replace("/", "-")}/prs`}
                className="w-full h-9 rounded-full bg-gradient-to-b from-[#8C76FF] to-[#6E56F2] hover:opacity-95 text-white font-semibold text-xs transition-colors mt-auto cursor-pointer shadow-m3-l1 z-10"
              >
                Review queue
              </button>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
