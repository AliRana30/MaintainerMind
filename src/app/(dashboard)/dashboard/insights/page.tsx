"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  ExternalLink,
  GitPullRequest,
  Search,
  FileText,
  CheckCircle2,
  ThumbsDown,
  Info,
  Layers,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { useActiveRepo } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { LikeIcon } from "@/components/icons/itshover-icons";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from "recharts";

// Interfaces to match the backend API response
interface PRInsight {
  id: number;
  number: number;
  title: string;
  url: string;
  author: string;
  authorAvatar: string;
  createdAt: string;
  updatedAt: string;
  state: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  riskScore: number;
  affectedSubsystems: string[];
  contextMatches: number;
  filesChanged: string[];
  reviewTime: number | null;
}

interface PRInsightsResponse {
  repoFullName: string;
  kpis: {
    avgReviewTimeHours: number;
    contextRecallRate: number;
    prsWithContext: number;
    totalOpenPRs: number;
    maintainerTrustScore: number;
  };
  prs: PRInsight[];
}

interface HistoryPoint {
  date: string;
  avgReviewTimeHours: number;
  contextRecallRate: number;
  prsWithContext: number;
  totalOpenPRs: number;
  maintainerTrustScore: number;
}

interface HistoryResponse {
  success: boolean;
  history: HistoryPoint[];
}

