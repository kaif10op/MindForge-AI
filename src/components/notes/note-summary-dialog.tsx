"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { NoteSummary } from "@/types/database";

interface NoteSummaryDialogProps {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoteSummaryDialog({
  noteId,
  open,
  onOpenChange,
}: NoteSummaryDialogProps) {
  const [summary, setSummary] = useState<NoteSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch(`/api/notes/${noteId}/summarize`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate summary";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  // Trigger summary generation when dialog opens
  useEffect(() => {
    if (open && !summary && !loading) {
      generateSummary();
    }
    if (!open) {
      // Reset state when dialog closes
      setSummary(null);
      setError(null);
      setLoading(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function copyToClipboard() {
    if (!summary) return;

    const text = `Summary:\n${summary.summary}\n\nKey Points:\n${summary.key_points
      .map((p, i) => `${i + 1}. ${p}`)
      .join("\n")}`;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Summary copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            AI Summary
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl animated-gradient flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <Loader2 className="w-5 h-5 animate-spin absolute -bottom-1 -right-1 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Analyzing your note...
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              This may take a few seconds
            </p>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button
              onClick={generateSummary}
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              Try Again
            </Button>
          </motion.div>
        )}

        {summary && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/10">
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                Summary
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {summary.summary}
              </p>
            </div>

            {/* Key Points */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Key Points
              </h4>
              <div className="space-y-1.5">
                {summary.key_points.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-2.5 items-start"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-sm text-foreground/80">{point}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                ~{summary.word_count} words analyzed
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSummary}
                  className="gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Regenerate
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {!loading && !error && !summary && (
          <div className="flex flex-col items-center justify-center py-12">
            <Button
              onClick={generateSummary}
              className="gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Generate Summary
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
