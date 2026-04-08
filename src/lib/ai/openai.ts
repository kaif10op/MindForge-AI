import OpenAI from "openai";

interface AIProvider {
  name: string;
  client: OpenAI;
  model: string;
}

const providers: AIProvider[] = [
  {
    name: "Groq",
    client: new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
    }),
    model: "llama-3.3-70b-versatile",
  },
  {
    name: "Cerebras",
    client: new OpenAI({
      baseURL: "https://api.cerebras.ai/v1",
      apiKey: process.env.CEREBRAS_API_KEY || "dummy_key_for_build",
    }),
    model: "llama3.1-70b",
  },
  {
    name: "OpenRouter",
    client: new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY || "dummy_key_for_build",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "MindForge AI",
      },
    }),
    model: "meta-llama/llama-3.3-70b-instruct:free",
  },
  {
    name: "Google AI",
    client: new OpenAI({
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: process.env.GOOGLE_AI_KEY || "dummy_key_for_build",
    }),
    model: "gemini-2.5-pro",
  },
  {
    name: "xAI",
    client: new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY || "dummy_key_for_build",
    }),
    model: "grok-beta",
  },
].filter((p) => p.client.apiKey && p.client.apiKey !== "dummy_key_for_build");

// If no valid provider is found but we still want to not crash the build:
if (providers.length === 0) {
  providers.push({
    name: "Fallback Build Client",
    client: new OpenAI({ apiKey: "dummy_key_for_build" }),
    model: "gpt-4o",
  });
}

export async function generateAIResponse(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2000
): Promise<string> {
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[AI Fallback] Attempting generation via ${provider.name}...`);
      const response = await provider.client.chat.completions.create({
        model: provider.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      if (response.choices[0]?.message?.content) {
        console.log(`[AI Fallback] Successfully generated response from ${provider.name}.`);
        return response.choices[0].message.content;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(`[AI Fallback] Provider ${provider.name} failed: ${message}`);
      errors.push(`[${provider.name}] ${message}`);
    }
  }

  throw new Error(`All configured AI providers failed. Errors:\n ${errors.join("\n")}`);
}

// Keep export for backwards-compat if it really needs the openai import anywhere directly
export const openai = providers[0]?.client || new OpenAI({ apiKey: "dummy_key" });
