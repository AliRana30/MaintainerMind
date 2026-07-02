"use client";

import React, { useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { StackIcon, GithubIcon } from "@/components/icons/itshover-icons";
import AuthVisual from "@/components/auth/AuthVisual";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const logoRef = useRef<any>(null);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl: "/dashboard",
      });

      if (res?.error) {
        setErrorMsg("Invalid email or password");
      } else if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred");
    }
  };

  const handleOAuthSignIn = (provider: "github" | "google") => {
    if (provider === "github") setIsGithubLoading(true);
    if (provider === "google") setIsGoogleLoading(true);
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FBFAFE] text-[#1C1B1F] overflow-hidden">
      {/* LEFT PANEL: Form Interface (45% Width) */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12 relative z-10">
        
        {/* Mobile-Only Rotating Headline Strip */}
        <div className="block lg:hidden w-full mb-8 bg-[#F0ECF5] text-[#49454F] py-2.5 px-4 rounded-lg text-[11px] font-mono text-center border border-[#E4E1EC]">
          ✨ "Context before you open the diff."
        </div>

        <div className="w-full max-w-[400px] mx-auto space-y-6">
          
          {/* Logo Mark + Header */}
          <div className="space-y-2 text-left mb-6">
            <div 
              className="flex items-center gap-2 text-[#2bee4b] cursor-pointer w-fit mb-4"
              onMouseEnter={() => logoRef.current?.start()}
              onMouseLeave={() => logoRef.current?.stop()}
            >
              <StackIcon ref={logoRef} size={24} color="#2bee4b" />
              <span className="font-bold text-[16px] tracking-tight">MaintainerMind</span>
            </div>
            <h1 className="text-[22px] font-bold text-[#1C1B1F] tracking-tight text-left">
              Sign in to MaintainerMind
            </h1>
            <p className="text-[13px] text-[#49454F] text-left">
              Welcome back! Please enter your details.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleOAuthSignIn("github")}
              disabled={isGithubLoading || isGoogleLoading || isSubmitting}
              className="w-full h-10 flex items-center justify-center gap-2 bg-[#1C1B1F] hover:bg-[#2C2C30] text-white font-semibold text-xs rounded-xl shadow-m3-l1 transition-colors disabled:opacity-50"
            >
              {isGithubLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GithubIcon size={16} />
              )}
              Continue with GitHub
            </button>
            <button
              onClick={() => handleOAuthSignIn("google")}
              disabled={isGithubLoading || isGoogleLoading || isSubmitting}
              className="w-full h-10 flex items-center justify-center gap-2 border border-[#E4E1EC] bg-[#FBFAFE] hover:bg-[#F0ECF5] text-[#1C1B1F] font-semibold text-xs rounded-xl shadow-m3-l1 transition-colors disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#1C1B1F]" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-1 bg-[#E4E1EC] h-px"></div>
            <span className="px-3 text-[10px] font-mono uppercase text-[#79747E] tracking-wider">
              or continue with email
            </span>
            <div className="flex-1 bg-[#E4E1EC] h-px"></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-[#842029]/10 border border-[#842029]/20 rounded-lg text-xs font-semibold text-[#842029]">
                {errorMsg}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#49454F] uppercase tracking-wider block">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full h-10 px-3 bg-[#FBFAFE] border border-[#E4E1EC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] outline-none transition-all duration-150 focus:border-[#2bee4b] focus:ring-0 focus:outline-none"
              />
              {errors.email && (
                <p className="text-[10px] text-[#842029] font-medium">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#49454F] uppercase tracking-wider block">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[#2bee4b] hover:underline font-semibold text-[11px]">
                  Forgot password?
                </Link>
              </div>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full h-10 px-3 bg-[#FBFAFE] border border-[#E4E1EC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] outline-none transition-all duration-150 focus:border-[#2bee4b] focus:ring-0 focus:outline-none"
              />
              {errors.password && (
                <p className="text-[10px] text-[#842029] font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isGithubLoading || isGoogleLoading || isSubmitting}
              className="w-full h-10 mt-2 bg-gradient-to-b from-[#2bee4b] to-[#25d444] hover:opacity-95 text-[#0d1117] text-xs font-bold rounded-full transition-all cursor-pointer shadow-m3-l1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <p className="text-xs text-[#49454F] text-center mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#2bee4b] hover:underline font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Live Animated Showcase (55% Width, Dark Base) */}
      <div className="hidden lg:block lg:w-[55%] bg-[#0D1117] border-l border-[#232328] relative">
        <AuthVisual />
      </div>
    </div>
  );
}
