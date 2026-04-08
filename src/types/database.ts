export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface NoteTag {
  note_id: string;
  tag_id: string;
}

export interface NoteWithTags extends Note {
  tags: Tag[];
}

export interface Summary {
  id: string;
  user_id: string;
  youtube_url: string;
  video_title: string | null;
  transcript: string | null;
  summary: SummaryContent;
  created_at: string;
}

export interface SummaryContent {
  short_summary: string;
  bullet_points: string[];
  key_insights: string[];
}

export interface ResearchLog {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  sources: ResearchSource[];
  created_at: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface AdminStats {
  totalUsers: number;
  totalNotes: number;
  totalSummaries: number;
  totalResearch: number;
}

export interface UserWithStats extends User {
  notes_count: number;
  summaries_count: number;
  research_count: number;
}

export interface NoteSummary {
  summary: string;
  key_points: string[];
  word_count: number;
}
