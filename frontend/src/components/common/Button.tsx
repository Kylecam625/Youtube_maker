import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  is_loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:brightness-110",
  secondary: "bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25",
  accent: "bg-accent text-white hover:brightness-110",
  ghost: "bg-transparent text-foreground hover:bg-foreground/10 border-transparent shadow-none hover:shadow-none",
  danger: "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", is_loading, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || is_loading}
        className={`
          neo-btn ${variantClasses[variant]} ${sizeClasses[size]}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
        {...props}
      >
        {is_loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
