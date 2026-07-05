"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Loader2,
  Brain,
  ThumbsDown,
  Info,
  GitPullRequest,
  CheckCircle,
  Clock,
  ChevronRight,
  Database,
  ExternalLink
} from "lucide-react";
import { useActiveRepo } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuitIcon, LikeIcon } from "@/components/icons/itshover-icons";

interface CitationNode {
  id: string;
  title: string;
  type: string;
  score: number;
  year?: string;
  dataset?: string;
  description?: string;
}

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations?: CitationNode[];
  isStreaming?: boolean;
}

const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 28 } as const;

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const repoId = (params?.repoId as string) || "";

  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState("");
  const [currentCitations, setCurrentCitations] = useState<CitationNode[]>([]);
  
  // Feedback state: maps citation ID/message ID to status message
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, string>>({});
  
  // @repo mention states
  const [showRepoMention, setShowRepoMention] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 1. Fetch connected repos for mention trigger
  const { data: reposData } = useQuery({
    queryKey: ["repos", "synced"],
    queryFn: async () => {
      const res = await fetch("/api/repos?status=SYNCED");
      if (!res.ok) throw new Error("Failed to fetch repos");
      return res.json();
    },
  });
  const repos = reposData?.repositories || [];

  // 2. Initialize chat session DB record
  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey: ["chat-session", repoId],
    queryFn: async () => {
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId }),
      });
      if (!res.ok) throw new Error("Failed to initialize session");
      return res.json();
    },
    enabled: !!repoId,
  });

  const session = sessionData?.session;
  const sessionId = session?.id;

  // Sync historical messages once session is loaded
  useEffect(() => {
    if (sessionData?.messages) {
      setMessages(
        sessionData.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          citations: typeof m.citations === "string" ? JSON.parse(m.citations) : m.citations || [],
        }))
      );
    }
  }, [sessionData]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, streamStatus]);

  // Handle auto-resize textarea
  const adjustHeight = () => {
    const tx = textareaRef.current;
    if (tx) {
      tx.style.height = "auto";
      tx.style.height = `${Math.min(140, tx.scrollHeight)}px`;
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputVal(val);

    // Look for "@" symbol to open repo mention list
    const lastChar = val.slice(-1);
    const lastWord = val.split(/\s+/).pop() || "";
    if (lastWord.startsWith("@")) {
      setShowRepoMention(true);
      setMentionFilter(lastWord.slice(1));
    } else {
      setShowRepoMention(false);
    }
    adjustHeight();
  };

  const selectRepoMention = (repoName: string) => {
    const words = inputVal.split(/\s+/);
    words.pop(); // remove the unfinished @mention
    const base = words.join(" ");
    setInputVal(`${base ? base + " " : ""}@${repoName} `);
    setShowRepoMention(false);
    textareaRef.current?.focus();
  };

  // Submit Feedback Mutation
  const feedbackMutation = useMutation({
    mutationFn: async ({
      messageId,
      citationText,
      rating
    }: {
      messageId: string;
      citationText: string;
      rating: "helpful" | "not_helpful";
    }) => {
      const res = await fetch(`/api/repos/${repoId}/pr-insights/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextText: citationText,
          rating,
        }),
      });
      if (!res.ok) throw new Error("Feedback mutation failed");
      return { messageId, rating };
    },
    onSuccess: (data) => {
      setFeedbackStatus((prev) => ({
        ...prev,
        [data.messageId]: "Thanks — graph updated"
      }));
    },
    onError: (err, variables) => {
      setFeedbackStatus((prev) => ({
        ...prev,
        [variables.messageId]: "Error updating graph"
      }));
    }
  });

  // Streaming message sender
  const handleSendMessage = async () => {
    if (!inputVal.trim() || isStreaming || !sessionId) return;

    const query = inputVal;
    setInputVal("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Append User message
    const userMessageId = Math.random().toString(36).substring(5);
    const newUserMsg: Message = {
      id: userMessageId,
      role: "USER",
      content: query,
    };
    setMessages((prev) => [...prev, newUserMsg]);

    // Append Assistant streaming message template
    const assistantMessageId = Math.random().toString(36).substring(5);
    const newAssistantMsg: Message = {
      id: assistantMessageId,
      role: "ASSISTANT",
      content: "",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, newAssistantMsg]);
    setIsStreaming(true);
    setStreamStatus("Connecting...");
    setCurrentCitations([]);

    try {
      const res = await fetch(`/api/chat/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, repoId }),
      });

      if (!res.ok) throw new Error("Failed to stream answer");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let buffer = "";
      let accumulatedText = "";
      let fetchedCitations: CitationNode[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            const dataStr = line.slice(5).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === "status") {
                setStreamStatus(data.message || "");
              } else if (currentEvent === "error") {
                throw new Error(data.message || "Server streaming error");
              } else if (currentEvent === "context") {
                fetchedCitations = data.results || [];
                setCurrentCitations(fetchedCitations);
              } else if (currentEvent === "delta") {
                accumulatedText += data.content || "";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: accumulatedText, citations: fetchedCitations }
                      : m
                  )
                );
              }
            } catch (err: any) {
              if (currentEvent === "error") {
                throw err; // Re-throw to be caught by the outer try-catch block
              }
              console.warn("Error parsing SSE data line", err);
            }
          }
        }
      }

      // Complete streaming state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, isStreaming: false, content: accumulatedText, citations: fetchedCitations }
            : m
        )
      );
      // Invalidate history query to keep history query key matching backend
      queryClient.invalidateQueries({ queryKey: ["chat-session", repoId] });
    } catch (err: any) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, isStreaming: false, content: `Error: ${err.message || "Something went wrong."}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setStreamStatus("");
    }
  };

  const filteredRepos = repos.filter((r: any) =>
    r.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Simple inline markdown renderer
  function renderMarkdown(text: string) {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip pure separator lines like --- or | --- |
      if (/^[|\s-]+$/.test(line) && line.includes("-")) continue;

      // Table row: | col1 | col2 |
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const cells = line.split("|").map(c => c.trim()).filter(Boolean);
        elements.push(
          <div key={key++} className="flex gap-2 flex-wrap py-0.5">
            {cells.map((cell, ci) => (
              <span key={ci} className="bg-[#EBE7FF]/60 text-[#1C1B1F] rounded px-1.5 py-0.5 text-[10px] font-medium">{inlineFormat(cell)}</span>
            ))}
          </div>
        );
        continue;
      }

      // H3: ###
      if (line.startsWith("### ")) {
        elements.push(<p key={key++} className="text-[11px] font-bold text-[#6E56F2] uppercase tracking-wider mt-2 mb-0.5">{inlineFormat(line.slice(4))}</p>);
        continue;
      }
      // H2: ##
      if (line.startsWith("## ")) {
        elements.push(<p key={key++} className="text-xs font-bold text-[#1C1B1F] mt-2 mb-0.5">{inlineFormat(line.slice(3))}</p>);
        continue;
      }

      // Bullet: * or -
      if (/^[*-] /.test(line.trim())) {
        elements.push(
          <div key={key++} className="flex items-start gap-1.5">
            <span className="text-[#6E56F2] mt-0.5 shrink-0">•</span>
            <span className="text-xs text-[#1C1B1F] leading-relaxed">{inlineFormat(line.trim().slice(2))}</span>
          </div>
        );
        continue;
      }

      // Empty line → spacer
      if (line.trim() === "") {
        elements.push(<div key={key++} className="h-1.5" />);
        continue;
      }

      // Normal paragraph
      elements.push(<p key={key++} className="text-xs text-[#1C1B1F] leading-relaxed">{inlineFormat(line)}</p>);
    }
    return <div className="space-y-0.5">{elements}</div>;
  }

  function inlineFormat(text: string): React.ReactNode {
    // Replace **bold** with <strong>
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-[#1C1B1F]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  if (isLoadingSession) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-[#FBFAFE]">
        <Loader2 className="w-8 h-8 text-[#6E56F2] animate-spin" />
        <span className="text-xs text-[#49454F] font-semibold mt-3">
          Initializing secure cognitive session...
        </span>
      </div>
    );
  }

  return (
    <div className="-m-4 md:-m-8 bg-[#FBFAFE] flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* ─── HEADER ZONE ─── */}
      <div className="h-14 border-b border-[#E4E1EC] px-4 flex items-center justify-between bg-[#F0ECF5]/80 backdrop-blur-sm z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/chat")}
            className="p-1.5 hover:bg-[#F0ECF5] rounded-lg transition-colors text-[#49454F] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <BrainCircuitIcon size={20} color="#6E56F2" />
            <span className="text-xs font-bold text-[#1C1B1F] truncate max-w-[200px]">
              {sessionData?.session?.repoId ? repos.find((r: any) => r.id === sessionData.session.repoId)?.name || repoId : repoId}
            </span>
          </div>
        </div>

        <span className="text-[9px] uppercase tracking-wider bg-[#6E56F2]/10 text-[#6E56F2] border border-[#6E56F2]/20 font-bold px-2 py-0.5 rounded-full">
          Cognee Memory Active
        </span>
      </div>

      {/* ─── CHAT THREAD ─── */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl w-full mx-auto pb-28"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#6E56F2]/10 border border-[#6E56F2]/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#6E56F2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#1C1B1F]">
                Start recalling from {repoId}
              </h3>
              <p className="text-xs text-[#49454F] max-w-sm">
                Ask architectural questions, query past changes, or map decision trails from the long-term memory graph.
              </p>
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === "USER";

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_SOFT}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-m3-l1 border ${
                  isUser
                    ? "bg-gradient-to-b from-[#8C76FF] to-[#6E56F2] text-white border-transparent"
                    : "bg-[#F0ECF5] text-[#1C1B1F] border-[#E4E1EC]"
                }`}
              >
                {/* Message text content */}
                {isUser ? (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
                    {m.content}
                  </p>
                ) : (
                  <div className="text-xs leading-relaxed font-medium">
                    {renderMarkdown(m.content)}
                  </div>
                )}

                {/* Status indicator during stream */}
                {m.isStreaming && isStreaming && streamStatus && (
                  <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-[#79747E] font-semibold">
                    <Loader2 className="w-3 h-3 animate-spin text-[#6E56F2]" />
                    <span>{streamStatus}</span>
                  </div>
                )}

                {/* Citations & Feedback block */}
                {!isUser && m.citations && m.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#E4E1EC] space-y-2">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-[#79747E]">
                      Recalled Decisions & Precedents
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.citations.map((cite) => (
                        <div
                          key={cite.id}
                          className="inline-flex items-center gap-1 bg-[#FBFAFE] border border-[#E4E1EC] px-2 py-0.5 rounded-md text-[10px] font-semibold text-[#1C1B1F]"
                        >
                          <Database className="w-2.5 h-2.5 text-[#6E56F2]" />
                          <span>{cite.title}</span>
                          <span className="text-[#79747E]">({cite.score}%)</span>
                        </div>
                      ))}
                    </div>

                    {/* Self-Improvement Cognitive Row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E4E1EC]">
                      <span className="text-[9px] text-[#79747E] font-bold">
                        Improve memory query accuracy?
                      </span>

                      <div className="flex items-center gap-2">
                        {feedbackStatus[m.id] ? (
                          <span className="text-[10px] text-[#6E56F2] font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {feedbackStatus[m.id]}
                          </span>
                        ) : (
                          <>
                            <LikeIcon
                              size={12}
                              color="#79747E"
                              className="cursor-pointer hover:bg-[#E4E1EC] p-1 rounded transition-colors"
                              onClick={() =>
                                feedbackMutation.mutate({
                                  messageId: m.id,
                                  citationText: m.citations?.[0]?.title || m.content,
                                  rating: "helpful",
                                })
                              }
                            />
                            <button
                              type="button"
                              className="text-[#79747E] hover:bg-[#E4E1EC] p-1 rounded transition-colors"
                              onClick={() =>
                                feedbackMutation.mutate({
                                  messageId: m.id,
                                  citationText: m.citations?.[0]?.title || m.content,
                                  rating: "not_helpful",
                                })
                              }
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── BOTTOM INPUT COMPONENT ─── */}
      <div className="shrink-0 p-3 bg-gradient-to-t from-[#FBFAFE] via-[#FBFAFE]/90 to-transparent z-10">
        <div className="max-w-3xl mx-auto relative bg-[#F0ECF5] border border-[#E4E1EC] rounded-2xl p-2 shadow-m3-l3">
          
          {/* Autocomplete popup for "@repo" mention */}
          <AnimatePresence>
            {showRepoMention && filteredRepos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-[#FBFAFE] border border-[#E4E1EC] rounded-xl shadow-m3-l3 overflow-hidden z-30"
              >
                <div className="p-2 border-b border-[#E4E1EC] text-[10px] font-bold text-[#79747E] uppercase tracking-wider bg-[#F0ECF5]">
                  Connected Datasets
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {filteredRepos.map((r: any) => (
                    <button
                      key={r.id}
                      onClick={() => selectRepoMention(r.name)}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-[#1C1B1F] hover:bg-[#E8F8F0] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Database className="w-3.5 h-3.5 text-[#6E56F2]" />
                      <span>{r.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputVal}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a question about the repo patterns... (use @ to mention datasets)"
              className="flex-1 bg-transparent border-0 outline-none text-xs text-[#1C1B1F] placeholder-[#79747E] resize-none max-h-36 py-2 px-3 focus:ring-0 focus:outline-none"
            />

            <button
              onClick={handleSendMessage}
              disabled={isStreaming || !inputVal.trim()}
              className="w-8 h-8 rounded-full bg-[#6E56F2] hover:bg-[#5B45D5] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
