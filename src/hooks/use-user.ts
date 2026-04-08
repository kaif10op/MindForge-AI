"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@/types/database";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .single();

          if (profile) {
            setUser(profile);
          } else {
            console.log("Profile not found in public.users, triggering server-side fix or returning partial authUser.", error);
            // Fallback object to immediately unblock the UI if the trigger was missed
            setUser({
              id: authUser.id,
              email: authUser.email || "",
              name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || "User",
              avatar_url: authUser.user_metadata?.avatar_url || "",
              is_admin: false,
              created_at: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
      } else {
        getUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return { user, loading, signOut };
}
