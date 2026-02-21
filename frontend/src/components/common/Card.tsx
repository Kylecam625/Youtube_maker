import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, padding = "md", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          neo-card ${paddingClasses[padding]}
          ${hover ? "transition-all duration-150 hover:shadow-neo-hover hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
