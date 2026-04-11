"""
YouTube Transcript Helper — Called by Node.js via subprocess.
Outputs JSON to stdout with the transcript text.

Usage: python scripts/fetch_transcript.py <video_id>
"""
import sys
import json

def fetch_transcript(video_id: str) -> dict:
    from youtube_transcript_api import YouTubeTranscriptApi
    
    api = YouTubeTranscriptApi()
    transcript_list = api.list(video_id)
    
    # Try English first, then any available language
    langs = ["en", "en-US", "en-GB", "hi", "hi-Latn"]
    try:
        transcript = transcript_list.find_transcript(langs)
    except:
        # Fallback to first available transcript
        transcript = None
        for t in transcript_list:
            transcript = t
            break
    
    if transcript is None:
        return {"error": "No transcript available", "text": ""}
    
    # Translate to English if non-English
    if transcript.language_code not in ["en", "en-US", "en-GB"]:
        try:
            transcript = transcript.translate("en")
        except:
            pass  # Use original language
    
    data = transcript.fetch()
    
    # Extract text from snippets
    texts = []
    for snippet in data.snippets:
        text = snippet.text.replace("\n", " ").strip()
        if text:
            texts.append(text)
    
    full_text = " ".join(texts)
    
    return {
        "text": full_text,
        "language": transcript.language_code,
        "segments": len(texts),
        "word_count": len(full_text.split()),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python fetch_transcript.py <video_id>"}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    
    try:
        result = fetch_transcript(video_id)
        # Use ensure_ascii=True to avoid encoding issues on Windows
        print(json.dumps(result, ensure_ascii=True))
    except Exception as e:
        print(json.dumps({"error": str(e), "text": ""}, ensure_ascii=True))
        sys.exit(1)