// ─── RECALL LAZY LOAD COMPONENT ───
function PRRecallContext({
  repoId,
  prNumber,
  isOpen
}: {
  repoId: string;
  prNumber: number;
  isOpen: boolean;
}) {
  const queryClient = useQueryClient();
  const [feedbackStates, setFeedbackStates] = useState<Record<string, "helpful" | "not_helpful">>({});
  const [loadingFeedbackId, setLoadingFeedbackId] = useState<string | null>(null);

  const { data: recallData, isLoading } = useQuery({
    queryKey: ["pr-recall", repoId, prNumber],
    queryFn: async () => {
      const res = await fetch(`/api/repos/${repoId}/prs/${prNumber}`);
      if (!res.ok) throw new Error("Failed to fetch recall context");
      return res.json();
    },
    enabled: isOpen && !!repoId,
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({
      decisionId,
      text,
      rating
    }: {
      decisionId: string;
      text: string;
      rating: "helpful" | "not_helpful";
    }) => {
      setLoadingFeedbackId(decisionId);
      const res = await fetch(`/api/repos/${repoId}/pr-insights/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextText: text,
          rating,
          prNumber,
        }),
      });
      if (!res.ok) throw new Error("Feedback submission failed");
      return { decisionId, rating };
    },
    onSuccess: (data) => {
      setFeedbackStates((prev) => ({ ...prev, [data.decisionId]: data.rating }));
      setLoadingFeedbackId(null);
    },
    onError: () => {
      setLoadingFeedbackId(null);
    }
  });

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="space-y-3 py-1">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const decisions = recallData?.recalledDecisions || [];

  if (decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center bg-[#FBFAFE]/50 border border-dashed border-[#E4E1EC] rounded-xl">
        <Info className="w-5 h-5 text-[#79747E] mb-1.5" />
        <p className="text-xs font-semibold text-[#49454F]">No Recalled Context</p>
        <p className="text-[11px] text-[#79747E] max-w-[240px] mt-0.5">
          No matching past architectural decisions or context were found for the modified files.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {decisions.map((dec: any) => {
        const currentFeedback = feedbackStates[dec.id];
        const isSubmitting = loadingFeedbackId === dec.id;

        return (
          <div
            key={dec.id}
            className="flex flex-col justify-between p-3.5 bg-[#FBFAFE] border border-[#E4E1EC] rounded-xl hover:border-[#6E56F2]/30 transition-all duration-200"
          >
            <div className="text-[12px] leading-relaxed text-[#1C1B1F] font-medium">
              {dec.text}
            </div>

            <div className="flex items-center justify-between border-t border-[#E8F8F0] mt-3 pt-2">
              <span className="text-[10px] text-[#79747E] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6E56F2]" />
                Score: {dec.score}% • {dec.source.toUpperCase()}
              </span>

              <div className="flex items-center gap-1.5">
                {/* 👍 Helpful Feedback Button (LikeIcon) */}
                <LikeIcon
                  size={14}
                  color={currentFeedback === "helpful" ? "#0F5132" : "#79747E"}
                  className={`cursor-pointer transition-colors duration-150 p-1.5 rounded-md ${
                    currentFeedback === "helpful" ? "bg-[#0F5132]/10" : "hover:bg-[#F0ECF5]"
                  }`}
                  onClick={() => {
                    if (isSubmitting) return;
                    feedbackMutation.mutate({
                      decisionId: dec.id,
                      text: dec.text,
                      rating: "helpful",
                    });
                  }}
                />

                {/* 👎 Not Helpful Feedback Button */}
                <button
                  type="button"
                  className={`inline-flex items-center justify-center p-1.5 rounded-md transition-colors ${
                    currentFeedback === "not_helpful" ? "bg-[#842029]/10 text-[#842029]" : "text-[#79747E] hover:bg-[#E8F8F0]"
                  }`}
                  onClick={() => {
                    if (isSubmitting) return;
                    feedbackMutation.mutate({
                      decisionId: dec.id,
                      text: dec.text,
                      rating: "not_helpful",
                    });
                  }}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SPARKLINE CHART COMPONENT ───
function Sparkline({ data, dataKey }: { data: any[]; dataKey: string }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-10 w-full mt-2 select-none pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`sparklineGrad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6E56F2" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6E56F2" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#6E56F2"
            strokeWidth={1.8}
            fillOpacity={1}
            fill={`url(#sparklineGrad-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── MAIN PR INSIGHTS PAGE ───
export default function PRInsightsDashboard() {
  const [selectedRepo] = useActiveRepo();
  const [expandedPR, setExpandedPR] = useState<number | null>(null);

  // 1. Fetch repositories to map selectedRepo name to DB ID using the shared "repos" cache
  const { data: reposData, isLoading: isLoadingRepos } = useQuery({
    queryKey: ["repos"],
    queryFn: async () => {
      const res = await fetch("/api/repos");
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const json = await res.json();
      return json.repositories || [];
    },
    refetchInterval: 10000,
  });

  const repos = reposData || [];
  const activeRepo = repos.find(
    (r: any) => r.fullName === selectedRepo || r.name === selectedRepo || r.id === selectedRepo
  );
  const repoId = activeRepo?.id;

  // 2. Fetch main PR insights data (60s refetch interval)
  const { data: insightsData, isLoading: isLoadingInsights } = useQuery<PRInsightsResponse>({
    queryKey: ["pr-insights", repoId],
    queryFn: async () => {
      const res = await fetch(`/api/repos/${repoId}/pr-insights`);
      if (!res.ok) throw new Error("Failed to fetch PR insights");
      return res.json();
    },
    enabled: !!repoId,
    refetchInterval: 60000,
  });

  // 3. Fetch daily time series history
  const { data: historyData, isLoading: isLoadingHistory } = useQuery<HistoryResponse>({
    queryKey: ["pr-insights-history", repoId],
    queryFn: async () => {
      const res = await fetch(`/api/repos/${repoId}/pr-insights/history`);
      if (!res.ok) throw new Error("Failed to fetch PR insights history");
      return res.json();
    },
    enabled: !!repoId,
  });

  const kpis = insightsData?.kpis;
  const prs = insightsData?.prs || [];
  const history = historyData?.history || [];

  const handleToggleAccordion = (prNum: number) => {
    setExpandedPR(expandedPR === prNum ? null : prNum);
  };

  // ─── RENDERING LOADING STATES ───
  if (isLoadingRepos || (repoId && isLoadingInsights)) {
    return (
      <div className="space-y-6">
        {/* KPI Row skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-5 space-y-3"
            >
              <Skeleton className="h-4 w-28 bg-[#E4E1EC]/60" />
              <Skeleton className="h-8 w-20 bg-[#E4E1EC]/60" />
              <Skeleton className="h-10 w-full bg-[#E4E1EC]/60" />
            </div>
          ))}
        </div>

        {/* PR List Skeletons */}
        <div className="bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-6 space-y-4">
          <Skeleton className="h-6 w-36 bg-[#CBEEDC]/60" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#FBFAFE] p-4 rounded-xl border border-[#CBEEDC] flex justify-between items-center">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/3 bg-[#CBEEDC]/60" />
                  <Skeleton className="h-3 w-1/3 bg-[#CBEEDC]/60" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full bg-[#CBEEDC]/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDERING SELECTION STATE ───
  if (!repoId) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-8 shadow-m3-l1 flex flex-col items-center space-y-5"
        >
          <div className="w-12 h-12 rounded-full bg-[#6E56F2]/10 border border-[#6E56F2]/20 flex items-center justify-center">
            <GitPullRequest className="w-6 h-6 text-[#6E56F2]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-[#1C1B1F]">
              No Active Repository Selected
            </h2>
            <p className="text-xs text-[#49454F] leading-relaxed">
              Please choose a repository from the navbar dropdown to view risk insights, affected subsystems, and recalled context nodes.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDERING EMPTY STATE ───
  const hasNoOpenPRs = prs.length === 0;

  return (
    <div className="space-y-6">
      {/* ─── TOP KPI ROW (4 TILES) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1: Avg Review Time */}
        <div className="bg-[#E8F8F0] border border-[#CBEEDC] rounded-2xl p-5 shadow-m3-l1 hover:shadow-m3-l3 transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#49454F] uppercase tracking-wider">
              Avg Open PR Age
            </span>
            <Clock className="w-4 h-4 text-[#6E56F2] opacity-80" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1C1B1F]">
              {kpis?.avgReviewTimeHours}
            </span>
            <span className="text-xs text-[#49454F] font-semibold">hours</span>
          </div>
          <Sparkline data={history} dataKey="avgReviewTimeHours" />
        </div>

        {/* KPI 2: Context Recall Rate */}
        <div className="bg-[#E8F8F0] border border-[#CBEEDC] rounded-2xl p-5 shadow-m3-l1 hover:shadow-m3-l3 transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#49454F] uppercase tracking-wider">
              Context Recall Rate
            </span>
            <Sparkles className="w-4 h-4 text-[#6E56F2] opacity-80" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1C1B1F]">
              {kpis?.contextRecallRate}
            </span>
            <span className="text-xs text-[#49454F] font-semibold">%</span>
          </div>
          <Sparkline data={history} dataKey="contextRecallRate" />
        </div>

        {/* KPI 3: PRs Auto-Commented */}
        <div className="bg-[#E8F8F0] border border-[#CBEEDC] rounded-2xl p-5 shadow-m3-l1 hover:shadow-m3-l3 transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#49454F] uppercase tracking-wider">
              PRs Auto-Commented
            </span>
            <TrendingUp className="w-4 h-4 text-[#6E56F2] opacity-80" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1C1B1F]">
              {kpis?.prsWithContext}
            </span>
            <span className="text-xs text-[#49454F] font-semibold">PRs</span>
          </div>
          <Sparkline data={history} dataKey="prsWithContext" />
        </div>

        {/* KPI 4: Maintainer Trust Score */}
        <div className="bg-[#E8F8F0] border border-[#CBEEDC] rounded-2xl p-5 shadow-m3-l1 hover:shadow-m3-l3 transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#49454F] uppercase tracking-wider">
              Maintainer Trust Score
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#6E56F2] opacity-80" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1C1B1F]">
              {kpis?.maintainerTrustScore}
            </span>
            <span className="text-xs text-[#49454F] font-semibold">/100</span>
          </div>
          <Sparkline data={history} dataKey="maintainerTrustScore" />
        </div>
      </div>

      {/* ─── OPEN PR INSIGHTS SECTION ─── */}
      <div className="bg-[#E8F8F0] border border-[#CBEEDC] rounded-2xl p-6 shadow-m3-l1">
        <div className="flex items-center justify-between mb-4 border-b border-[#CBEEDC] pb-3">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-4.5 h-4.5 text-[#6E56F2]" />
            <h2 className="text-sm font-bold text-[#1C1B1F]">Open Pull Request Insights</h2>
          </div>
          <span className="text-[11px] text-[#49454F] font-semibold">
            {prs.length} active PRs monitored
          </span>
        </div>

        {hasNoOpenPRs ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#FBFAFE]/40 border border-dashed border-[#CBEEDC] rounded-xl">
            <GitPullRequest className="w-8 h-8 text-[#79747E] mb-2.5 opacity-60" />
            <p className="text-xs font-semibold text-[#1C1B1F]">No Open PRs Right Now</p>
            <p className="text-[11px] text-[#49454F] max-w-sm mt-1">
              There's no opened PR in this repo. Insights will appear here automatically once a pull request is opened.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {prs.map((pr) => {
              const isExpanded = expandedPR === pr.number;

              return (
                <div
                  key={pr.id}
                  className="bg-[#FBFAFE] border border-[#E4E1EC] rounded-xl overflow-hidden shadow-sm hover:border-[#6E56F2]/30 transition-all duration-200"
                >
                  {/* Accordion Row Header */}
                  <div
                    onClick={() => handleToggleAccordion(pr.number)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer hover:bg-[#E8F8F0]/40 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      {pr.authorAvatar ? (
                        <img
                          src={pr.authorAvatar}
                          alt={pr.author}
                          className="w-7 h-7 rounded-full border border-[#CBEEDC] mt-0.5 sm:mt-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#6E56F2]/10 flex items-center justify-center text-xs font-bold text-[#6E56F2] shrink-0">
                          {pr.author.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#79747E] font-bold">#{pr.number}</span>
                          <span className="text-xs font-semibold text-[#1C1B1F] truncate max-w-md">
                            {pr.title}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-[#79747E] font-semibold">
                          <span>by {pr.author}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>
                            {new Date(pr.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="text-[#0F5132]">+{pr.additions}</span>
                          <span className="text-[#842029]">-{pr.deletions}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 border-[#E4E1EC]/50 pt-2.5 sm:pt-0 shrink-0">
                      <div className="flex items-center gap-2">
                        {/* Risk tag pill */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            pr.riskScore >= 70
                              ? "bg-[#842029]/10 text-[#842029] border-[#842029]/20"
                              : pr.riskScore >= 45
                              ? "bg-[#664D03]/10 text-[#664D03] border-[#664D03]/20"
                              : "bg-[#0F5132]/10 text-[#0F5132] border-[#0F5132]/20"
                          }`}
                        >
                          {pr.riskScore}% Risk
                        </span>

                        {/* Link to dedicated PR insights review page */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/repos/${repoId}/prs/${pr.number}`;
                          }}
                          className="p-1 rounded-md hover:bg-[#E4E1EC]/50 text-[#6E56F2] hover:text-[#21005D] transition-colors"
                          title="View Full Context"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#79747E]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#79747E]" />
                      )}
                    </div>
                  </div>

                  {/* Accordion Expandable Details */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="border-t border-[#CBEEDC] bg-[#E8F8F0]/30"
                      >
                        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
                          {/* Col 1: Risk Metric Ring Chart (lg:col-span-3) */}
                          <div className="lg:col-span-3 bg-[#FBFAFE] border border-[#CBEEDC] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold text-[#49454F] uppercase tracking-wider mb-2">
                              Risk Ring Score
                            </span>

                            <div className="w-28 h-28 relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                  innerRadius="80%"
                                  outerRadius="100%"
                                  data={[{ value: pr.riskScore }]}
                                  startAngle={90}
                                  endAngle={-270}
                                >
                                  <PolarAngleAxis
                                    type="number"
                                    domain={[0, 100]}
                                    angleAxisId={0}
                                    tick={false}
                                  />
                                  <RadialBar
                                    background
                                    dataKey="value"
                                    cornerRadius={8}
                                    fill={pr.riskScore >= 70 ? "#842029" : pr.riskScore >= 45 ? "#664D03" : "#6E56F2"}
                                  />
                                </RadialBarChart>
                              </ResponsiveContainer>

                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-base font-extrabold text-[#1C1B1F]">
                                  {pr.riskScore}%
                                </span>
                                <span className="text-[8px] text-[#79747E] uppercase font-bold tracking-widest mt-0.5">
                                  {pr.riskScore >= 70 ? "Critical" : pr.riskScore >= 45 ? "Medium" : "Stable"}
                                </span>
                              </div>
                            </div>

                            <p className="text-[10px] text-[#49454F] leading-relaxed mt-3">
                              {pr.riskScore >= 70
                                ? "This pull request modifies critical subsystems that do not have matching past decision logs in the memory index."
                                : pr.riskScore >= 45
                                ? "Moderate files changed. Recalled context shows some historical precedents."
                                : "Low risk. Modified areas are heavily cross-referenced against historical graph nodes."}
                            </p>
                          </div>

                          {/* Col 2: Affected Subsystems (lg:col-span-4) */}
                          <div className="lg:col-span-4 bg-[#FBFAFE] border border-[#CBEEDC] rounded-xl p-4 flex flex-col">
                            <span className="text-[10px] font-bold text-[#49454F] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[#6E56F2]" /> Affected Subsystems
                            </span>

                            <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-36 pr-1">
                              {pr.affectedSubsystems.map((sub, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-semibold text-[#1C1B1F] bg-[#E8F8F0]/30 border border-[#CBEEDC] px-2 py-1 rounded-md"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>

                            <span className="text-[9px] font-bold text-[#79747E] uppercase mt-4 mb-1.5">
                              Files Modified
                            </span>
                            <div className="flex-1 overflow-y-auto max-h-24 text-[10px] font-mono text-[#49454F] space-y-1 pr-1">
                              {pr.filesChanged.map((file, i) => (
                                <div key={i} className="truncate flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-[#79747E] shrink-0" />
                                  <span>{file}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Col 3: Recall Context (lg:col-span-5) */}
                          <div className="lg:col-span-5 bg-[#FBFAFE] border border-[#CBEEDC] rounded-xl p-4 flex flex-col">
                            <span className="text-[10px] font-bold text-[#49454F] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#6E56F2]" /> Recalled Graph Decisions
                            </span>

                            <PRRecallContext
                              repoId={repoId}
                              prNumber={pr.number}
                              isOpen={isExpanded}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
