"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Info, SatelliteDish } from "lucide-react";
import { BrainCircuitIcon, GithubIcon, GitlabIcon } from "@/components/icons/itshover-icons";
import { Skeleton } from "@/components/ui/skeleton";

const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 28 } as const;

interface Repository {
  id: string;
  name: string;
  owner: string;
  lastSync: string;
  openPRs: number;
  commits: number;
  nodes: string;
  freshness: number;
  status: string; // "SYNCED" | "SYNCING" | "FAILED" | "IDLE"
  provider: string; // "github" | "gitlab"
}

export default function DashboardChatPage() {
  const router = useRouter();

  // Fetch real connected repositories via TanStack Query
  const { data: reposData, isLoading } = useQuery({
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

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#FBFAFE] text-[#1C1B1F] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SOFT}
        className="w-full max-w-xl flex flex-col items-center text-center gap-8"
      >
        {/* Header with BrainCircuitIcon inline */}
        <div className="flex flex-col gap-4 items-center">
          <div className="flex items-center gap-3 justify-center">
            <BrainCircuitIcon size={28} color="#6E56F2" />
            <h1 className="text-xl font-bold tracking-tight text-[#1C1B1F] leading-none">
              Choose a repository to chat with
            </h1>
          </div>
          <p className="text-xs text-[#49454F] leading-relaxed max-w-md mx-auto">
            Select a repository below to open the AI-powered knowledge recall chat, powered by the cognee memory graph.
          </p>
        </div>

        {/* Repo list */}
        <div className="w-full flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[76px] bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl flex items-center justify-between px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="w-5 h-5 rounded-full" />
              </div>
            ))
          ) : repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-6">
              <Info className="w-8 h-8 text-[#79747E] mb-3" />
              <p className="text-xs font-semibold text-[#1C1B1F]">No Connected Repositories</p>
              <p className="text-[11px] text-[#49454F] mt-1 max-w-xs leading-relaxed">
                Connect your first repository in the Repositories settings panel to begin chatting with its memory graph.
              </p>
              <button
                onClick={() => router.push("/dashboard/repositories")}
                className="mt-4 px-4 h-8 text-[11px] font-bold text-white bg-gradient-to-b from-[#8C76FF] to-[#6E56F2] hover:opacity-95 rounded-lg shadow-m3-l1 transition-all cursor-pointer"
              >
                Connect Repositories
              </button>
            </div>
          ) : (
            repos.map((repo: any, i: number) => {
              const isSyncing = repo.status === "SYNCING";
              const isFailed = repo.status === "FAILED";
              const isDisabled = isSyncing;

              return (
                <motion.button
                  key={repo.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, ...SPRING_SOFT }}
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      router.push(`/chat/${repo.id}`);
                    }
                  }}
                  className={`group w-full flex items-center gap-4 bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl px-4 py-4 text-left transition-all duration-200 shadow-m3-l1 ${
                    isDisabled
                      ? "opacity-60 cursor-not-allowed border-dashed"
                      : "hover:border-[#6E56F2]/40 hover:bg-[#EBE7FF] hover:shadow-m3-l2 cursor-pointer"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#FBFAFE] border border-[#E4E1EC] flex items-center justify-center shrink-0">
                    {repo.provider === "gitlab" ? (
                      <GitlabIcon size={18} className="text-[#79747E] group-hover:text-[#6E56F2] transition-colors" />
                    ) : (
                      <GithubIcon size={18} className="text-[#79747E] group-hover:text-[#6E56F2] transition-colors" />
                    )}
                  </div>

                  <div className="flex flex-col text-left flex-1 min-w-0">
                    <span className="text-xs font-bold text-[#1C1B1F] truncate">
                      {repo.name}
                    </span>
                    <span className="text-[10px] text-[#49454F] mt-0.5 font-medium">
                      {isSyncing ? (
                        <span className="text-[#664D03] flex items-center gap-1">
                          <SatelliteDish className="w-3.5 h-3.5 animate-pulse" /> Syncing — available soon
                        </span>
                      ) : isFailed ? (
                        <span className="text-[#842029]">Sync failed — check settings</span>
                      ) : (
                        `Synced • ${repo.nodes || "0"} nodes`
                      )}
                    </span>
                  </div>

                  {!isDisabled && (
                    <ChevronRight className="w-4 h-4 text-[#79747E] group-hover:text-[#1C1B1F] shrink-0 transition-colors" />
                  )}
                </motion.button>
              );
            })
          )}
        </div>

        <p className="text-[10px] text-[#79747E] font-bold uppercase tracking-wider">
          Chat sessions are scoped to the repository's knowledge graph dataset
        </p>
      </motion.div>
    </div>
  );
}
