import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

        const variants = {
            default: "bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-lg hover:shadow-xl",
            outline: "border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white",
            ghost: "hover:bg-slate-800 text-slate-400 hover:text-white",
            destructive: "bg-red-600 text-white hover:bg-red-700 shadow-lg"
        }

        const sizes = {
            default: "h-11 px-6 py-2",
            sm: "h-9 px-4 text-sm",
            lg: "h-12 px-8 text-lg",
            icon: "h-10 w-10"
        }

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
