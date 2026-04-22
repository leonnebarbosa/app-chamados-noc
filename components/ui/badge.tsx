import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        warning:
          "border-transparent bg-orange-500 text-white hover:bg-orange-600",
        success:
          "border-transparent bg-green-600 text-white hover:bg-green-700",
        critical:
          "border-transparent bg-red-500 text-white animate-pulse-slow",
        high:
          "border-transparent bg-orange-500 text-white",
        medium:
          "border-transparent bg-yellow-500 text-black",
        low:
          "border-transparent bg-green-500 text-white",
        "impacto-critico":
          "border-red-500/40 bg-red-500/10 text-red-500",
        "impacto-alto":
          "border-orange-500/40 bg-orange-500/10 text-orange-500",
        "impacto-medio":
          "border-yellow-500/40 bg-yellow-500/10 text-yellow-700",
        "impacto-baixo":
          "border-green-500/40 bg-green-500/10 text-green-600",
        "status-aberto":
          "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        "status-andamento":
          "border-transparent bg-violet-500 text-white hover:bg-violet-600",
        "status-aguardando":
          "border-transparent bg-amber-400 text-amber-950 hover:bg-amber-500",
        "status-resolvido":
          "border-transparent bg-emerald-600 text-white hover:bg-emerald-700",
        "status-fechado":
          "border-transparent bg-slate-400 text-white hover:bg-slate-500",
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

