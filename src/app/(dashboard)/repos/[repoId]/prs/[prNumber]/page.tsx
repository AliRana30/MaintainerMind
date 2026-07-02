"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import {
  Network,
  MessageSquare,
  ChevronDown,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  ArrowLeft,
  Calendar,
  User,
  ExternalLink
} from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

// Easing & Spring presets
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

export default function PRInsightsPage() {
  const params = useParams();
  const router = useRouter();
  const repoId = (params?.repoId as string) || "";
  const prNumber = (params?.prNumber as string) || "";

  const containerRef = useRef<HTMLDivElement>(null);
  const [reRunLoading, setReRunLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<"helpful" | "not_helpful" | null>(null);
  const [dismissedDecisions, setDismissedDecisions] = useState<Record<string, boolean>>({});
  const [openDecisions, setOpenDecisions] = useState<Record<string, boolean>>({});

  // Initialize Lenis scroll
  useEffect(() => {
    if (!containerRef.current) return;

    const lenis = new Lenis({
      wrapper: containerRef.current,
      content: containerRef.current.firstElementChild as HTMLElement || containerRef.current,
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Fetch PR Insights data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pr-insights", repoId, prNumber],
    queryFn: async () => {
      const res = await fetch(`/api/repos/${repoId}/prs/${prNumber}`);
      if (!res.ok) throw new Error("Failed to fetch PR insights data");
      return res.json();
    },
    enabled: !!repoId && !!prNumber,
  });

  const handleReRunRecall = async () => {
    setReRunLoading(true);
    try {
      // POST to improve memory and recall again
      await fetch(`/api/repos/${repoId}/memory/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetName: repoId }),
      });
      await refetch();
    } catch (err) {
      console.error("Failed to re-run recall", err);
    } finally {
      setReRunLoading(false);
    }
  };

  const submitFeedback = async (rating: "helpful" | "not_helpful") => {
    setFeedbackSubmitted(rating);
    try {
      const numRating = rating === "helpful" ? 3 : 1;
      await fetch("/api/memory/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memoryId: `pr-insights-${repoId}-${prNumber}`,
          rating: numRating,
          datasetName: repoId,
          comments: `PR Insights feedback for PR #${prNumber}`
        }),
      });
    } catch (err) {
      console.error("Failed to submit feedback", err);
    }
  };

  const handleDismissDecision = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedDecisions(prev => ({ ...prev, [id]: true }));
  };

  const toggleDecision = (id: string) => {
    setOpenDecisions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-[#6E56F2] animate-spin" />
        <span className="text-sm text-[#49454F]">Analyzing pull request memory...</span>
      </div>
    );
  }

  if (!data || !data.pr) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-[#842029] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#1C1B1F]">No PR Insights Available</h3>
        <p className="text-sm text-[#49454F] mt-1">This PR might not exist or hasn't been ingested yet.</p>
        <button
          onClick={() => router.back()}
          className="mt-6 flex items-center gap-2 mx-auto px-4 py-2 rounded-full bg-[#F0ECF5] border border-[#E4E1EC] text-xs font-bold text-[#1C1B1F] hover:border-[#6E56F2] hover:bg-[#EBE7FF] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  const { pr, riskScore, riskFactors, similarPrs, subsystems, recalledDecisions } = data;
  const activeDecisions = recalledDecisions.filter((d: any) => !dismissedDecisions[d.id]);

  // Color mapping text ONLY according to color contract
  const getStateColor = (state: string) => {
    const s = state.toLowerCase();
    if (s === "open") return "text-[#0F5132]";
    if (s === "merged") return "text-[#6E56F2]";
    return "text-[#842029]"; // closed
  };

  const chartData = [{ name: "Risk", value: riskScore, fill: "#6E56F2" }];

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
        {/* ─── PAGE HEADER ─── */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-[#79747E]">#{pr.githubPrNumber}</span>
            <div className="bg-[#F0ECF5] text-xs font-semibold rounded-lg px-2.5 py-0.5 border border-[#E4E1EC] flex items-center">
              <span className={`capitalize font-bold ${getStateColor(pr.state)}`}>
                {pr.state}
              </span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1C1B1F] tracking-tight leading-tight">
            {pr.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#49454F]">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-[#F0ECF5] border border-[#E4E1EC] flex items-center justify-center">
                <User className="h-3 w-3 text-[#49454F]" />
              </div>
              <span className="font-semibold text-[#1C1B1F]">{pr.authorLogin}</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[#0F5132]">+{pr.additions}</span>
              <span className="text-[#842029]">−{pr.deletions}</span>
            </div>
          </div>

          <div className="pt-2">
            <motion.button
              onClick={handleReRunRecall}
              disabled={reRunLoading}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2 bg-[#F0ECF5] border border-[#E4E1EC] rounded-full text-xs font-semibold text-[#1C1B1F] hover:border-[#6E56F2] hover:bg-[#EBE7FF] transition-all cursor-pointer disabled:opacity-50 shadow-m3-l1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${reRunLoading ? "animate-spin text-[#6E56F2]" : ""}`} />
              <span>{reRunLoading ? "Recalling Graph..." : "Re-run Recall"}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ─── GRID: METRICS & RISK ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Risk Score Card */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-1 bg-[#F0ECF5] rounded-2xl p-5 flex flex-col items-center justify-center text-center relative min-h-[220px] shadow-m3-l1"
          >
            <div className="w-[120px] h-[120px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="80%"
                  outerRadius="100%"
                  barSize={10}
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background={{ fill: "#E4E1EC" }}
                    dataKey="value"
                    cornerRadius={5}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-medium text-[#1C1B1F] tabular-nums">
                  {riskScore}
                </span>
                <span className="text-xs text-[#49454F] mt-0.5">Score</span>
              </div>
            </div>

            <div className="mt-3">
              <span className="text-xs font-semibold text-[#49454F]">
                {riskScore < 30 ? "Low Risk" : riskScore < 70 ? "Medium Risk" : "High Risk"}
              </span>
            </div>
          </motion.div>

          {/* Risk Factors & Subsystems */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 bg-[#F0ECF5] rounded-2xl p-5 flex flex-col justify-between shadow-m3-l1"
          >
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#49454F] uppercase tracking-wider block">Risk Factors</span>
              <ul className="space-y-2 text-xs text-[#49454F]">
                {riskFactors.map((factor: string, idx: number) => {
                  return (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-[#79747E] shrink-0 font-bold">·</span>
                      <span>{factor.replace(/^[·\s\-\*]+/, "")}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="pt-4 border-t border-[#E4E1EC] mt-4">
              <span className="text-xs font-bold text-[#49454F] uppercase tracking-wider block mb-2">Affected Subsystems</span>
              <div className="flex flex-wrap gap-1.5">
                {subsystems.map((sub: string) => (
                  <span
                    key={sub}
                    className="text-[11px] font-mono font-semibold bg-[#F5F2FA]/30 border border-[#E4E1EC] text-[#1C1B1F] rounded-lg px-2 py-0.5"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── RECALLED DECISIONS (ACCORDION) ─── */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#49454F] uppercase tracking-wider">Recalled Decisions</h2>
            <span className="text-xs text-[#79747E] font-mono">{activeDecisions.length} retrieved</span>
          </div>

          <div className="space-y-2.5">
            {activeDecisions.length === 0 ? (
              <div className="bg-[#F5F2FA]/30 border border-dashed border-[#E4E1EC] rounded-2xl p-8 text-center">
                <AlertCircle className="h-8 w-8 text-[#79747E] mx-auto mb-2" />
                <span className="text-xs text-[#49454F]">No memory graph nodes or decisions matched this PR.</span>
              </div>
            ) : (
              activeDecisions.map((dec: any) => {
                const isOpen = !!openDecisions[dec.id];
                const isGraphSource = dec.source === "graph";

                return (
                  <div
                    key={dec.id}
                    className="bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl overflow-hidden shadow-m3-l1 transition-all duration-150"
                  >
                    {/* Accordion Header */}
                    <div
                      onClick={() => toggleDecision(dec.id)}
                      className="px-4 py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F0ECF5]/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isGraphSource ? (
                          <Network className="h-4 w-4 text-[#49454F] shrink-0" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-[#49454F] shrink-0" />
                        )}
                        <span className="text-xs text-[#1C1B1F] truncate max-w-[280px] sm:max-w-md font-semibold">
                          {dec.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-[#79747E] font-mono uppercase">Relevance</span>
                          <div className="w-16 h-1 bg-[#E4E1EC] rounded-full overflow-hidden mt-0.5 relative">
                            <div
                              className="h-full bg-[#6E56F2] rounded-full"
                              style={{ width: `${dec.score}%` }}
                            />
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={SPRING_SOFT}
                        >
                          <ChevronDown className="h-4 w-4 text-[#49454F]" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Accordion Body */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.18, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-[#E4E1EC] space-y-3">
                            <p className="text-xs text-[#49454F] leading-relaxed whitespace-pre-wrap">
                              {dec.text}
                            </p>

                            <div className="flex items-center justify-between gap-4 pt-1">
                              <span className="text-[10px] text-[#79747E] font-mono">
                                Dataset: <span className="text-[#1C1B1F]">{dec.datasetName || "cognee"}</span>
                              </span>

                              <button
                                onClick={(e) => handleDismissDecision(dec.id, e)}
                                className="text-[10px] font-bold text-[#49454F] hover:text-[#842029] transition-colors"
                              >
                                Not relevant
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* ─── SIMILAR PRS GRID ─── */}
        <motion.div variants={itemVariants} className="space-y-3">
          <h2 className="text-sm font-bold text-[#49454F] uppercase tracking-wider">Similar PRs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {similarPrs.map((sim: any) => (
              <div
                key={sim.id}
                onClick={() => router.push(`/repos/${repoId}/prs/${sim.prNumber}`)}
                className="bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-4 shadow-m3-l1 hover:shadow-m3-l2 hover:translate-y-[-1px] transition-all cursor-pointer flex flex-col justify-between h-[110px]"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#49454F]">PR #{sim.prNumber}</span>
                    <span className="text-[10px] text-[#79747E] font-mono">{sim.similarity}% match</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#1C1B1F] line-clamp-2 leading-relaxed">
                    {sim.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between border-t border-[#E4E1EC] pt-2">
                  <span className="text-[9px] text-[#79747E] font-bold uppercase tracking-wider">Outcome</span>
                  <span className="text-[10px] font-semibold text-[#1C1B1F]">{sim.outcome}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── FEEDBACK FOOTER ─── */}
        <motion.div
          variants={itemVariants}
          className="border-t border-[#E4E1EC] pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#49454F] font-semibold">Was this context review accurate?</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => submitFeedback("helpful")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 ${feedbackSubmitted === "helpful"
                  ? "bg-[#EBE7FF] border-[#EBE7FF] text-[#21005D]"
                  : "bg-[#F0ECF5] border border-[#E4E1EC] text-[#49454F] hover:border-[#6E56F2] hover:bg-[#EBE7FF]"
                }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>Helpful</span>
            </button>

            <button
              onClick={() => submitFeedback("not_helpful")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 ${feedbackSubmitted === "not_helpful"
                  ? "bg-[#F8D7DA] border-[#F8D7DA] text-[#842029]"
                  : "bg-[#F0ECF5] border border-[#E4E1EC] text-[#49454F] hover:border-[#6E56F2] hover:bg-[#EBE7FF]"
                }`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              <span>Not helpful</span>
            </button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
