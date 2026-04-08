import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import { deleteUserSchema } from "@/lib/validators/schemas";

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

    // Get all users with activity counts
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get counts for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (u) => {
        const [notesCount, summariesCount, researchCount] = await Promise.all([
          supabase
            .from("notes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", u.id),
          supabase
            .from("summaries")
            .select("id", { count: "exact", head: true })
            .eq("user_id", u.id),
          supabase
            .from("research_logs")
            .select("id", { count: "exact", head: true })
            .eq("user_id", u.id),
        ]);

        return {
          ...u,
          notes_count: notesCount.count || 0,
          summaries_count: summariesCount.count || 0,
          research_count: researchCount.count || 0,
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    const body = await request.json();
    const parsed = deleteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (parsed.data.userId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    // Delete from public.users (cascades to notes, summaries, research_logs)
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", parsed.data.userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
