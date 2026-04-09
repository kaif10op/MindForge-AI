"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const supabase = createClient();
  const [bootStatus, setBootStatus] = useState<"booting" | "locked">("booting");
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Clock for lock screen
    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    // Check if already booted in this session to avoid repetitive boot screens after logout
    const hasBooted = sessionStorage.getItem("mfos_booted");
    
    if (hasBooted === "true") {
      setBootStatus("locked");
      return;
    }

    // Simulate boot sequence
    const bootDuration = 2500;
    const intervalTime = 50;
    const steps = bootDuration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      // Custom easing curve for the progress bar (starts fast, slows down, finishes fast)
      const easedProgress = Math.pow(currentStep / steps, 1.5) * 100;
      setProgress(Math.min(easedProgress, 100));

      if (currentStep >= steps) {
        clearInterval(interval);
        setTimeout(() => {
          sessionStorage.setItem("mfos_booted", "true");
          setBootStatus("locked");
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen w-full overflow-hidden bg-black flex items-center justify-center font-sans tracking-tight relative select-none">
      
      {/* Dynamic Background matching Desktop Wallpaper for smooth transition, blurred on lock screen */}
      <div 
        className={cn(
          "absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] ease-in-out",
          bootStatus === "booting" ? "opacity-0 scale-105 blur-md" : "opacity-100 scale-100 blur-sm"
        )}
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1542401886-65d6c61db217?q=80&w=3840&auto=format&fit=crop')",
          filter: bootStatus === "locked" ? "brightness(0.6) blur(20px)" : "brightness(0)",
        }} 
      />

      <AnimatePresence mode="wait">
        {bootStatus === "booting" ? (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center z-10"
          >
            <Brain className="w-20 h-20 text-white drop-shadow-lg mb-16" />
            
            {/* macOS styled progress bar */}
            <div className="w-56 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="lock-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center z-10 w-full max-w-sm"
          >
            {/* Lock Screen Clock */}
            <div className="absolute top-16 flex flex-col items-center text-white text-shadow-sm">
               <div className="text-7xl font-light mb-2">{format(time, "HH:mm")}</div>
               <div className="text-xl font-medium">{format(time, "EEEE, MMMM d")}</div>
            </div>

            {/* Login Box */}
            <div className="flex flex-col items-center mt-32">
              <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6 flex items-center justify-center p-1 glow shadow-2xl">
                <Brain className="w-12 h-12 text-white/90" />
              </div>
              
              <h1 className="text-2xl font-medium text-white mb-8 tracking-wide drop-shadow-md">
                MindForge OS
              </h1>

              <Button
                onClick={handleGoogleLogin}
                className="w-full h-12 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur backdrop-saturate-150 rounded-full cursor-pointer transition-all duration-300 group"
              >
                <svg className="w-5 h-5 mr-3 opacity-90 group-hover:opacity-100" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium tracking-wide">Sign in with Google</span>
              </Button>
              
              <div className="mt-8 text-white/50 text-xs font-medium uppercase tracking-widest text-center flex flex-col items-center">
                 <span className="mb-2 w-10 h-0.5 bg-white/20 rounded-full"></span>
                 Press to unlock
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
