"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  PlaySquare,
  Sparkles,
  FileText,
  Copy,
  Check,
  Loader2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelativeTime, extractVideoId } from "@/lib/utils";
import type { Summary, SummaryContent } from "@/types/database";
import { useRouter } from "next/navigation";

export default function SummarizerPage() {
  const { user } = useUser();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryContent | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [summaryId, setSummaryId] = useState("");
  const [previousSummaries, setPreviousSummaries] = useState<Summary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  async function fetchHistory() {
    const { data } = await supabase
      .from("summaries")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setPreviousSummaries(data || []);
    setLoadingHistory(false);
  }

  async function handleSummarize() {
    if (!url.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      toast.error("Invalid YouTube URL");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize");
      }

      setResult(data.summary);
      setVideoTitle(data.video_title || "YouTube Video");
      setSummaryId(data.id || "");
      toast.success("Summary generated!");
      fetchHistory();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function saveAsNote() {
    if (!result) return;

    try {
      const noteContent = `
        <h1>${videoTitle}</h1>
        <p><strong>Source:</strong> <a href="${url}" target="_blank">${url}</a></p>
        <h2>Summary</h2>
        <p>${result.short_summary}</p>
        <h2>Key Points</h2>
        <ul>${result.bullet_points.map((p) => `<li>${p}</li>`).join("")}</ul>
        <h2>Key Insights</h2>
        <ul>${result.key_insights.map((i) => `<li>${i}</li>`).join("")}</ul>
      `;

      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user!.id,
          title: `📺 ${videoTitle}`,
          content: noteContent,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Saved as note!");
      router.push(`/dashboard/notes/${data.id}`);
    } catch {
      toast.error("Failed to save as note");
    }
  }

  function copyToClipboard() {
    if (!result) return;
    const text = `${videoTitle}\n\n${result.short_summary}\n\nKey Points:\n${result.bullet_points.map((p) => `• ${p}`).join("\n")}\n\nKey Insights:\n${result.key_insights.map((i) => `💡 ${i}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PlaySquare className="w-6 h-6 text-red-500" />
          YouTube Summarizer
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste a YouTube URL to get an AI-powered summary
        </p>
      </div>

      {/* Input */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <PlaySquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9 h-11"
                id="youtube-url-input"
                onKeyDown={(e) => e.key === "Enter" && handleSummarize()}
              />
            </div>
            <Button
              onClick={handleSummarize}
              disabled={loading || !url.trim()}
              className="h-11 px-6 cursor-pointer"
              id="summarize-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Summarize
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="space-y-2 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Video embed preview */}
            {extractVideoId(url) && (
              <div className="aspect-video rounded-xl overflow-hidden bg-black/5">
                <iframe
                  src={`https://www.youtube.com/embed/${extractVideoId(url)}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Summary Card */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{videoTitle}</CardTitle>
                  <div className="flex gap-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveAsNote}
                      className="cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Save as Note
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Short Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Summary
                  </h3>
                  <p className="text-foreground leading-relaxed">
                    {result.short_summary}
                  </p>
                </div>

                {/* Bullet Points */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    Key Points
                  </h3>
                  <ul className="space-y-2">
                    {result.bullet_points.map((point, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Key Insights */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Key Insights
                  </h3>
                  <div className="grid gap-2">
                    {result.key_insights.map((insight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10"
                      >
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{insight}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous Summaries */}
      <div>
        <Button
          variant="ghost"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Previous Summaries ({previousSummaries.length})
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
              ) : previousSummaries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No previous summaries
                </p>
              ) : (
                previousSummaries.map((summary) => (
                  <Card
                    key={summary.id}
                    className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors py-0"
                    onClick={() => {
                      setUrl(summary.youtube_url);
                      setResult(summary.summary);
                      setVideoTitle(summary.video_title || "YouTube Video");
                      setSummaryId(summary.id);
                    }}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {summary.video_title || "YouTube Video"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            <PlaySquare className="w-3 h-3 mr-1" />
                            Video
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(summary.created_at)}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
