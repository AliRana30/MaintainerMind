"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

const SPRING_CTA = { type: "spring", stiffness: 400, damping: 20 } as const;
const SPRING_MENU = { type: "spring", stiffness: 300, damping: 28 } as const;

function BrainNetworkLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M16 6C12 6 9 9 9 13C9 15.5 10.5 17.5 11 19C11.5 20.5 11 22 13 23.5C14.5 24.5 15.5 25.5 16 26.5" stroke="#2bee4b" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 6C20 6 23 9 23 13C23 15.5 21.5 17.5 21 19C20.5 20.5 21 22 19 23.5C17.5 24.5 16.5 25.5 16 26.5" stroke="#2bee4b" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="6" x2="16" y2="26" stroke="#2bee4b" strokeWidth="2" strokeDasharray="2 2" />
      <circle cx="16" cy="6" r="2.5" fill="#0d1117" stroke="#2bee4b" strokeWidth="1.5" />
      <circle cx="9" cy="13" r="2" fill="#2bee4b" />
      <circle cx="23" cy="13" r="2" fill="#2bee4b" />
    </svg>
  );
}

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
];

export default function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const isSignedIn = !!session;
  const user = session?.user;
  const pathname = usePathname();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const id = href.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        setActiveSection(href);
      }
    }
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const sections = ["features", "architecture"];
    const observers: IntersectionObserver[] = [];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(`#${id}`);
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <>
      {/* ─── Sticky Header ─────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-2xl bg-[#0d1117]/80 border-b border-[#30363d]/60 shadow-[0_1px_0_rgba(43,238,75,0.04)]"
            : "backdrop-blur-xl bg-[#0d1117]/60 border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group cursor-pointer"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <div className="h-8 w-8 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#2bee4b] shadow-[0_0_15px_rgba(43,238,75,0.12)] group-hover:border-[#2bee4b]/40 transition-colors duration-200">
              <BrainNetworkLogo className="h-5 w-5" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-white">
              Maintainer<span className="text-[#2bee4b]">Mind</span>
            </span>
          </Link>

          {/* ── Desktop Pill Nav ── */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center gap-1 bg-[#161b22]/80 border border-[#30363d]/60 rounded-full px-2 py-1.5 backdrop-blur-sm">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.href;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="relative px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer group"
                    style={{ color: isActive ? "#ffffff" : "#8b949e" }}
                    onClick={(e) => handleNavClick(e, link.href)}
                  >
                    {/* Active indicator — pill on top */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px w-8 h-[3px] rounded-full bg-[#e6edf3]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {/* Active background pill */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-bg"
                        className="absolute inset-0 rounded-full bg-white/[0.06]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 group-hover:text-white transition-colors duration-150">
                      {link.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </nav>

          {/* ── Desktop CTA ── */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <>
                    <motion.div whileHover={{ scale: 1.03 }} transition={SPRING_CTA}>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#8b949e] hover:text-white transition-colors duration-150 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </motion.div>
                    <div className="w-px h-5 bg-[#30363d]" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-8 h-8 rounded-full border border-[#30363d] hover:border-[#2bee4b]/50 transition-colors cursor-pointer overflow-hidden flex items-center justify-center bg-[#161b22]"
                      title="Sign Out"
                    >
                      <img src={user?.image || "https://github.com/identicons/maintainermind.png"} alt={user?.name || "User"} className="w-full h-full object-cover" />
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <button className="text-sm font-semibold text-[#8b949e] hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all duration-150 cursor-pointer">
                        Sign In
                      </button>
                    </Link>
                    <motion.div whileHover={{ scale: 1.04 }} transition={SPRING_CTA}>
                      <Link
                        href="/signup"
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#2bee4b] text-[#0d1117] font-bold text-sm rounded-full shadow-[0_0_18px_#2bee4b40] hover:shadow-[0_0_28px_#2bee4b70] hover:bg-[#25d444] transition-all duration-150 whitespace-nowrap cursor-pointer"
                      >
                        Start Free
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </motion.div>
                  </>
                )}
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {isLoaded && isSignedIn && (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-7 h-7 rounded-full border border-[#30363d] cursor-pointer overflow-hidden flex items-center justify-center bg-[#161b22]"
              >
                <img src={user?.image || "https://github.com/identicons/maintainermind.png"} alt={user?.name || "User"} className="w-full h-full object-cover" />
              </button>
            )}
            <motion.button
              onClick={() => setMobileOpen((v) => !v)}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-lg bg-[#161b22] border border-[#21262d] flex items-center justify-center text-[#8b949e] hover:text-white hover:border-[#30363d] transition-colors duration-150 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ─── Spacer to prevent content from hiding under fixed header ─── */}
      <div className="h-16" />

      {/* ─── Mobile Menu Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-[#0d1117]/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={SPRING_MENU}
              className="fixed top-16 left-0 right-0 z-50 md:hidden bg-[#0d1117]/95 backdrop-blur-2xl border-b border-[#30363d]/60 shadow-2xl shadow-black/40"
            >
              <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
                {NAV_LINKS.map((link, idx) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => { setMobileOpen(false); handleNavClick(e, link.href); }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-[#e6edf3] hover:bg-[#161b22] hover:text-white transition-colors duration-150 cursor-pointer"
                  >
                    {link.label}
                    <ChevronRight className="w-4 h-4 text-[#484f58]" />
                  </motion.a>
                ))}

                {isLoaded && (
                  <div className="flex flex-col gap-2 pt-1 pb-2">
                    {isSignedIn ? (
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#161b22] border border-[#21262d] hover:border-[#2bee4b]/30 transition-colors duration-150 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#2bee4b]" />
                        Go to Dashboard
                        <ChevronRight className="w-4 h-4 ml-auto text-[#484f58]" />
                      </Link>
                    ) : (
                      <>
                        <Link href="/login">
                          <button
                            onClick={() => setMobileOpen(false)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[#e6edf3] bg-[#161b22] border border-[#21262d] hover:border-[#30363d] transition-colors duration-150 cursor-pointer"
                          >
                            Sign In
                          </button>
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-[#0d1117] bg-[#2bee4b] hover:bg-[#25d444] shadow-[0_0_20px_#2bee4b30] transition-all duration-150 cursor-pointer"
                        >
                          Start Free
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
