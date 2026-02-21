import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-foreground">{label}</label>
        )}
        <input
          ref={ref}
          className={`neo-input ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        />
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-foreground">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`neo-input resize-y min-h-[100px] ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        />
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
