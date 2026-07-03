"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { StackIcon } from "@/components/icons/itshover-icons";
import AuthVisual from "@/components/auth/AuthVisual";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const resetSchema = z.object({
  code: z.string().min(6, { message: "Verification code must be 6 digits" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const logoRef = useRef<any>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: Code & New Password, 3: Success
  const [userEmail, setUserEmail] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onEmailSubmit = async (data: EmailFormValues) => {
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || "Something went wrong. Please try again.");
        return;
      }

      setUserEmail(data.email);
      setDemoCode(result.code);
      setStep(2);
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please check your connection.");
    }
  };

  const onResetSubmit = async (data: ResetFormValues) => {
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          code: data.code,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || "Failed to reset password. Please try again.");
        return;
      }

      setStep(3);
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please check your connection.");
    }
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
              {step === 1 && "Reset your password"}
              {step === 2 && "Enter reset details"}
              {step === 3 && "Password updated!"}
            </h1>
            <p className="text-[13px] text-[#49454F] text-left">
              {step === 1 && "Enter the email associated with your account, and we'll help you recover it."}
              {step === 2 && `Enter the verification code sent to ${userEmail} and choose a new password.`}
              {step === 3 && "Your workspace access has been restored successfully."}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#842029]/10 border border-[#842029]/20 rounded-lg text-xs font-semibold text-[#842029]">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#49454F] uppercase tracking-wider block">
                  Email Address
                </label>
                <input
                  {...emailForm.register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full h-10 px-3 bg-[#FBFAFE] border border-[#E4E1EC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] outline-none transition-all duration-150 focus:border-[#2bee4b] focus:ring-0 focus:outline-none"
                />
                {emailForm.formState.errors.email && (
                  <p className="text-[10px] text-[#842029] font-medium">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="w-full h-10 mt-2 bg-gradient-to-b from-[#2bee4b] to-[#25d444] hover:opacity-95 text-[#0d1117] text-xs font-bold rounded-full transition-all cursor-pointer shadow-m3-l1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {emailForm.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              {demoCode && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-semibold text-emerald-700">
                  ⚡ [DEMO MODE] Reset code sent: <span className="font-bold underline">{demoCode}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#49454F] uppercase tracking-wider block">
                  Verification Code
                </label>
                <input
                  {...resetForm.register("code")}
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="w-full h-10 px-3 bg-[#FBFAFE] border border-[#E4E1EC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] outline-none transition-all duration-150 focus:border-[#2bee4b] focus:ring-0 focus:outline-none tracking-widest font-bold text-center"
                />
                {resetForm.formState.errors.code && (
                  <p className="text-[10px] text-[#842029] font-medium">{resetForm.formState.errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#49454F] uppercase tracking-wider block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...resetForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full h-10 pl-3 pr-10 bg-[#FBFAFE] border border-[#E4E1EC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] outline-none transition-all duration-150 focus:border-[#2bee4b] focus:ring-0 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#79747E] hover:text-[#1C1B1F] transition-colors cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetForm.formState.errors.password && (
                  <p className="text-[10px] text-[#842029] font-medium">{resetForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetForm.formState.isSubmitting}
                className="w-full h-10 mt-2 bg-gradient-to-b from-[#2bee4b] to-[#25d444] hover:opacity-95 text-[#0d1117] text-xs font-bold rounded-full transition-all cursor-pointer shadow-m3-l1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resetForm.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-[#2bee4b] animate-bounce" />
              </div>
              <p className="text-xs text-[#49454F]">
                Your password has been successfully reset. You can now use your new password to sign in.
              </p>
              <Link href="/login" className="block w-full">
                <button className="w-full h-10 bg-[#1C1B1F] hover:bg-[#2C2C30] text-white font-semibold text-xs rounded-xl shadow-m3-l1 transition-colors cursor-pointer">
                  Back to Sign In
                </button>
              </Link>
            </div>
          )}

          {step !== 3 && (
            <p className="text-xs text-[#49454F] text-center mt-6">
              Remember your password?{" "}
              <Link href="/login" className="text-[#2bee4b] hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Live Animated Showcase (55% Width, Dark Base) */}
      <div className="hidden lg:block lg:w-[55%] bg-[#0D1117] border-l border-[#232328] relative">
        <AuthVisual />
      </div>
    </div>
  );
}
