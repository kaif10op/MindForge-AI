import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { generateAIResponse } from "@/lib/ai/openai";
import {
  NOTE_SUMMARIZE_SYSTEM_PROMPT,
  NOTE_SUMMARIZE_USER_PROMPT,
} from "@/lib/ai/prompts";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the note
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const plainText = stripHtml(note.content || "");

    if (plainText.length < 20) {
      return NextResponse.json(
        { error: "Note content is too short to summarize (minimum 20 characters)" },
        { status: 400 }
      );
    }

    const aiResponse = await generateAIResponse(
      NOTE_SUMMARIZE_SYSTEM_PROMPT,
      NOTE_SUMMARIZE_USER_PROMPT(plainText),
      1500
    );

    // Parse JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const summary = JSON.parse(jsonMatch[0]);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Note Summarize] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 500 }
    );
  }
}
