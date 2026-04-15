import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import { summarizeSchema } from "@/lib/validators/schemas";
import { generateAIResponse } from "@/lib/ai/openai";
import { SUMMARIZE_SYSTEM_PROMPT, SUMMARIZE_USER_PROMPT } from "@/lib/ai/prompts";
import { extractVideoId } from "@/lib/utils";
import { fetchYouTubeTranscript } from "@/lib/youtube-transcript";

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

    // Fetch transcript — Method 1: Direct YouTube scraping (free, no API key)
    let transcriptText: string = "";
    let transcriptError: string = "";

    try {
      transcriptText = await fetchYouTubeTranscript(videoId);
    } catch (err: any) {
      console.warn("Direct YouTube transcript scraping failed:", err?.message);
      transcriptError = err?.message || "Unknown error";
    }

    let rapidApiError = "";

    // Fallback — Method 2: RapidAPI (if free method failed and key is available)
    if (!transcriptText && process.env.RAPID_API_KEY) {
      try {
        const proxyResponse = await fetch(
          `https://youtube-transcriptor.p.rapidapi.com/transcript?video_id=${videoId}`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-host": "youtube-transcriptor.p.rapidapi.com",
              "x-rapidapi-key": process.env.RAPID_API_KEY,
            },
          }
        );

        const jsonResponse = await proxyResponse.json();
        
        if (proxyResponse.ok && !jsonResponse.message) {
          const transcriptData = Array.isArray(jsonResponse)
            ? jsonResponse[0]
            : jsonResponse;
          if (transcriptData?.transcriptionAsText) {
            transcriptText = transcriptData.transcriptionAsText;
          }
        } else {
          // Rapid API returned an error message (like quota exceeded)
          rapidApiError = jsonResponse.message || "Unknown proxy error";
        }
      } catch (err: any) {
        console.warn("RapidAPI fallback also failed:", err?.message);
        rapidApiError = err?.message;
      }
    }

    // If both methods failed, return error
    if (!transcriptText) {
      let combinedError = `Could not fetch transcript. The video may not have captions available. Details: ${transcriptError}`;
      if (rapidApiError) {
        combinedError += ` | Proxy Fallback Error: ${rapidApiError}`;
      }
      return NextResponse.json(
        {
          error: combinedError,
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
