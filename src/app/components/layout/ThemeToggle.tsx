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
      className="p-3 bg-surface border border-border text-text-secondary hover:text-foreground hover:bg-surface-elevated rounded-2xl transition-all active:scale-95 flex items-center justify-center"
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
