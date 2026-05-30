import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/app/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.96] active:duration-75",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-[0_12px_24px_-8px_rgba(37,99,235,0.4)] hover:bg-primary/90 hover:shadow-[0_18px_36px_-8px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-accent-orange text-white shadow-[0_12px_24px_-8px_rgba(249,115,22,0.4)] hover:bg-accent-orange/90 hover:shadow-[0_18px_36px_-8px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-border bg-surface-elevated text-foreground/60 hover:bg-surface-elevated hover:border-border hover:text-foreground hover:shadow-xl active:bg-surface-elevated transition-all",
        secondary:
          "bg-surface-elevated hover:bg-foreground/5 text-foreground hover:bg-surface-elevated hover:text-foreground border border-transparent hover:border-border",
        ghost: "text-foreground/40 hover:bg-surface-elevated hover:bg-foreground/5 hover:text-foreground",
        link: "text-primary underline-offset-8 hover:underline decoration-2 font-black",

      },
      size: {
        default: "h-12 px-8 py-3",
        sm: "h-10 rounded-xl px-5 text-[10px]",
        lg: "h-16 rounded-[20px] px-12 text-[12px]",
        icon: "h-12 w-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
