/**
 * YouTube Transcript Fetcher
 * 
 * Uses the same approach as VidCrunch: Python's youtube_transcript_api library
 * called via subprocess. This is the most reliable free method since:
 * - Node.js YouTube transcript libraries are all broken or unreliable
 * - YouTube blocks server-side fetch() calls to their timedtext API
 * - Python's youtube_transcript_api handles cookies/sessions correctly
 * 
 * Falls back to RapidAPI if Python is unavailable.
 */

import { YoutubeTranscript } from "youtube-transcript";

/**
 * Fetches a YouTube video transcript using the native youtube-transcript package.
 * This runs natively in Node.js and avoids the need for Python in Vercel serverless functions.
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      throw new Error("Transcript is empty or too short");
    }
    
    const text = transcript.map(item => item.text).join(" ");
    
    if (text.trim().length < 10) {
      throw new Error("Transcript is empty or too short");
    }
    
    return text;
  } catch (error: any) {
    const message = error?.message || "Unknown error";
    throw new Error(`Transcript fetch failed: ${message}`);
  }
}
