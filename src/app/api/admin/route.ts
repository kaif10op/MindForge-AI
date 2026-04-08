import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get counts
    const [usersCount, notesCount, summariesCount, researchCount] =
      await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("notes").select("id", { count: "exact", head: true }),
        supabase
          .from("summaries")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("research_logs")
          .select("id", { count: "exact", head: true }),
      ]);

    return NextResponse.json({
      totalUsers: usersCount.count || 0,
      totalNotes: notesCount.count || 0,
      totalSummaries: summariesCount.count || 0,
      totalResearch: researchCount.count || 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
