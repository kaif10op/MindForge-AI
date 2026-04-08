"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelativeTime } from "@/lib/utils";
import type { ResearchLog, ResearchSource } from "@/types/database";

export default function ResearchPage() {
  const { user } = useUser();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [previousResearch, setPreviousResearch] = useState<ResearchLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  async function fetchHistory() {
    const { data } = await supabase
      .from("research_logs")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setPreviousResearch(data || []);
    setLoadingHistory(false);
  }

  async function handleResearch() {
    if (question.trim().length < 10) {
      toast.error("Question must be at least 10 characters");
      return;
    }

    setLoading(true);
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to research");
      }

      setAnswer(data.answer);
      setSources(data.sources || []);
      toast.success("Research complete!");
      fetchHistory();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    const text = `${question}\n\n${answer}\n\nSources:\n${sources.map((s, i) => `[${i + 1}] ${s.title} - ${s.url}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  // Simple markdown-to-HTML for display
  function renderMarkdown(text: string) {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-emerald-500" />
          AI Deep Research
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ask any question and get a comprehensive, AI-researched answer with sources
        </p>
      </div>

      {/* Input */}
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <Textarea
            placeholder="What would you like to research? (e.g., 'What are the latest advancements in quantum computing?')"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[100px] resize-none"
            id="research-question-input"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {question.length}/1000 characters
            </p>
            <Button
              onClick={handleResearch}
              disabled={loading || question.trim().length < 10}
              className="cursor-pointer"
              id="research-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Research
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium">Searching the web...</p>
                  <p className="text-xs text-muted-foreground">
                    Gathering and analyzing sources
                  </p>
                </div>
              </div>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {answer && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Answer */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    Research Results
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 mr-1" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(answer),
                  }}
                />
              </CardContent>
            </Card>

            {/* Sources */}
            {sources.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Sources ({sources.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sources.map((source, i) => (
                    <motion.a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <Badge
                        variant="secondary"
                        className="text-xs mt-0.5 px-2"
                      >
                        {i + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {source.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {source.snippet}
                        </p>
                        <p className="text-xs text-primary/60 mt-1 truncate">
                          {source.url}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                    </motion.a>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous Research */}
      <div>
        <Button
          variant="ghost"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Previous Research ({previousResearch.length})
          </span>
          {showHistory ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 mt-2"
            >
              {loadingHistory ? (
                <Skeleton className="h-20" />
              ) : previousResearch.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No previous research
                </p>
              ) : (
                previousResearch.map((research) => (
                  <Card
                    key={research.id}
                    className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors py-0"
                    onClick={() => {
                      setQuestion(research.question);
                      setAnswer(research.answer);
                      setSources(
                        (research.sources as unknown as ResearchSource[]) || []
                      );
                    }}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm font-medium truncate">
                        {research.question}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {(research.sources as unknown[])?.length || 0} sources
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(research.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
