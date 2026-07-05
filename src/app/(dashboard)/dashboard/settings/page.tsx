"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Database,
  Bell,
  Key,
  AlertTriangle,
  Loader2,
  Trash2,
  Copy,
  CheckCircle,
  Settings,
  ShieldAlert,
  GitBranch,
  GithubIcon,
  GitlabIcon,
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type PanelType = "account" | "repositories" | "notifications" | "apikeys" | "dangerzone";

interface UserData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: string;
  preferences: {
    syncFailures: boolean;
    newPRNeedContext: boolean;
    weeklyDigest: boolean;
  };
}

interface Repository {
  id: string;
  name: string;
  fullName: string;
  status: string;
  provider: string;
}

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 28 } as const;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activePanel, setActivePanel] = useState<PanelType>("repositories");

  // State for Account Panel
  const [nameVal, setNameVal] = useState("");
  const [avatarVal, setAvatarVal] = useState("");

  // State for Repositories Panel
  const [repoToDelete, setRepoToDelete] = useState<Repository | null>(null);
  const [confirmRepoName, setConfirmRepoName] = useState("");

  // State for API Keys Panel
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // State for Danger Zone Panel
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");

  // Custom toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 1. Fetch User Data
  const { data: userDataResponse, isLoading: isLoadingUser } = useQuery<{ user: UserData }>({
    queryKey: ["user-settings-data"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to fetch user settings");
      const data = await res.json();
      setNameVal(data.user.name);
      setAvatarVal(data.user.avatarUrl);
      return data;
    },
  });
  const user = userDataResponse?.user;

  // 2. Fetch Connected Repositories
  const { data: reposData, isLoading: isLoadingRepos } = useQuery<any[]>({
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

  // 3. Fetch API Keys
  const { data: keysData, isLoading: isLoadingKeys } = useQuery<{ apiKeys: ApiKey[] }>({
    queryKey: ["settings-api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/api-keys");
      if (!res.ok) throw new Error("Failed to fetch API keys");
      return res.json();
    },
  });
  const apiKeys = keysData?.apiKeys || [];

  // Mutation to update user preferences (notification toggles)
  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<UserData["preferences"]>) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs }),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings-data"] });
      showToast("Notification preferences updated.");
    },
  });

  // Mutation to disconnect a repository
  const disconnectRepoMutation = useMutation({
    mutationFn: async (repoId: string) => {
      const res = await fetch(`/api/repos/${repoId}/disconnect`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to disconnect repository");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      setRepoToDelete(null);
      setConfirmRepoName("");
      showToast("Repository disconnected successfully.");
    },
  });

  // Mutation to generate a new API key
  const generateKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to generate API Key");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["settings-api-keys"] });
      setGeneratedKey(data.rawKey);
      setNewKeyName("");
      showToast("API Key generated successfully.");
    },
  });

  // Mutation to revoke/delete API Key
  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/api-keys?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke API key");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-api-keys"] });
      showToast("API Key revoked successfully.");
    },
  });

  // Mutation to flush Redis Cache
  const flushCacheMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cache/flush", { method: "POST" });
      if (!res.ok) throw new Error("Failed to flush cache");
      return res.json();
    },
    onSuccess: () => {
      showToast("Redis cache flushed successfully!");
    },
  });

  // Mutation to delete account
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      return res.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5132]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-[#0F5132]" />
        <h1 className="text-base font-bold text-[#1C1B1F]">System & User Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-6 shadow-m3-l1 min-h-[500px]">
        {/* ─── LEFT RAIL (md:col-span-3) ─── */}
        <div className="md:col-span-3 flex flex-col gap-1.5 border-r border-[#E4E1EC] pr-4">
          <span className="text-[10px] font-extrabold uppercase text-[#79747E] tracking-wider mb-2 px-3">
            Navigation
          </span>

          {/* Repositories Button */}
          <button
            onClick={() => setActivePanel("repositories")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left relative cursor-pointer ${activePanel === "repositories"
              ? "bg-[#EBE7FF] text-[#6E56F2]"
              : "text-[#49454F] hover:bg-[#F0ECF5]/50"
              }`}
          >
            {activePanel === "repositories" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#6E56F2] rounded-r" />
            )}
            <Database className="w-4 h-4 text-[#6E56F2]" />
            <span>Repositories</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setActivePanel("notifications")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left relative cursor-pointer ${activePanel === "notifications"
              ? "bg-[#EBE7FF] text-[#6E56F2]"
              : "text-[#49454F] hover:bg-[#F0ECF5]/50"
              }`}
          >
            {activePanel === "notifications" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#6E56F2] rounded-r" />
            )}
            <Bell className="w-4 h-4 text-[#6E56F2]" />
            <span>Notifications</span>
          </button>

          {/* API Keys Button */}
          <button
            onClick={() => setActivePanel("apikeys")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left relative cursor-pointer ${activePanel === "apikeys"
              ? "bg-[#EBE7FF] text-[#6E56F2]"
              : "text-[#49454F] hover:bg-[#F0ECF5]/50"
              }`}
          >
            {activePanel === "apikeys" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#6E56F2] rounded-r" />
            )}
            <Key className="w-4 h-4 text-[#6E56F2]" />
            <span>API Credentials</span>
          </button>

          {/* Danger Zone Button */}
          <button
            onClick={() => setActivePanel("dangerzone")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left relative cursor-pointer ${activePanel === "dangerzone"
              ? "bg-[#F8D7DA] text-[#842029]"
              : "text-[#842029] opacity-80 hover:bg-[#F8D7DA]/50"
              }`}
          >
            {activePanel === "dangerzone" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#842029] rounded-r" />
            )}
            <ShieldAlert className="w-4 h-4 text-[#842029]" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* ─── RIGHT CONTENT PANELS (md:col-span-9) ─── */}
        <div className="md:col-span-9 bg-[#FBFAFE] rounded-xl border border-[#E4E1EC] p-5 shadow-inner">
          <AnimatePresence mode="wait">
            {/* PANEL 2: REPOSITORIES */}
            {activePanel === "repositories" && (
              <motion.div
                key="repositories"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={SPRING_SOFT}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-sm font-bold text-[#1C1B1F]">Connected Repositories</h2>
                  <p className="text-[11px] text-[#49454F] mt-0.5">
                    View active repositories connected to Cognee. Disconnecting will delete webhooks and erase cognitive indices.
                  </p>
                </div>

                <div className="space-y-2">
                  {isLoadingRepos ? (
                    <Skeleton className="h-20 w-full" />
                  ) : repos.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#79747E]">
                      No repositories connected.
                    </div>
                  ) : (
                    repos.map((repo) => (
                      <div
                        key={repo.id}
                        className="flex items-center justify-between p-3.5 bg-[#F0ECF5] border border-[#E4E1EC] rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-[#FBFAFE] flex items-center justify-center border border-[#E4E1EC]">
                            {repo.provider === "gitlab" ? (
                              <GitlabIcon size={16} className="text-[#49454F]" />
                            ) : (
                              <GithubIcon size={16} className="text-[#49454F]" />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold block text-[#1C1B1F]">
                              {repo.name || repo.fullName}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-[#0F5132] bg-[#0F5132]/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              {repo.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {repo.status === "SYNCING" && (
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/repos/${repo.id}/force-reset`, { method: "POST" });
                                  if (!res.ok) throw new Error("Failed to reset");
                                  queryClient.invalidateQueries({ queryKey: ["repos"] });
                                } catch (e) {
                                  console.error("Failed to force reset repository.", e);
                                  alert("Failed to force reset repository.");
                                }
                              }}
                              className="h-8 px-3 rounded-lg border border-[#0F5132]/20 text-[#0F5132] hover:bg-[#0F5132]/10 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Force Reset
                            </button>
                          )}
                          <button
                            onClick={() => setRepoToDelete(repo)}
                            className="h-8 px-3 rounded-lg border border-[#842029]/20 text-[#842029] hover:bg-[#842029]/10 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* PANEL 3: NOTIFICATIONS */}
            {activePanel === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={SPRING_SOFT}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-sm font-bold text-[#1C1B1F]">Notification Rules</h2>
                  <p className="text-[11px] text-[#49454F] mt-0.5">
                    Configure which real-time events feed your floating island alert system.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Sync Failures Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-[#F0ECF5] border border-[#E4E1EC] rounded-xl">
                    <div>
                      <span className="text-xs font-bold block text-[#1C1B1F]">Sync Failure Warnings</span>
                      <span className="text-[10px] text-[#49454F]">
                        Alert immediately when a graph indexing background job fails.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={user?.preferences.syncFailures ?? true}
                      onChange={(e) =>
                        updatePreferencesMutation.mutate({ syncFailures: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#6E56F2] cursor-pointer"
                    />
                  </div>

                  {/* New PR Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-[#F0ECF5] border border-[#E4E1EC] rounded-xl">
                    <div>
                      <span className="text-xs font-bold block text-[#1C1B1F]">Context-Needed Pull Requests</span>
                      <span className="text-[10px] text-[#49454F]">
                        Alert when a pull request triggers critical risk and needs context comments.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={user?.preferences.newPRNeedContext ?? true}
                      onChange={(e) =>
                        updatePreferencesMutation.mutate({ newPRNeedContext: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#6E56F2] cursor-pointer"
                    />
                  </div>

                  {/* Weekly Digest */}
                  <div className="flex items-center justify-between p-3.5 bg-[#F0ECF5] border border-[#E4E1EC] rounded-xl">
                    <div>
                      <span className="text-xs font-bold block text-[#1C1B1F]">Weekly Graph Digest</span>
                      <span className="text-[10px] text-[#49454F]">
                        Emits a summarized report of cognitive coverage growth.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={user?.preferences.weeklyDigest ?? false}
                      onChange={(e) =>
                        updatePreferencesMutation.mutate({ weeklyDigest: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#6E56F2] cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* PANEL 4: API CREDENTIALS */}
            {activePanel === "apikeys" && (
              <motion.div
                key="apikeys"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={SPRING_SOFT}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-sm font-bold text-[#1C1B1F]">API Keys</h2>
                  <p className="text-[11px] text-[#49454F] mt-0.5">
                    Generate and manage secure credentials for programmatic access to MaintainerMind.
                  </p>
                </div>

                {/* API Key Generation Form */}
                <div className="bg-[#F0ECF5] border border-[#E4E1EC] rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-bold uppercase text-[#79747E] tracking-wider block">
                    Create New Key
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <input
                      type="text"
                      placeholder="Production API Key Name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="flex-1 h-9 px-3 bg-[#FBFAFE] border border-[#E4E1EC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] focus:border-[#6E56F2] outline-none"
                    />
                    <button
                      onClick={() => generateKeyMutation.mutate(newKeyName)}
                      disabled={!newKeyName.trim() || generateKeyMutation.isPending}
                      className="h-9 px-4 shrink-0 bg-[#6E56F2] hover:bg-[#5B45D5] text-white text-xs font-bold rounded-lg shadow-m3-l1 transition-colors cursor-pointer flex items-center justify-center w-full sm:w-auto"
                    >
                      {generateKeyMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Generate"
                      )}
                    </button>
                  </div>
                </div>

                {/* Show newly generated key */}
                {generatedKey && (
                  <div className="p-3 bg-[#D4F4E2] border border-[#0F5132]/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#0F5132] uppercase">
                        Key Created — Copy it now (will not be shown again!)
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedKey)}
                        className="flex items-center gap-1 text-xs text-[#0F5132] font-semibold hover:underline"
                      >
                        {copiedKey ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="text-xs font-mono select-all block bg-[#FBFAFE] p-2 rounded border border-[#CBEEDC] text-[#1C1B1F] truncate">
                      {generatedKey}
                    </code>
                  </div>
                )}

                {/* API Key List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#79747E] tracking-wider block">
                    Active API Credentials
                  </span>

                  {isLoadingKeys ? (
                    <Skeleton className="h-10 w-full" />
                  ) : apiKeys.length === 0 ? (
                    <div className="text-[11px] text-[#79747E] py-4">No active API keys found.</div>
                  ) : (
                    apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-3 bg-[#F0ECF5] border border-[#E4E1EC] rounded-xl text-xs"
                      >
                        <div>
                          <span className="font-bold block text-[#1C1B1F]">{key.name}</span>
                          <span className="text-[9px] text-[#49454F]">
                            Created on {new Date(key.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          onClick={() => revokeKeyMutation.mutate(key.id)}
                          className="text-[#842029] hover:bg-[#842029]/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* PANEL 5: DANGER ZONE */}
            {activePanel === "dangerzone" && (
              <motion.div
                key="dangerzone"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={SPRING_SOFT}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-sm font-bold text-[#842029]">Danger Zone Operations</h2>
                  <p className="text-[11px] text-[#842029]/80 mt-0.5">
                    Critical destructive operations. Proceed with absolute caution.
                  </p>
                </div>

                {/* Reset Cache Card */}
                <div className="p-4 bg-[#F8D7DA] border border-[#842029]/20 rounded-xl space-y-3">
                  <div>
                    <span className="text-xs font-bold block text-[#842029]">Flush System Redis Cache</span>
                    <span className="text-[10px] text-[#842029]/80 block mt-0.5">
                      Clears all transient API request responses, session logs, and temporary git buffers.
                    </span>
                  </div>
                  <button
                    onClick={() => flushCacheMutation.mutate()}
                    disabled={flushCacheMutation.isPending}
                    className="h-8 px-4 bg-[#842029] hover:bg-[#6c1a22] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {flushCacheMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" /> Flush Cache
                      </>
                    )}
                  </button>
                </div>

                {/* Delete Account Card */}
                <div className="p-4 bg-[#F8D7DA] border border-[#842029]/20 rounded-xl space-y-3">
                  <div>
                    <span className="text-xs font-bold block text-[#842029]">Permanently Delete Account</span>
                    <span className="text-[10px] text-[#842029]/80 block mt-0.5">
                      Irreversibly deletes your profile record, organizations, API credentials, and all Cognee memory graphs.
                    </span>
                  </div>
                  <button
                    onClick={() => setShowDeleteAccountModal(true)}
                    className="h-8 px-4 bg-[#842029] hover:bg-[#6c1a22] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── DISCONNECT CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {repoToDelete && (
          <div className="fixed inset-0 bg-[#1C1B1F]/35 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-[#FBFAFE] border border-[#CBEEDC] rounded-2xl p-6 space-y-4 shadow-m3-l3 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#842029]/10 border border-[#842029]/20 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-[#842029]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#1C1B1F]">
                  Disconnect {repoToDelete.fullName}?
                </h3>
                <p className="text-xs text-[#49454F] leading-relaxed">
                  Disconnecting deletes the active webhook and erases all knowledge representation indices for this repository. This action cannot be undone.
                </p>
                <div className="p-3 bg-[#F8D7DA] border border-[#842029]/15 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-[#842029] block">
                    Type repository name to confirm:
                  </span>
                  <span className="text-[10px] font-bold font-mono text-[#842029] block mt-0.5">
                    {repoToDelete.fullName}
                  </span>
                </div>
              </div>

              <input
                type="text"
                placeholder="Confirm repository name"
                value={confirmRepoName}
                onChange={(e) => setConfirmRepoName(e.target.value)}
                className="w-full h-9 px-3 bg-[#FBFAFE] border border-[#CBEEDC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] focus:border-[#842029] outline-none"
              />

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setRepoToDelete(null);
                    setConfirmRepoName("");
                  }}
                  className="flex-1 h-9 rounded-lg border border-[#E4E1EC] text-xs font-bold text-[#1C1B1F] hover:bg-[#F0ECF5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={confirmRepoName !== repoToDelete.fullName || disconnectRepoMutation.isPending}
                  onClick={() => disconnectRepoMutation.mutate(repoToDelete.id)}
                  className="flex-1 h-9 rounded-lg bg-[#842029] hover:bg-[#6c1a22] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {disconnectRepoMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Disconnect"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DELETE ACCOUNT CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <div className="fixed inset-0 bg-[#1C1B1F]/35 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-[#FBFAFE] border border-[#CBEEDC] rounded-2xl p-6 space-y-4 shadow-m3-l3 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#842029]/10 border border-[#842029]/20 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6 text-[#842029]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#1C1B1F]">
                  Permanently Delete Your Account?
                </h3>
                <p className="text-xs text-[#49454F] leading-relaxed">
                  Are you absolutely sure? This will permanently delete your user profile and all cached datasets from the server.
                </p>
                <div className="p-3 bg-[#F8D7DA] border border-[#842029]/15 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-[#842029] block">
                    Type <code className="font-mono text-[#842029]">delete my account permanently</code> to confirm:
                  </span>
                </div>
              </div>

              <input
                type="text"
                placeholder="Confirm deletion text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                className="w-full h-9 px-3 bg-[#FBFAFE] border border-[#CBEEDC] rounded-lg text-xs text-[#1C1B1F] placeholder-[#79747E] focus:border-[#842029] outline-none"
              />

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    setConfirmDeleteText("");
                  }}
                  className="flex-1 h-9 rounded-lg border border-[#CBEEDC] text-xs font-bold text-[#1C1B1F] hover:bg-[#E8F8F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={confirmDeleteText !== "delete my account permanently" || deleteAccountMutation.isPending}
                  onClick={() => deleteAccountMutation.mutate()}
                  className="flex-1 h-9 rounded-lg bg-[#842029] hover:bg-[#6c1a22] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {deleteAccountMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── CUSTOM TOAST ALERTS ─── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-5 right-5 z-[99999] flex items-center gap-2 bg-[#6E56F2] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-m3-l3 border border-[#8C76FF]/20"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
