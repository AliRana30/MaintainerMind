"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDashboardStore, useActiveRepo } from "@/lib/store";
import { GitBranch, Menu, Check, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { useScrollContainer } from "@/components/layout/ScrollContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StackIcon, MagnifierIcon, TriangleAlertIcon, MessageCircleIcon, SparklesIcon } from "@/components/icons/itshover-icons";

// ─── ITSHOVER ANIMATED CHEVRON ───
const DownChevron = ({ isOpen, className = "", size = 14 }: { isOpen: boolean; className?: string; size?: number }) => {
  return (
    <motion.div
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9l6 6l6 -6" />
      </svg>
    </motion.div>
  );
};

// ─── ITSHOVER ANIMATED BELL ICONS ───
const FilledBellIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <motion.svg
    whileHover={{ rotate: [0, -12, 12, -12, 12, 0] }}
    transition={{ duration: 0.45, ease: "easeInOut" }}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1.5"
    className={className}
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </motion.svg>
);

const BellIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <motion.svg
    whileHover={{ rotate: [0, -12, 12, -12, 12, 0] }}
    transition={{ duration: 0.45, ease: "easeInOut" }}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </motion.svg>
);

const MutedBellIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <motion.svg
    whileHover={{ rotate: [0, -12, 12, -12, 12, 0] }}
    transition={{ duration: 0.45, ease: "easeInOut" }}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="M18.4 13A2 2 0 0 1 20 15v1a2 2 0 0 1-.8 1.6M10 4a2 2 0 0 1 3.5 0c.9.2 1.6.5 2.1.9M4.2 4.2l15.6 15.6" />
  </motion.svg>
);

const SlashIcon = () => (
  <svg className="w-3 h-3 text-[#5C5C64]/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "sync_failure":
      return <TriangleAlertIcon className="text-[#F2596E]" size={16} />;
    case "pr_context":
      return <MessageCircleIcon className="text-[#6E56F2]" size={16} />;
    case "milestone":
      return <SparklesIcon className="text-[#6E56F2]" size={16} />;
    default:
      return <SparklesIcon className="text-[#6E56F2]" size={16} />;
  }
};

function formatRelativeTime(dateString: string | Date) {
  if (!dateString) return "just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 15000,
  });
}

