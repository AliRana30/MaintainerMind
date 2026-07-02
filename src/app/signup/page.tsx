"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { GithubIcon } from "@/components/icons/itshover-icons";
import { motion, AnimatePresence } from "framer-motion";
import { StackIcon, SatelliteDishIcon } from "@/components/icons/itshover-icons";
import AuthVisual from "@/components/auth/AuthVisual";
import { Plus } from "lucide-react";

const MOCK_REPOS = [
  { id: "repo-1", fullName: "cognee/cognee", description: "Cognitive graphs for LLMs and AI memory." },
  { id: "repo-2", fullName: "facebook/react", description: "The library for web and native user interfaces." },
  { id: "repo-3", fullName: "tailwindlabs/tailwindcss", description: "A utility-first CSS framework." },
  { id: "repo-4", fullName: "vercel/next.js", description: "The React Framework for the Web." },
  { id: "repo-5", fullName: "octokit/rest.js", description: "GitHub REST API client for Node.js." },
  { id: "repo-6", fullName: "prisma/prisma", description: "Next-generation ORM for Node.js & TypeScript." },
];

const signUpSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});
type SignUpFormValues = z.infer<typeof signUpSchema>;

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStepParam = searchParams.get("step");
  
  // Stepper state: 1 (Connect GitHub), 2 (Select Repos), 3 (Initial Sync)
  const [step, setStep] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<string[]>(["repo-1"]); // Default select cognee
  const [syncProgress, setSyncProgress] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState("");
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting: isFormSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const [customRepoName, setCustomRepoName] = useState("");
  const [repoList, setRepoList] = useState(MOCK_REPOS);

  // References for itshover icons
  const logoRef = useRef<any>(null);

  // Handle URL step injection (e.g. from Clerk redirect)
  useEffect(() => {
    if (initialStepParam === "2") {
      setStep(2);
    }
  }, [initialStepParam]);

  const handleAddCustomRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRepoName.trim() || !customRepoName.includes("/")) return;

    const newId = `custom-${Date.now()}`;
    const newRepo = {
      id: newId,
      fullName: customRepoName.trim(),
      description: "Custom repository added by you.",
    };

    setRepoList((prev) => [newRepo, ...prev]);
    setSelectedRepos((prev) => [...prev, newId]);
    setCustomRepoName("");
  };

  const handleOAuthSignIn = (provider: "github" | "google") => {
    if (provider === "github") setIsGithubLoading(true);
    if (provider === "google") setIsGoogleLoading(true);
    signIn(provider, { callbackUrl: "/signup?step=2" });
  };

  const onSubmitAuth = async (data: SignUpFormValues) => {
    setAuthErrorMsg("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setAuthErrorMsg(errorData.error || "Failed to register");
        return;
      }

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (loginRes?.error) {
        setAuthErrorMsg("Account created but failed to sign in automatically");
      } else {
        router.push("/signup?step=2");
        setStep(2);
      }
    } catch (err) {
      setAuthErrorMsg("An unexpected error occurred");
    }
  };

  const handleRepoSelectionToggle = (id: string) => {
    setSelectedRepos((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const startInitialSync = async () => {
    setIsSubmitting(true);
    try {
      const selectedNames = selectedRepos.map(
        (id) => repoList.find((r) => r.id === id)!.fullName
      );

      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repos: selectedNames }),
      });

      if (!res.ok) {
        throw new Error("Failed to initialize repository syncing");
      }

      setStep(3);

      // Initialize progress map
      const initialProgress: Record<string, number> = {};
      selectedRepos.forEach((id) => {
        initialProgress[id] = 0;
      });
      setSyncProgress(initialProgress);
    } catch (err) {
      console.error("Onboarding repos connector error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate progress increment for Step 3
  useEffect(() => {
    if (step !== 3) return;

    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        const updated = { ...prev };
        let allDone = true;

        Object.keys(updated).forEach((id) => {
          if (updated[id] < 100) {
            updated[id] += Math.floor(Math.random() * 20) + 10;
            if (updated[id] > 100) updated[id] = 100;
            allDone = false;
          }
        });

        if (allDone) {
          clearInterval(interval);
          setTimeout(() => {
            router.push("/dashboard");
          }, 1200);
        }

        return updated;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [step, router]);

  const filteredRepos = repoList.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full flex bg-[#FBFAFE] text-[#1C1B1F] overflow-hidden">
      
      {/* LEFT PANEL: Auth / Stepper form (45% Width) */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12 relative z-10">
        
        {/* Mobile-Only Rotating Headline Strip */}
        <div className="block lg:hidden w-full mb-8 bg-[#F0ECF5] text-[#49454F] py-2.5 px-4 rounded-lg text-[11px] font-mono text-center border border-[#E4E1EC]">
          ✨ "Context before you open the diff."
        </div>

        <div className="w-full max-w-[400px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="space-y-2 text-left">
            <div 
              className="flex items-center gap-2 text-[#2bee4b] cursor-pointer w-fit"
              onMouseEnter={() => logoRef.current?.start()}
              onMouseLeave={() => logoRef.current?.stop()}
            >
              <StackIcon ref={logoRef} size={24} color="#2bee4b" />
              <span className="font-bold text-[16px] tracking-tight">MaintainerMind</span>
            </div>
            
            {step === 1 && (
              <>
                <h1 className="text-[24px] font-semibold text-[#1C1B1F] tracking-tight pt-2">
                  Create your workspace
                </h1>
                <p className="text-[14px] text-[#49454F]">
                  Connect your first repository in under 2 minutes
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-[24px] font-semibold text-[#1C1B1F] tracking-tight pt-2">
                  Select repositories
                </h1>
                <p className="text-[14px] text-[#49454F]">
                  Choose which repositories to build memory structures for
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-[24px] font-semibold text-[#1C1B1F] tracking-tight pt-2 flex items-center gap-2">
                  Building memory...
                </h1>
                <p className="text-[14px] text-[#49454F]">
                  Ingesting pull requests and commits using Cognee Cloud
                </p>
              </>
            )}
          </div>

          {/* Onboarding Stepper Indicator */}
          <div className="flex items-center justify-between gap-2 py-2 border-y border-[#E4E1EC]">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                step >= 1 ? "bg-[#2bee4b] text-[#0d1117] border-[#2bee4b]" : "bg-transparent text-[#79747E] border-[#E4E1EC]"
              }`}>
                {step > 1 ? "✓" : "1"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#49454F]">Connect</span>
            </div>
            <div className="h-[1px] flex-1 bg-[#E4E1EC]" />
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                step >= 2 ? "bg-[#2bee4b] text-[#0d1117] border-[#2bee4b]" : "bg-transparent text-[#79747E] border-[#E4E1EC]"
              }`}>
                {step > 2 ? "✓" : "2"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#49454F]">Select</span>
            </div>
            <div className="h-[1px] flex-1 bg-[#E4E1EC]" />
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                step === 3 ? "bg-[#2bee4b] text-[#0d1117] border-[#2bee4b]" : "bg-transparent text-[#79747E] border-[#E4E1EC]"
              }`}>
                3
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#49454F]">Sync</span>
            </div>
          </div>

          {/* Stepper Content Routing */}
          <div className="space-y-4 pt-2">
            
            {/* STEP 1: Connect / SignUp with Clerk */}
            {step === 1 && (
              <div className="w-full flex justify-center flex-col space-y-3">
                <button
                  onClick={() => handleOAuthSignIn("github")}
                  disabled={isGithubLoading || isGoogleLoading || isFormSubmitting}
                  className="w-full h-10 flex items-center justify-center gap-2 bg-[#1C1B1F] hover:bg-[#2C2C30] text-white font-semibold text-xs rounded-xl shadow-m3-l1 transition-colors disabled:opacity-50"
                >
                  {isGithubLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GithubIcon size={16} />}
                  Continue with GitHub
                </button>
                <button
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={isGithubLoading || isGoogleLoading || isFormSubmitting}
                  className="w-full h-10 flex items-center justify-center gap-2 border border-[#E4E1EC] bg-[#FBFAFE] hover:bg-[#F0ECF5] text-[#1C1B1F] font-semibold text-xs rounded-xl shadow-m3-l1 transition-colors disabled:opacity-50"
                >
                  {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#1C1B1F]" /> : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google
                </button>

                <div className="flex items-center my-6">
                  <div className="flex-1 bg-[#E4E1EC] h-px"></div>
                  <span className="px-3 text-[10px] font-mono uppercase text-[#79747E] tracking-wider">
                    or continue with email
                  </span>
                  <div className="flex-1 bg-[#E4E1EC] h-px"></div>
                </div>

                <form onSubmit={handleSubmit(onSubmitAuth)} className="space-y-4">
                  {authErrorMsg && (
                    <div className="p-3 bg-[#842029]/10 border border-[#842029]/20 rounded-lg text-xs font-semibold text-[#842029]">
                      {authErrorMsg}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#49454F] uppercase tracking-wider block">Full Name</label>
                    <input
                      {...registerForm("name")}
                      type="text"
                      placeholder="Jane Doe"
                      className="w-full h-10 px-3 bg-[#FBFAFE] border border-[#E4E1EC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] outline-none transition-all duration-150 focus:border-[#2bee4b] focus:ring-0 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#49454F] uppercase tracking-wider block">Email Address</label>
                    <input
                      {...registerForm("email")}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full h-10 px-3 bg-[#FBFAFE] border border-[#E4E1EC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] outline-none transition-all duration-150 focus:border-[#2bee4b] focus:ring-0 focus:outline-none"
                    />
                    {formErrors.email && <p className="text-[10px] text-[#842029] font-medium">{formErrors.email.message}</p>}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#49454F] uppercase tracking-wider block">Password</label>
                    <input
                      {...registerForm("password")}
                      type="password"
                      placeholder="••••••••"
                      className="w-full h-10 px-3 bg-[#FBFAFE] border border-[#E4E1EC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] outline-none transition-all duration-150 focus:border-[#2bee4b] focus:ring-0 focus:outline-none"
                    />
                    {formErrors.password && <p className="text-[10px] text-[#842029] font-medium">{formErrors.password.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isGithubLoading || isGoogleLoading || isFormSubmitting}
                    className="w-full h-10 mt-2 bg-gradient-to-b from-[#2bee4b] to-[#25d444] hover:opacity-95 text-[#0d1117] text-xs font-bold rounded-full transition-all cursor-pointer shadow-m3-l1 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isFormSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
                  </button>
                </form>

                <p className="text-xs text-[#49454F] text-center mt-6">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#2bee4b] hover:underline font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            )}

            {/* STEP 2: Select Repositories */}
            {step === 2 && (
              <div className="space-y-6 text-left">
                <div className="bg-[#2bee4b]/10 border border-[#2bee4b]/20 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-[#1C1B1F] uppercase tracking-wider">
                    GitHub App Installation
                  </h3>
                  <p className="text-[12px] text-[#49454F] leading-relaxed">
                    MaintainerMind synchronizes repositories securely using a GitHub App. This lets you select exactly which public or private repositories you want to index, ensuring total control over your code's privacy.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      window.location.href = "/api/github/install";
                    }}
                    className="w-full h-11 bg-gradient-to-b from-[#2bee4b] to-[#25d444] hover:opacity-95 text-[#0d1117] text-xs font-bold rounded-full transition-all duration-150 shadow-m3-l1 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <GithubIcon size={16} />
                    <span>Install GitHub App & Connect Repositories</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push("/dashboard");
                    }}
                    className="w-full h-10 border border-[#E4E1EC] hover:bg-[#F0ECF5] text-[#49454F] hover:text-[#1C1B1F] text-xs font-semibold rounded-full transition-all duration-150 flex items-center justify-center cursor-pointer"
                  >
                    Skip to Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Syncing Progress */}
            {step === 3 && (
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#25d444] justify-center py-2 animate-pulse bg-[#2bee4b]/10 rounded-lg border border-[#2bee4b]/20">
                  <SatelliteDishIcon size={14} color="#25d444" />
                  <span>Cognitive Index Ingestion Triggered</span>
                </div>

                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {selectedRepos.map((id) => {
                    const repo = repoList.find((r) => r.id === id)!;
                    const progress = syncProgress[id] || 0;
                    return (
                      <div key={id} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-[#1C1B1F]">
                          <span className="truncate">{repo.fullName}</span>
                          <span className="font-mono">{progress}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-[#E4E1EC] rounded-full overflow-hidden">
                          <div
                              className="h-full bg-[#2bee4b] transition-all duration-300 ease-out"
                              style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center text-[10px] text-[#79747E] pt-2 italic">
                  Compiling AST nodes and committing vectors to Cognee store...
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* RIGHT PANEL: Live Animated Showcase (55% Width, Dark Base) */}
      <div className="hidden lg:block lg:w-[55%] bg-[#0D1117] border-l border-[#232328] relative">
        <AuthVisual />
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}
