# MindForge AI

MindForge AI is an advanced, AI-powered productivity hub designed specifically for seamless note-taking, rich-text editing, rapid text generation, dynamic tagging, and multi-model AI summarization.

## 🏗️ Architecture Overview

The application follows a modern, full-stack serverless architecture:

- **Frontend Core**: [Next.js 14+ (App Router)](https://nextjs.org/) using React Server Components to boost performance while minimizing client-side javascript overhead.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) mapped to design system utility classes, built alongside [shadcn/ui](https://ui.shadcn.com/) for beautiful, deeply accessible micro-components (like dialogs, toast notifications, badges, etc.).
- **Rich Text Editor**: [TipTap](https://tiptap.dev/) standardises our editor. We use custom extensions to handle task-lists, syntax highlight, blockquotes, and specific native-feeling interactions.
- **Backend API Layer**: Next.js App Router API directory (`/api`) routing for securely interacting with our database and AI integrations.
- **Database & Authentication**: [Supabase](https://supabase.com/) powers our PostgreSQL database, managing users securely by enforcing Postgres Row Level Security (RLS) rules directly at the table level so every user is siloed.
- **AI Integrations**: We built a custom multi-provider fallback utility chain (`generateAIResponse` residing in `src/lib/ai/openai.ts`) which cycles through LLMs provided by platforms like Groq, Cerebras, OpenRouter, Google AI (Gemini), and xAI to fetch note summaries securely without downtime.

## 🚀 How the Application Starts

1. **Development Start**: We run `npm run dev` starting the Next.js local development server (via Turbopack for compilation speed).
2. **Bootstrapping**: Next.js parses the `app/layout.tsx` wrapper, checking global fonts and loading `globals.css` where base layer variables and component theme states are initialized. 
3. **Authentication**: `app/page.tsx` checks user status. If you attempt to access an authenticated route like `/dashboard/notes`, `src/hooks/use-user.ts` combined with our Supabase client verifications confirms your presence and either grants access or redirects you to `/login`.
4. **Client Render**: Protected routes fetch dynamic state client-side using `useEffect`/`useCallback` hooks (like notes lists and assigned tags) via the Supabase Javascript SDK.

## ⚙️ First-Time Setup & Configuration

To set up and run this application immediately from a fresh clone, you need to configure your environment variables and initialize your database schema.

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Provide specific API endpoints for your Database and AI Providers. Rename `.env.local.example` to `.env.local` if you don't have one and include the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Provider Keys (for Summarizer functionality)
GROQ_API_KEY=your_groq_key
CEREBRAS_API_KEY=your_cerebras_key
OPENROUTER_API_KEY=your_openrouter_key
GOOGLE_GEMINI_API_KEY=your_gemini_key
XAI_API_KEY=your_xai_key
```

### 3. Database Initialization (Supabase)
Run the migration scripts located in your project root using the SQL Editor in your Supabase dashboard:
1. Copy the contents of `supabase-notes-upgrade.sql`
2. Run it inside your database SQL editor. This sets up the following schema:
   - Modifications on the `notes` table (appending `is_pinned`).
   - Creation of the `tags` table and its relative RLS security policies.
   - Creation of the `note_tags` junction table (connecting notes to labels) alongside its RLS security policies.

### 4. Run the Dev Server
```bash
npm run dev
```

Visit `http://localhost:3000` to interact with MindForge AI!
