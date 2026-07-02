"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RedirectChatPage() {
  const params = useParams();
  const router = useRouter();
  const repoId = (params?.repoId as string) || "";

  useEffect(() => {
    if (repoId) {
      router.replace(`/chat/${repoId}`);
    } else {
      router.replace("/dashboard/chat");
    }
  }, [repoId, router]);

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-[#FBFAFE]">
      <Loader2 className="w-8 h-8 text-[#0F5132] animate-spin" />
      <span className="text-xs text-[#49454F] font-semibold mt-3">
        Redirecting to secure cognitive chat room...
      </span>
    </div>
  );
}
