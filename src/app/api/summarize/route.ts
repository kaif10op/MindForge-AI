import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import { summarizeSchema } from "@/lib/validators/schemas";
import { generateAIResponse } from "@/lib/ai/openai";
import { SUMMARIZE_SYSTEM_PROMPT, SUMMARIZE_USER_PROMPT } from "@/lib/ai/prompts";
import { extractVideoId } from "@/lib/utils";
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = summarizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(parsed.data.url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Check cache — avoid duplicate processing
    const { data: existing } = await supabase
      .from("summaries")
      .select("*")
      .eq("user_id", user.id)
      .eq("youtube_url", parsed.data.url)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        summary: existing.summary,
        video_title: existing.video_title,
        cached: true,
      });
    }

    // Fetch transcript via newly provided RapidAPI endpoint
    let transcriptText: string;
    try {
      const proxyResponse = await fetch(
        `https://youtube-transcriptor.p.rapidapi.com/?video_id=${videoId}&lang=en`, 
        {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'youtube-transcriptor.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPID_API_KEY || ''
          }
        }
      );

      if (!proxyResponse.ok) {
        throw new Error(`Proxy failed with status: ${proxyResponse.status}`);
      }

      const jsonResponse = await proxyResponse.json();
      
      // The API provides the entire transcript as a single block of text
      if (jsonResponse.transcriptionAsText) {
        transcriptText = jsonResponse.transcriptionAsText;
      } else {
        throw new Error('Transcription missing in response');
      }
      
    } catch (error) {
      console.error("Transcript fetch error:", error);
      return NextResponse.json(
        {
          error:
            "Could not fetch transcript via proxy. The video may not have subtitles/captions available.",
        },
        { status: 400 }
      );
    }

    if (!transcriptText || transcriptText.trim().length < 50) {
      return NextResponse.json(
        { error: "Transcript is too short or empty" },
        { status: 400 }
      );
    }

    // Generate summary with AI
    const aiResponse = await generateAIResponse(
      SUMMARIZE_SYSTEM_PROMPT,
      SUMMARIZE_USER_PROMPT(transcriptText),
      2000
    );

    // Parse AI response
    let summary;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      summary = JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback structure
      summary = {
        short_summary: aiResponse.substring(0, 500),
        bullet_points: ["Summary generated but could not be structured properly"],
        key_insights: ["Please try again for better results"],
      };
    }

    // Get video title (simple extraction from YouTube)
    let videoTitle = "YouTube Video";
    try {
      const ytResponse = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.data.url)}&format=json`
      );
      if (ytResponse.ok) {
        const ytData = await ytResponse.json();
        videoTitle = ytData.title || "YouTube Video";
      }
    } catch {
      // Ignore title fetch errors
    }

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("summaries")
      .insert({
        user_id: user.id,
        youtube_url: parsed.data.url,
        video_title: videoTitle,
        transcript: transcriptText.substring(0, 50000), // Limit transcript storage
        summary,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
    }

    return NextResponse.json({
      id: saved?.id || "",
      summary,
      video_title: videoTitle,
      cached: false,
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 500 }
    );
  }
}
