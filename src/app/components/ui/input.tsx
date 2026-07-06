import * as React from "react"

import { cn } from "@/app/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-black/5 bg-white/75 px-5 py-3 text-sm text-foreground shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-text-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-orange-500/20 focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />

    )
  }
)
Input.displayName = "Input"

export { Input }
