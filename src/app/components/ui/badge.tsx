import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/app/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary",
        secondary:
          "border-border bg-surface-elevated hover:bg-foreground/5 text-foreground/60",
        destructive:
          "border-accent-orange/20 bg-accent-orange/10 text-accent-orange",
        outline: "text-foreground/40 border-border bg-transparent",
        success: "border-success-green/20 bg-success-green/10 text-success-green",

      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
