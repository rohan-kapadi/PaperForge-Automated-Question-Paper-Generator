import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: "bg-slate-800 text-slate-200 border border-slate-700",
            success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
            warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
            danger: "bg-red-500/10 text-red-400 border border-red-500/20"
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                    variants[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge }
