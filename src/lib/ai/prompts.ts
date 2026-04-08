export const SUMMARIZE_SYSTEM_PROMPT = `You are an expert content summarizer. You analyze video transcripts and produce clear, well-structured summaries. Always respond in valid JSON format.`;

export const SUMMARIZE_USER_PROMPT = (transcript: string) => `
Analyze the following video transcript and provide a comprehensive summary.

Respond ONLY with valid JSON in this exact format:
{
  "short_summary": "A concise 2-3 sentence summary of the video",
  "bullet_points": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "key_insights": ["insight 1", "insight 2", "insight 3"]
}

Rules:
- short_summary: 2-3 sentences capturing the main topic and key message
- bullet_points: 5-8 key points from the video, each one sentence
- key_insights: 3-5 unique insights or takeaways

Transcript:
${transcript.substring(0, 12000)}
`;

export const RESEARCH_SYSTEM_PROMPT = `You are an expert researcher. You analyze web search results and synthesize comprehensive, well-cited answers. Structure your answers with clear sections and always cite your sources.`;

export const RESEARCH_USER_PROMPT = (
  question: string,
  searchResults: string
) => `
Research Question: ${question}

Based on the following web search results, provide a comprehensive, well-structured answer.

Search Results:
${searchResults}

Instructions:
1. Synthesize information from multiple sources
2. Structure your answer with clear sections using markdown headers (##)
3. Include specific facts and data where available
4. Reference source numbers in brackets like [1], [2] etc.
5. Be thorough but concise
6. If the search results don't contain enough information, state that clearly

Provide your answer in well-formatted markdown.
`;

export const NOTE_SUMMARIZE_SYSTEM_PROMPT = `You are an expert note summarizer. You read user notes and produce clear, concise summaries with key points. Always respond in valid JSON format.`;

export const NOTE_SUMMARIZE_USER_PROMPT = (noteContent: string) => `
Analyze the following note and provide a comprehensive summary.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "A concise 2-4 sentence summary of the note's main ideas",
  "key_points": ["point 1", "point 2", "point 3"],
  "word_count": <number of words in the original note>
}

Rules:
- summary: 2-4 sentences capturing the main topic and key ideas
- key_points: 3-7 key points or takeaways, each one clear sentence
- word_count: approximate word count of the original note

Note Content:
${noteContent.substring(0, 10000)}
`;

