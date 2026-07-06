import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/app/lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-full text-sm font-semibold tracking-normal transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] active:duration-75",
  {
    variants: {
      variant: {
        default:
          "ugcfy-gradient-cta text-white hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-red-500 text-white shadow-[0_12px_24px_-8px_rgba(239,68,68,0.4)] hover:bg-red-600 hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-black/5 bg-white/75 text-foreground/70 shadow-sm hover:bg-white hover:text-foreground hover:shadow-md active:bg-white transition-all",
        secondary:
          "bg-neutral-950 text-white hover:bg-neutral-800 border border-transparent",
        ghost: "text-foreground/60 hover:bg-white/65 hover:text-foreground",
        link: "text-orange-600 underline-offset-8 hover:underline decoration-2 font-semibold",

      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-8 text-sm",
        icon: "h-11 w-11 rounded-full",
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
