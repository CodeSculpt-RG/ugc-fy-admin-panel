"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Admin Boundary Caught Error:", error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center p-6 bg-background text-foreground">
      <div className="flex max-w-md flex-col items-center justify-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-error/10 border border-error/20 shadow-xl shadow-error/10">
          <AlertTriangle className="h-10 w-10 text-error" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong!</h2>
          <p className="text-sm font-medium text-foreground/60 max-w-[300px] mx-auto leading-relaxed">
            {error.message || "An unexpected system error occurred within the administration panel."}
          </p>
        </div>

        <Button
          onClick={() => reset()}
          className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] shadow-glow hover:bg-primary/90 transition-all"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
