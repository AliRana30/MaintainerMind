"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDashboardStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboardIcon,
  GithubIcon,
  BrainCircuitIcon,
  ChartLineIcon,
  MessageCircleIcon,
  GearIcon,
  MagnifierIcon,
} from "@/components/icons/itshover-icons";
import {
  ChevronLeft,
  Command as CommandIcon,
  Sparkles,
  Terminal,
  X
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Command } from "cmdk";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const {
    sidebarCollapsed,
    toggleSidebar,
    cmdkOpen,
    setCmdkOpen,
    selectedRepo,
    setSelectedRepo,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useDashboardStore();

  const [repos, setRepos] = useState<any[]>([]);



  useEffect(() => {
    async function fetchRepos() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          if (data.recentEvents) {
            const uniqueRepos = Array.from(
              new Map(
                data.recentEvents.map((e: any) => [
                  e.repoFullName || e.repo,
                  { name: e.repoName || e.repo, fullName: e.repoFullName || e.repo }
                ])
              ).values()
            );
            setRepos(uniqueRepos);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchRepos();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdkOpen(!cmdkOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cmdkOpen, setCmdkOpen]);
  const iconRefs = useRef<{ [key: string]: any }>({});

  const navItems: NavItem[] = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboardIcon },
    { name: "Repositories", href: "/dashboard/repositories", icon: GithubIcon },
    { name: "Knowledge Graph", href: "/dashboard/graph", icon: BrainCircuitIcon },
    { name: "PR Insights", href: "/dashboard/insights", icon: ChartLineIcon },
    { name: "Chat", href: "/dashboard/chat", icon: MessageCircleIcon },
    { name: "Settings", href: "/dashboard/settings", icon: GearIcon },
  ];

  useEffect(() => {
    navItems.forEach((item) => {
      const ref = iconRefs.current[item.name];
      if (ref) {
        if (pathname === item.href) {
          ref.start();
        } else {
          ref.stop();
        }
      }
    });
  }, [pathname]);

  return (
    <>
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileSidebarOpen(false);
            }}
            className="fixed inset-0 bg-[#06090f]/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed lg:static left-0 top-0 bottom-0 h-screen bg-[#F5F2FA] border-r border-[#E4E1EC] flex flex-col justify-between z-50 select-none shrink-0 transition-transform duration-150 ease-out lg:translate-x-0 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:w-20" : "lg:w-[260px]"} w-[260px]`}>
        <div className="flex flex-col h-full">
          <div className="h-16 border-b border-[#E4E1EC] flex items-center px-4 justify-between overflow-hidden">
            <Link href="/dashboard" className="flex items-center gap-3 group min-w-0" onClick={() => setMobileSidebarOpen(false)}>
              <img
                src="/MaintainerMind.png"
                alt="MaintainerMind"
                className="w-7 h-7 rounded-lg object-contain shrink-0"
              />
              {(!sidebarCollapsed || mobileSidebarOpen) && (
                <span className="font-semibold text-[#1C1B1F] tracking-tight text-sm whitespace-nowrap">
                  MaintainerMind
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMobileSidebarOpen(false);
                }}
                className="p-1.5 rounded-lg border border-[#E4E1EC] text-[#1C1B1F] hover:bg-[#F0ECF5] transition-colors duration-150 ease-out cursor-pointer lg:hidden"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>

              {(!sidebarCollapsed || mobileSidebarOpen) && (
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg border border-[#E4E1EC] text-[#1C1B1F] hover:bg-[#F0ECF5] transition-colors duration-150 ease-out cursor-pointer hidden lg:block"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>

          <div className="p-3">
            <button
              onClick={() => setCmdkOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#F0ECF5] border border-[#E4E1EC] hover:border-[#6E56F2] text-[#1C1B1F] transition-all duration-150 ease-out text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MagnifierIcon className="h-4 w-4 text-[#49454F] shrink-0" />
                {(!sidebarCollapsed || mobileSidebarOpen) && <span className="truncate text-xs font-normal text-[#49454F]">Search...</span>}
              </div>
              {(!sidebarCollapsed || mobileSidebarOpen) && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#F5F2FA]/50 border border-[#E4E1EC] text-[10px] font-mono text-[#49454F] shrink-0">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              )}
            </button>
          </div>

          <nav className="px-3 space-y-1 flex-1 mt-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <div key={item.name} className="relative group/nav">
                  <Link
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center rounded-full text-xs font-medium transition-all duration-150 ease-out cursor-pointer ${sidebarCollapsed && !mobileSidebarOpen
                        ? "flex-col justify-center py-2 px-1"
                        : "flex-row py-2.5 px-4 gap-3"
                      } ${isActive
                        ? "bg-[#EBE7FF] text-[#21005D]"
                        : "bg-transparent text-[#49454F] hover:bg-[#F0ECF5] hover:text-[#1C1B1F]"
                      }`}
                  >
                    <Icon 
                      ref={(el: any) => {
                        if (el) iconRefs.current[item.name] = el;
                      }}
                      className={`h-4.5 w-4.5 shrink-0 transition-colors duration-150 ease-out ${isActive ? "text-[#21005D]" : "text-[#49454F] group-hover/nav:text-[#1C1B1F]"}`} 
                    />
                    {(!sidebarCollapsed || mobileSidebarOpen) ? (
                      <span className="text-sm font-medium tracking-tight truncate flex-1">
                        {item.name}
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium tracking-tighter text-center mt-1">
                        {item.name}
                      </span>
                    )}
                  </Link>

                  {sidebarCollapsed && !mobileSidebarOpen && (
                    <div className="absolute left-20 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-[#F0ECF5] border border-[#E4E1EC] text-[#1C1B1F] text-xs font-medium rounded-lg shadow-m3-l1 opacity-0 scale-90 group-hover/nav:opacity-100 group-hover/nav:scale-100 transition-all duration-150 ease-out pointer-events-none z-50 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {sidebarCollapsed && !mobileSidebarOpen && (
          <div className="px-3 py-3 lg:flex justify-center border-t border-[#E4E1EC] hidden">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg border border-[#E4E1EC] bg-[#F0ECF5] text-[#1C1B1F] hover:bg-[#EBE7FF] transition-colors duration-150 ease-out cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" strokeWidth={1.5} />
            </button>
          </div>
        )}

        <div className="p-3 border-t border-[#E4E1EC] bg-[#F0ECF5] flex items-center justify-between min-h-[64px]">
          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
            <div className="shrink-0">
              {user ? (
                <div className="w-8 h-8 rounded-full bg-[#2bee4b] flex items-center justify-center text-[#0d1117] text-xs font-bold border border-[#E4E1EC]">
                  {user.image ? (
                    <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name?.charAt(0).toUpperCase() || "M"
                  )}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#EBE7FF] flex items-center justify-center text-[#49454F] text-xs font-bold border border-[#E4E1EC]">
                  M
                </div>
              )}
            </div>
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#1C1B1F] truncate">
                  {user?.name || "Maintainer"}
                </p>
                <p className="text-[10px] text-[#49454F] truncate flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#2bee4b]" strokeWidth={1.5} />
                  <span>Maintainer</span>
                </p>
              </div>
            )}
          </div>
          {user && (!sidebarCollapsed || mobileSidebarOpen) && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[10px] font-semibold text-[#49454F] hover:text-[#842029] hover:underline shrink-0 pl-1 cursor-pointer transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
