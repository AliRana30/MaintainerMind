"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, 
  List, 
  Plus, 
  ExternalLink, 
  MoreVertical, 
  Database,
  Search,
  Check,
  Clock
} from "lucide-react";
import {
  UnlinkIcon,
  GithubIcon,
  SatelliteDishIcon,
  PlugConnectedIcon,
  PlugConnectedXIcon
} from "@/components/icons/itshover-icons";

const StatusIndicator = ({ status }: { status: string }) => {
  if (status === "SYNCING") {
    return <SatelliteDishIcon size={16} color="#664D03" />;
  }
  if (status === "FAILED") {
    return <PlugConnectedXIcon size={16} color="#842029" />;
  }
  return <PlugConnectedIcon size={16} color="#0F5132" />;
};

export default function RepositoriesPage() {
  const router = useRouter();
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["repos"],
    queryFn: async () => {
      const res = await fetch("/api/repos");
      if (!res.ok) {
        throw new Error("Failed to fetch repositories");
      }
      const json = await res.json();
      return json.repositories || [];
    },
    refetchInterval: 10000,
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeKebabId, setActiveKebabId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "synced" | "syncing" | "failed">("all");
  
  const handleConnectRepo = () => {
    // Redirect to backend endpoint that securely attaches the user session state and redirects to GitHub
    window.location.href = "/api/github/install";
  };

  const handleDeleteRepo = async (id: string) => {
    try {
      const res = await fetch("/api/repos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId: id }),
      });
      if (!res.ok) {
        throw new Error("Failed to disconnect repository");
      }
      refetch();
    } catch (err) {
      console.error(err);
      alert("Failed to disconnect repository");
    } finally {
      setActiveKebabId(null);
    }
  };

  const repos = Array.isArray(data) ? data : [];

  const filteredRepos = repos.filter((repo: any) => {
    const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || repo.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-[#6E56F2]/30 border-t-[#6E56F2] rounded-full animate-spin" />
        <span className="text-xs text-[#49454F] font-semibold">Loading repositories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto py-2">
      {/* ─── TOP BAR CONTROLS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#CBEEDC] pb-5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[20px] font-semibold text-[#1C1B1F] tracking-tight leading-none">Repositories</h1>
          <span className="text-xs bg-[#E8F8F0] border border-[#CBEEDC] px-2 py-0.5 rounded-full text-[#1C1B1F] font-semibold font-mono">
            {filteredRepos.length}
          </span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Segmented Control Toggle (Grid / List) */}
          <div className="bg-[#F0ECF5] border border-[#E4E1EC] p-0.5 rounded-full flex items-center h-8 relative select-none">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 h-full rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative z-10 ${
                viewMode === "grid" ? "text-[#1C1B1F]" : "text-[#49454F]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 h-full rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative z-10 ${
                viewMode === "list" ? "text-[#1C1B1F]" : "text-[#49454F]"
              }`}
            >
              <List className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>List</span>
            </button>

            {/* Sliding highlight */}
            <motion.div
              layout
              className="absolute top-0.5 bottom-0.5 rounded-full bg-[#FBFAFE] border border-[#CBEEDC] z-0 shadow-m3-l1"
              style={{
                left: viewMode === "grid" ? "2px" : "calc(50% + 1px)",
                width: "calc(50% - 3px)"
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          </div>

          <button
            onClick={handleConnectRepo}
            className="bg-gradient-to-b from-[#8C76FF] to-[#6E56F2] hover:opacity-95 text-white text-xs font-semibold px-4 h-8 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-m3-l1"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Connect Repository</span>
          </button>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH ROW ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#79747E]" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-9 pr-4 bg-[#F0ECF5] border border-[#E4E1EC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] outline-none ring-0 focus:border-[#6E56F2] transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 w-full sm:w-auto justify-start sm:justify-end overflow-x-auto pb-1 sm:pb-0">
          {(["all", "synced", "syncing", "failed"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`h-7 px-3 rounded-full text-xs font-semibold capitalize border transition-all cursor-pointer shrink-0 ${
                statusFilter === filter
                  ? "bg-[#6E56F2]/10 border-[#6E56F2]/30 text-[#6E56F2]"
                  : "bg-transparent border-[#E4E1EC] hover:border-[#6E56F2]/20 text-[#49454F] hover:text-[#1C1B1F]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* ─── GRID / LIST VIEWS ─── */}
      <AnimatePresence mode="wait">
        {filteredRepos.length > 0 ? (
          viewMode === "grid" ? (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
            >
              {filteredRepos.map((repo: any) => {
                const hasId = Boolean(repo.id);
                const href = `/repos/${repo.id}/memory`;

                return hasId ? (
                  <div
                    key={repo.id}
                    onClick={() => router.push(href)}
                    className="relative group bg-[#F0ECF5] border border-[#E4E1EC] rounded-xl p-5 flex flex-col justify-between h-[160px] cursor-pointer transition-all duration-300 hover:border-[#6E56F2] hover:bg-[#F0ECF5]/80 shadow-m3-l1 overflow-hidden"
                  >
                    {/* Top Row: Avatar + Name + Status */}
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#FBFAFE] border border-[#E4E1EC] flex items-center justify-center shrink-0">
                          <GithubIcon size={16} />
                        </div>
                        <span className="text-[13px] font-semibold text-[#1C1B1F] truncate" title={repo.name}>
                          {repo.name.split("/").pop()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-[#6E56F2] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-0.5">
                          Open <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                        <StatusIndicator status={repo.status} />
                      </div>
                    </div>

                    {/* Middle Row: Stat Chips */}
                    <div className="grid grid-cols-3 gap-2 py-1">
                      <div>
                        <div className="text-[14px] font-semibold text-[#1C1B1F] leading-tight font-mono">{repo.commits}</div>
                        <div className="text-[10px] text-[#49454F] uppercase font-bold tracking-wider leading-none mt-0.5">commits</div>
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-[#1C1B1F] leading-tight font-mono">{repo.openPRs}</div>
                        <div className="text-[10px] text-[#49454F] uppercase font-bold tracking-wider leading-none mt-0.5">PRs</div>
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-[#1C1B1F] leading-tight font-mono">{repo.nodes}</div>
                        <div className="text-[10px] text-[#49454F] uppercase font-bold tracking-wider leading-none mt-0.5">nodes</div>
                      </div>
                    </div>

                    {/* Bottom Row: Freshness bar + kebab */}
                    <div className="space-y-1.5 pt-1 w-full relative">
                      <div className="w-full h-0.5 rounded-full bg-[#E4E1EC] overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#6E56F2] transition-all duration-500" 
                          style={{ width: `${repo.freshness}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <div className="text-[10px] text-[#49454F] font-medium leading-none">
                          Synced {repo.lastSync === "never" ? "never" : new Date(repo.lastSync).toLocaleDateString()}
                        </div>
                        
                        {/* Delete option popup trigger */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveKebabId(activeKebabId === repo.id ? null : repo.id)}
                            className="p-1 rounded-md text-[#49454F] hover:text-[#1C1B1F] hover:bg-[#E4E1EC] transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          <AnimatePresence>
                            {activeKebabId === repo.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                className="absolute right-0 bottom-7 mt-1.5 w-32 bg-[#F0ECF5] border border-[#E4E1EC] rounded-lg shadow-m3-l3 overflow-hidden z-25 p-1"
                              >
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteRepo(repo.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#842029] hover:bg-[#842029]/10 transition-colors text-left font-semibold cursor-pointer"
                                >
                                  <UnlinkIcon className="w-3.5 h-3.5" />
                                  <span>Disconnect</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Guard: repo.id is undefined — render disabled state
                  <div
                    key={repo.name || Math.random()}
                    className="relative bg-[#E8F8F0]/30 border border-dashed border-[#CBEEDC] rounded-xl p-5 flex flex-col justify-between h-[160px] opacity-60 select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#FBFAFE] border border-[#CBEEDC] flex items-center justify-center shrink-0">
                        <GithubIcon size={16} />
                      </div>
                      <span className="text-[13px] font-semibold text-[#49454F] truncate">
                        {repo.name?.split("/").pop() || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#79747E] font-medium">
                      <Clock className="w-3 h-3" />
                      <span>Sync pending — ID not yet assigned</span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="bg-[#F0ECF5] border border-[#E4E1EC] rounded-xl overflow-hidden divide-y divide-[#E4E1EC] w-full"
            >
              {filteredRepos.map((repo: any) => {
                const hasId = Boolean(repo.id);
                const href = `/repos/${repo.id}/memory`;

                return hasId ? (
                  <div
                    key={repo.id}
                    onClick={() => router.push(href)}
                    className="h-11 px-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#E8F8F0]/60 transition-all group relative"
                  >
                    {/* Left: Avatar + Name */}
                    <div className="flex items-center gap-3 min-w-0 w-[240px] shrink-0">
                      <div className="w-6.5 h-6.5 rounded-md bg-[#FBFAFE] border border-[#CBEEDC] flex items-center justify-center shrink-0">
                        <GithubIcon size={14} />
                      </div>
                      <span className="text-[13px] font-semibold text-[#1C1B1F] truncate" title={repo.name}>
                        {repo.name}
                      </span>
                    </div>

                    {/* Stats columns */}
                    <div className="flex items-center justify-between flex-1 max-w-md gap-4 px-2">
                      <div className="text-center w-16">
                        <span className="text-[12px] font-semibold text-[#1C1B1F] font-mono">{repo.commits}</span>
                        <span className="text-[10px] text-[#49454F] ml-1">commits</span>
                      </div>
                      <div className="text-center w-16">
                        <span className="text-[12px] font-semibold text-[#1C1B1F] font-mono">{repo.openPRs}</span>
                        <span className="text-[10px] text-[#49454F] ml-1">PRs</span>
                      </div>
                      <div className="text-center w-20">
                        <span className="text-[12px] font-semibold text-[#1C1B1F] font-mono">{repo.nodes}</span>
                        <span className="text-[10px] text-[#49454F] ml-1">nodes</span>
                      </div>
                    </div>

                    {/* Synced label */}
                    <div className="text-right text-[11px] text-[#49454F] w-32 shrink-0 hidden md:block">
                      Synced {repo.lastSync === "never" ? "never" : new Date(repo.lastSync).toLocaleDateString()}
                    </div>

                    {/* Status Badge & Kebab */}
                    <div className="flex items-center gap-3 w-32 shrink-0 justify-end">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        repo.status === "SYNCED" ? "bg-[#0F5132]/10 text-[#0F5132] border-[#0F5132]/20" :
                        repo.status === "SYNCING" ? "bg-[#664D03]/10 text-[#664D03] border-[#664D03]/20 animate-pulse" :
                        "bg-[#842029]/10 text-[#842029] border-[#842029]/20"
                      }`}>
                        {repo.status.toLowerCase()}
                      </span>

                      {/* Kebab dropdown for options */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveKebabId(activeKebabId === repo.id ? null : repo.id)}
                          className="p-1 rounded-md text-[#49454F] hover:text-[#1C1B1F] hover:bg-[#CBEEDC] transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        <AnimatePresence>
                          {activeKebabId === repo.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                              className="absolute right-0 mt-1.5 w-32 bg-[#F0ECF5] border border-[#E4E1EC] rounded-lg shadow-m3-l3 overflow-hidden z-25 p-1"
                            >
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteRepo(repo.id);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#842029] hover:bg-[#842029]/10 transition-colors text-left font-semibold cursor-pointer"
                              >
                                <UnlinkIcon className="w-3.5 h-3.5" />
                                <span>Disconnect</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Guard: repo.id is undefined — render disabled row
                  <div
                    key={repo.name || Math.random()}
                    className="h-11 px-4 flex items-center gap-4 opacity-50 select-none border-b border-[#CBEEDC]"
                  >
                    <div className="flex items-center gap-3 min-w-0 w-[240px] shrink-0">
                      <GithubIcon size={14} />
                      <span className="text-[13px] font-semibold text-[#49454F] truncate">{repo.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#79747E]">
                      <Clock className="w-3 h-3" />
                      <span>Sync pending</span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )
        ) : (
          /* Empty state */
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex items-center justify-center py-10"
          >
            <div className="w-full max-w-lg border border-dashed border-[#E4E1EC] rounded-xl p-8 flex flex-col items-center text-center space-y-4 bg-[#F0ECF5]/20">
              <div className="w-10 h-10 rounded-full bg-[#F0ECF5] border border-[#E4E1EC] flex items-center justify-center">
                <Database className="w-5 h-5 text-[#6E56F2]" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-[#1C1B1F] leading-none">Connect your first repository</h3>
                <p className="text-xs text-[#49454F]">
                  Ingest commits and PR histories to build real-time memory contexts.
                </p>
              </div>
              <button
                onClick={handleConnectRepo}
                className="bg-gradient-to-b from-[#8C76FF] to-[#6E56F2] hover:opacity-95 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-m3-l1"
              >
                Connect Repository
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
