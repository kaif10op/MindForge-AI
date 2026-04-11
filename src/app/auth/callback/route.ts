import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log("Code exchange successful, redirecting to:", next);
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Code exchange failed:", error);
    }
  } else {
    console.warn("No code provided to callback route.");
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
