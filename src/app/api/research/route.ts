import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import { researchSchema } from "@/lib/validators/schemas";
import { generateAIResponse } from "@/lib/ai/openai";
import { RESEARCH_SYSTEM_PROMPT, RESEARCH_USER_PROMPT } from "@/lib/ai/prompts";

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
    const parsed = researchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const question = parsed.data.question;

    // Search the web using Jina Search API
    let searchResults: { title: string; url: string; content: string }[] = [];

    const jinaKey = process.env.JINA_API_KEY;

    if (jinaKey) {
      try {
        const searchResponse = await fetch(`https://s.jina.ai/${encodeURIComponent(question)}`, {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${jinaKey}`,
            "Accept": "application/json"
          },
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          searchResults = (searchData.data || []).slice(0, 5).map(
            (r: { title: string; url: string; content: string }) => ({
              title: r.title || "",
              url: r.url || "",
              content: r.content ? r.content.substring(0, 3000) : "",
            })
          );
        } else {
          console.error("Jina search failed:", await searchResponse.text());
        }
      } catch (searchError) {
        console.error("Jina search error:", searchError);
      }
    }

    // Format search results for AI prompt
    const formattedResults = searchResults.length > 0
      ? searchResults
          .map(
            (r, i) =>
              `[${i + 1}] Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content.substring(0, 1500)}`
          )
          .join("\n\n")
      : "No web search results available. Please provide the best answer based on your knowledge.";

    // Generate research answer with AI
    const answer = await generateAIResponse(
      RESEARCH_SYSTEM_PROMPT,
      RESEARCH_USER_PROMPT(question, formattedResults),
      3000
    );

    // Extract sources
    const sources = searchResults.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content.substring(0, 200),
    }));

    // Save to database
    const { error: saveError } = await supabase.from("research_logs").insert({
      user_id: user.id,
      question,
      answer,
      sources,
    });

    if (saveError) {
      console.error("Save error:", saveError);
    }

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json(
      { error: "Failed to complete research. Please try again." },
      { status: 500 }
    );
  }
}
