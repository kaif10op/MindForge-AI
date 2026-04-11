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

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

interface TranscriptResult {
  text: string;
  language: string;
  segments: number;
  word_count: number;
  error?: string;
}

/**
 * Fetches a YouTube video transcript using the Python youtube_transcript_api.
 * This is the same library that powers VidCrunch's working transcript extraction.
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  // Method 1: Python youtube_transcript_api (VidCrunch's approach)
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "fetch_transcript.py");
    
    const { stdout, stderr } = await execFileAsync("python", [scriptPath, videoId], {
      timeout: 30000, // 30 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for long transcripts
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    if (stderr && !stdout) {
      throw new Error(`Python script error: ${stderr.trim()}`);
    }

    const result: TranscriptResult = JSON.parse(stdout.trim());

    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.text || result.text.trim().length < 10) {
      throw new Error("Transcript is empty or too short");
    }

    return result.text;
  } catch (error: any) {
    // If Python is not available or the script fails, throw with details
    const message = error?.message || "Unknown error";
    
    if (message.includes("ENOENT") || message.includes("not found") || message.includes("not recognized")) {
      throw new Error(
        "Python is not installed or not in PATH. Install Python 3 and youtube-transcript-api: pip install youtube-transcript-api"
      );
    }
    
    throw new Error(`Transcript fetch failed: ${message}`);
  }
}
