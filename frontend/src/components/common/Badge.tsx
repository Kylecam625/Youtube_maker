import { HTMLAttributes } from "react";

type BadgeVariant = "primary" | "secondary" | "accent" | "muted" | "success" | "warning" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary/15 text-primary border-primary/30",
  secondary: "bg-secondary/15 text-secondary border-secondary/30",
  accent: "bg-accent/15 text-accent border-accent/30",
  muted: "bg-muted/15 text-muted border-muted/30",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export function Badge({ variant = "primary", size = "sm", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-semibold border-2 rounded-full
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
