"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  PlaySquare,
  Search,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatRelativeTime, truncateText, stripHtml } from "@/lib/utils";
import type { Note, Summary, ResearchLog } from "@/types/database";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ notes: 0, summaries: 0, research: 0 });
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [recentSummaries, setRecentSummaries] = useState<Summary[]>([]);
  const [recentResearch, setRecentResearch] = useState<ResearchLog[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const [notesRes, summariesRes, researchRes] = await Promise.all([
        supabase
          .from("notes")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase
          .from("summaries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("research_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Get counts
      const [notesCount, summariesCount, researchCount] = await Promise.all([
        supabase
          .from("notes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("summaries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("research_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      setRecentNotes(notesRes.data || []);
      setRecentSummaries(summariesRes.data || []);
      setRecentResearch(researchRes.data || []);
      setStats({
        notes: notesCount.count || 0,
        summaries: summariesCount.count || 0,
        research: researchCount.count || 0,
      });
      setLoading(false);
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your workspace
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            label: "Notes",
            count: stats.notes,
            icon: FileText,
            color: "text-blue-400",
            bg: "bg-blue-500/20",
            href: "/dashboard/notes",
          },
          {
            label: "Summaries",
            count: stats.summaries,
            icon: PlaySquare,
            color: "text-red-400",
            bg: "bg-red-500/20",
            href: "/dashboard/summarizer",
          },
          {
            label: "Research",
            count: stats.research,
            icon: Search,
            color: "text-emerald-400",
            bg: "bg-emerald-500/20",
            href: "/dashboard/research",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <motion.div whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }}>
              <Card className="cursor-pointer transition-all duration-300 py-0 bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/30 hover:bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <CardContent className="p-6 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: stat.color.replace('text-', '') }} />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-sm font-medium text-white/60 tracking-wider uppercase">
                        {stat.label}
                      </p>
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-light mt-2 text-white"
                      >
                        {stat.count}
                      </motion.p>
                    </div>
                    <div className={`p-4 rounded-2xl ${stat.bg} shadow-Inner`}>
                      <stat.icon className={`w-7 h-7 ${stat.color} filter drop-shadow-md`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href="/dashboard/notes">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 cursor-pointer hover:bg-blue-500/5 hover:border-blue-500/30 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2 text-blue-500" />
                  Create Note
                </Button>
              </Link>
              <Link href="/dashboard/summarizer">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 cursor-pointer hover:bg-red-500/5 hover:border-red-500/30 transition-all"
                >
                  <PlaySquare className="w-4 h-4 mr-2 text-red-500" />
                  Summarize Video
                </Button>
              </Link>
              <Link href="/dashboard/research">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all"
                >
                  <Search className="w-4 h-4 mr-2 text-emerald-500" />
                  Ask Question
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Notes */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-lg h-full">
          <CardHeader className="pb-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Recent Notes
              </CardTitle>
              <Link href="/dashboard/notes">
                <Button variant="ghost" size="sm" className="text-xs cursor-pointer">
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notes yet
              </p>
            ) : (
              recentNotes.slice(0, 4).map((note) => (
                <Link key={note.id} href={`/dashboard/notes/${note.id}`}>
                  <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <p className="text-sm font-medium truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {truncateText(stripHtml(note.content || ""), 60)}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(note.updated_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Summaries */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-lg h-full">
          <CardHeader className="pb-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <PlaySquare className="w-4 h-4 text-red-500" />
                Recent Summaries
              </CardTitle>
              <Link href="/dashboard/summarizer">
                <Button variant="ghost" size="sm" className="text-xs cursor-pointer">
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSummaries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No summaries yet
              </p>
            ) : (
              recentSummaries.slice(0, 4).map((summary) => (
                <div
                  key={summary.id}
                  className="p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium truncate">
                    {summary.video_title || "YouTube Video"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {typeof summary.summary === "object" && summary.summary?.short_summary
                      ? truncateText(summary.summary.short_summary, 60)
                      : "Summary available"}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(summary.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Research */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-lg h-full">
          <CardHeader className="pb-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Recent Research
              </CardTitle>
              <Link href="/dashboard/research">
                <Button variant="ghost" size="sm" className="text-xs cursor-pointer">
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentResearch.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No research yet
              </p>
            ) : (
              recentResearch.slice(0, 4).map((research) => (
                <div
                  key={research.id}
                  className="p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium truncate">
                    {research.question}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {(research.sources as unknown[])?.length || 0} sources
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(research.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
