import * as React from "react"

import { cn } from "@/app/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-white/[0.08] bg-[#0F172A] px-5 py-3 text-sm text-[#F0F0FB] transition-all file:border-0 file:bg-transparent file:text-sm file:font-black placeholder:text-[#F0F0FB]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] focus-visible:border-primary-blue/20 focus-visible:bg-[#030712] disabled:cursor-not-allowed disabled:opacity-50",
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
