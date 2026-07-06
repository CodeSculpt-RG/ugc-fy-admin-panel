"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import { cn } from "@/app/lib/utils";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="flex h-11 w-11 items-center justify-center rounded-[24px] border border-white/70 bg-white/85 text-neutral-600 shadow-sm backdrop-blur-2xl transition-all hover:bg-white hover:text-neutral-950 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 active:scale-95"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          className={cn(
            "absolute w-full h-full transition-all duration-500",
            isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
          )}
        />
        <Moon
          className={cn(
            "absolute w-full h-full transition-all duration-500",
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
          )}
        />
      </div>
    </button>
  );
}