export default function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: session } = useSession();
  const user = session?.user;
  const [selectedRepo, setSelectedRepo] = useActiveRepo();

  const handleRepoSwitch = (fullName: string) => {
    setSelectedRepo(fullName);
    const formattedRepoId = fullName.replace("/", "-");
    if (pathname.startsWith("/repos/")) {
      const segments = pathname.split("/");
      if (segments.length >= 3) {
        segments[2] = formattedRepoId;
        router.push(segments.join("/"));
      }
    } else if (pathname === "/dashboard/graph") {
      router.push(`/dashboard/graph?repo=${formattedRepoId}`);
    } else if (pathname === "/dashboard/chat") {
      router.push(`/dashboard/chat?repo=${formattedRepoId}`);
    } else if (pathname === "/dashboard/prs") {
      router.push(`/dashboard/prs?repo=${formattedRepoId}`);
    } else if (pathname === "/dashboard/memory") {
      router.push(`/dashboard/memory?repo=${formattedRepoId}`);
    }
  };
  const {
    addNotification,
    toggleMobileSidebar
  } = useDashboardStore();

  const { data: reposData } = useQuery({
    queryKey: ["repos"],
    queryFn: async () => {
      const res = await fetch("/api/repos");
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const json = await res.json();
      return json.repositories || [];
    },
    refetchInterval: 10000,
  });
  const repos = reposData ? reposData.map((r: any) => ({
    fullName: r.fullName,
    status: r.syncStatus || "SYNCED"
  })) : [];

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [breadcrumbOpen, setBreadcrumbOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const breadcrumbRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData } = useNotifications();
  const unreadCount = notificationsData?.unreadCount ?? 0;
  const notificationsList = notificationsData?.notifications ?? [];

  const searchPRs = [
    { id: "849", title: "docs: fix grammar typos", repo: "cognee/cognee" },
    { id: "850", title: "refactor: optimize array filter", repo: "facebook/react" },
    { id: "851", title: "chore: update package locks", repo: "tailwindlabs/tailwindcss" },
    { id: "852", title: "feat: add cognitive test stub", repo: "facebook/react" },
  ];

  const searchDecisions = [
    { title: "Why OAuth was removed", year: "2021" },
    { title: "Session isolation decision", year: "2022" },
    { title: "Redis caching strategy", year: "2023" },
    { title: "Why v2 API was redesigned", year: "2024" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const scrollContainerRef = useScrollContainer();
  const { scrollY } = useScroll({
    container: scrollContainerRef || undefined
  });

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 40);
    });
    return () => unsubscribe();
  }, [scrollY]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (breadcrumbRef.current && !breadcrumbRef.current.contains(event.target as Node)) {
        setBreadcrumbOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.message) {
          queryClient.setQueryData(["notifications"], (old: any) => {
            if (!old) return { notifications: [data], unreadCount: 1 };
            if (old.notifications?.some((n: any) => n.id === data.id)) return old;
            return {
              ...old,
              unreadCount: (old.unreadCount || 0) + 1,
              notifications: [data, ...old.notifications].slice(0, 20),
            };
          });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });

          addNotification({
            type: data.type || "info",
            message: data.message,
            repo: data.repo || "system",
          });
        }
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };
    return () => {
      eventSource.close();
    };
  }, [queryClient, addNotification]);

  const handleMarkAsRead = async (id: string) => {
    try {
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: Math.max(0, (old.unreadCount || 0) - 1),
          notifications: old.notifications.map((n: any) =>
            n.id === id ? { ...n, read: true } : n
          ),
        };
      });

      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: 0,
          notifications: old.notifications.map((n: any) => ({ ...n, read: true })),
        };
      });

      await fetch("/api/notifications", {
        method: "PATCH",
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.read) {
      await handleMarkAsRead(n.id);
    }
    setNotificationsOpen(false);
    let targetUrl = "/dashboard";
    if (n.type === "sync_failure") {
      targetUrl = "/dashboard/repositories";
    } else if (n.type === "pr_context" && n.repoId) {
      targetUrl = `/repos/${n.repoId}/prs`;
    } else if (n.type === "milestone" && n.repoId) {
      targetUrl = `/repos/${n.repoId}/memory`;
    }
    router.push(targetUrl);
  };

  useEffect(() => {
    if (!selectedRepo && repos.length > 0) {
      setSelectedRepo(repos[0].fullName);
    }
  }, [selectedRepo, setSelectedRepo, repos]);

  const getPageTitle = (path: string) => {
    if (path === "/dashboard") return "Overview";
    if (path.includes("/graph")) return "Knowledge Graph";
    if (path.includes("/chat")) return "Chat";
    if (path.includes("/insights") || path.includes("/prs")) return "PR Insights";
    if (path.includes("/health") || path.includes("/memory")) return "Memory Evolution";
    if (path.includes("/settings")) return "Settings";
    if (path.includes("/repositories")) return "Repositories";
    return "Overview";
  };

  const orgName = selectedRepo ? selectedRepo.split("/")[0] : "org";
  const repoShortName = selectedRepo ? selectedRepo.split("/")[1] || selectedRepo : null;
  const currentPage = getPageTitle(pathname);

  const breadcrumbSegments = [
    { label: orgName, muted: true },
    ...(repoShortName ? [{ label: repoShortName, muted: true }] : []),
    { label: currentPage, muted: false },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SYNCED":
        return "bg-[#3DD68C]";
      case "SYNCING":
        return "bg-[#F2B84B]";
      case "FAILED":
        return "bg-[#F2596E]";
      default:
        return "bg-[#5C5C64]";
    }
  };

  const filteredRepos = repos.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRepoObj = repos.find(r => r.fullName === selectedRepo);
  const isSyncing = activeRepoObj?.status === "SYNCING" || (selectedRepo && selectedRepo.toLowerCase().includes("tailwind"));

  return (
    <>
      <motion.header
        animate={{
          boxShadow: isScrolled
            ? "0 4px 12px rgba(33,0,93,0.03)"
            : "none"
        }}
        transition={{ duration: 0.2 }}
        className="sticky top-0 z-[100] h-16 w-full bg-[#FBFAFE]/80 backdrop-blur-md border-b border-[#E4E1EC] flex items-center justify-between px-6 md:px-8 select-none"
      >
        {/* ─── LEFT: Logo & Route Breadcrumb ─── */}
        <div className="flex items-center gap-2 min-w-0 relative animate-in fade-in duration-200">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMobileSidebar();
            }}
            className="p-1.5 rounded-lg border border-[#E4E1EC] text-[#49454F] hover:text-[#6E56F2] hover:bg-[#F0ECF5] lg:hidden shrink-0 cursor-pointer transition-colors"
          >
            <Menu className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <div className="shrink-0 hidden sm:flex items-center text-[#6E56F2] ml-1">
            <StackIcon size={18} />
          </div>

          <div className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-[#1C1B1F] ml-1 sm:ml-2">
            {repoShortName && (
              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-[#79747E] font-medium text-[11px] truncate max-w-[80px]" title={orgName}>
                  {orgName}
                </span>
                <SlashIcon />
              </div>
            )}
            <span className="truncate bg-[#F5F2FA]/50 border border-[#E4E1EC] rounded-full px-2.5 py-0.5 leading-none">
              {currentPage}
            </span>
          </div>
        </div>

        {/* ─── CENTER: Borderless Search trigger ─── */}
        <div className="flex-1 flex justify-center max-w-[120px] sm:max-w-[200px]">
          <button
            onClick={() => setSearchOpen(true)}
            className="group flex items-center gap-1.5 cursor-pointer text-[#49454F] hover:text-[#6E56F2] transition-colors"
          >
            <MagnifierIcon className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium hidden sm:inline">Search</span>
          </button>
        </div>

        {/* ─── RIGHT: Repo Switcher · Bell · Avatar ─── */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">

          {/* 1. Repo Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 p-1 px-2 rounded-full hover:bg-[#F0ECF5] cursor-pointer transition-all active:scale-95 border border-transparent hover:border-[#E4E1EC] text-[#49454F] hover:text-[#6E56F2]"
              title="Switch repository"
            >
              <motion.span
                animate={isSyncing ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
                transition={isSyncing ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : undefined}
                className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(activeRepoObj?.status || "SYNCED")}`}
              />
              <span className="text-xs font-semibold max-w-[80px] truncate hidden sm:inline-block">
                {repoShortName || "Select Repo"}
              </span>
              <DownChevron isOpen={dropdownOpen} size={12} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-[-40px] mt-2.5 w-60 bg-[#F0ECF5] border border-[#E4E1EC] rounded-xl shadow-m3-l1 overflow-hidden z-[60]"
                >
                  <div className="p-2 border-b border-[#E4E1EC] flex items-center gap-2 bg-[#F0ECF5]">
                    <MagnifierIcon className="h-3.5 w-3.5 text-[#49454F]" />
                    <input
                      type="text"
                      placeholder="Search repos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xs text-[#1C1B1F] placeholder-[#49454F] border-none outline-none ring-0 focus:ring-0"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                    {filteredRepos.length > 0 ? (
                      filteredRepos.map((repo) => (
                        <button
                          key={repo.fullName}
                          onClick={() => {
                            handleRepoSwitch(repo.fullName);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${selectedRepo === repo.fullName
                              ? "bg-[#EBE7FF] text-[#21005D] border border-[#EBE7FF]"
                              : "text-[#1C1B1F] hover:bg-[#F0ECF5]"
                            }`}
                        >
                          <span className="truncate">{repo.fullName}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`h-2 w-2 rounded-full ${getStatusColor(repo.status)}`} />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-xs text-[#49454F] p-4 text-center">No repos found</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Notifications Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-1.5 rounded-full hover:bg-[#F0ECF5] text-[#49454F] hover:text-[#6E56F2] transition-colors cursor-pointer relative border border-transparent hover:border-[#E4E1EC]"
              title="Notifications"
            >
              {unreadCount > 0 ? (
                <FilledBellIcon size={14} />
              ) : (
                <BellIcon size={14} />
              )}

              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#6E56F2] text-[8px] font-bold text-white flex items-center justify-center ring-2 ring-[#F0ECF5] z-10"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-[-20px] mt-2.5 w-72 md:w-80 bg-[#F0ECF5] border border-[#E4E1EC] rounded-xl shadow-m3-l1 overflow-hidden z-[60] p-3 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#E4E1EC] pb-2">
                    <span className="text-[10px] font-bold text-[#1C1B1F] uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-bold text-[#6E56F2] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="h-3 w-3" strokeWidth={1.5} />
                        <span>Mark all as read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notificationsList.length > 0 ? (
                      notificationsList.map((n: any) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-2.5 rounded-lg border text-xs flex gap-3.5 transition-all cursor-pointer relative hover:scale-[1.01] active:scale-95 ${n.read
                              ? "bg-[#F5F2FA]/50 border-[#E4E1EC] text-[#49454F]"
                              : "bg-[#EBE7FF] border-[#6E56F2]/20 border-l-4 border-l-[#6E56F2] text-[#21005D]"
                            }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <p className="font-medium leading-relaxed break-words">{n.message}</p>
                            <span className="text-[9px] text-[#79747E]">{formatRelativeTime(n.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-[#79747E] py-8 text-center">No notifications yet</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. User Avatar */}
          <div className="relative shrink-0 flex items-center">
            <div className="h-7 w-7 rounded-full border border-[#E4E1EC] overflow-hidden flex items-center justify-center bg-[#2bee4b] text-[#0d1117] text-[10px] font-bold">
              {user?.image ? (
                <img src={user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "M"
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full bg-[#3DD68C] ring-2 ring-[#F0ECF5] z-10" />
          </div>
        </div>
      </motion.header>

      {/* ─── COMMAND PALETTE SEARCH MODAL ─── */}
      <AnimatePresence>
        {searchOpen && (
          <div
            className="fixed inset-0 bg-[#1C1B1F]/35 backdrop-blur-md z-[9999] flex items-start justify-center pt-[15vh] px-4 cursor-default"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl overflow-hidden shadow-m3-l3 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3.5 border-b border-[#E4E1EC] flex items-center gap-3">
                <Search className="h-4 w-4 text-[#49454F]" strokeWidth={1.5} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search repos, PRs, decisions..."
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#1C1B1F] placeholder-[#49454F] border-none outline-none ring-0 focus:ring-0 focus:outline-none"
                />
                <span className="text-[10px] text-[#49454F] border border-[#E4E1EC] px-2 py-0.5 rounded bg-[#F0ECF5] font-mono leading-none">ESC</span>
              </div>

              <div className="max-h-[350px] overflow-y-auto p-2 space-y-4">
                {repos.filter(r => commandQuery === "" || r.fullName.toLowerCase().includes(commandQuery.toLowerCase())).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-[#49454F] px-2.5 uppercase tracking-wider">Repositories</div>
                    {repos
                      .filter(r => commandQuery === "" || r.fullName.toLowerCase().includes(commandQuery.toLowerCase()))
                      .map((repo) => (
                        <button
                          key={repo.fullName}
                          onClick={() => {
                            handleRepoSwitch(repo.fullName);
                            setSearchOpen(false);
                            setCommandQuery("");
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-[#1C1B1F] hover:bg-[#F0ECF5] flex items-center justify-between group transition-colors animate-none"
                        >
                          <div className="flex items-center gap-2">
                            <GitBranch className="w-3.5 h-3.5 text-[#6E56F2]" strokeWidth={1.5} />
                            <span className="font-medium">{repo.fullName}</span>
                          </div>
                          <span className="text-[10px] text-[#79747E] group-hover:text-[#1C1B1F] transition-colors">Select repo</span>
                        </button>
                      ))}
                  </div>
                )}

                {searchPRs.filter(pr => commandQuery === "" || pr.title.toLowerCase().includes(commandQuery.toLowerCase()) || pr.repo.toLowerCase().includes(commandQuery.toLowerCase())).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-[#49454F] px-2.5 uppercase tracking-wider">Pull Requests</div>
                    {searchPRs
                      .filter(pr => commandQuery === "" || pr.title.toLowerCase().includes(commandQuery.toLowerCase()) || pr.repo.toLowerCase().includes(commandQuery.toLowerCase()))
                      .map((pr) => (
                        <a
                          key={pr.id}
                          href={`/repos/${pr.repo.replace("/", "-")}/prs/${pr.id}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setCommandQuery("");
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-[#1C1B1F] hover:bg-[#F0ECF5] flex items-center justify-between group transition-colors block"
                        >
                          <span className="font-medium truncate max-w-[280px]">{pr.title}</span>
                          <span className="text-[10px] text-[#79747E] font-mono shrink-0">{pr.repo}</span>
                        </a>
                      ))}
                  </div>
                )}

                {searchDecisions.filter(dec => commandQuery === "" || dec.title.toLowerCase().includes(commandQuery.toLowerCase())).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-[#49454F] px-2.5 uppercase tracking-wider">Decisions</div>
                    {searchDecisions
                      .filter(dec => commandQuery === "" || dec.title.toLowerCase().includes(commandQuery.toLowerCase()))
                      .map((dec) => (
                        <button
                          key={dec.title}
                          onClick={() => {
                            setSearchOpen(false);
                            setCommandQuery("");
                            window.location.href = "/";
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-[#1C1B1F] hover:bg-[#F0ECF5] flex items-center justify-between group transition-colors"
                        >
                          <span className="font-medium truncate max-w-[280px]">{dec.title}</span>
                          <span className="text-[10px] text-[#49454F] font-semibold">{dec.year}</span>
                        </button>
                      ))}
                  </div>
                )}

                {repos.filter(r => commandQuery === "" || r.fullName.toLowerCase().includes(commandQuery.toLowerCase())).length === 0 &&
                  searchPRs.filter(pr => commandQuery === "" || pr.title.toLowerCase().includes(commandQuery.toLowerCase()) || pr.repo.toLowerCase().includes(commandQuery.toLowerCase())).length === 0 &&
                  searchDecisions.filter(dec => commandQuery === "" || dec.title.toLowerCase().includes(commandQuery.toLowerCase())).length === 0 && (
                    <div className="text-center py-8 text-xs text-[#79747E]">No results matching "{commandQuery}"</div>
                  )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
