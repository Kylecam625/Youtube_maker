import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  is_open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ is_open, onClose, title, children, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (is_open) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [is_open, onClose]);

  if (!is_open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className={`
          w-full ${sizeClasses[size]} bg-surface border-3 border-border rounded-neo
          shadow-neo-lg mx-4 max-h-[85vh] flex flex-col
          animate-[modal-in_150ms_ease-out]
        `}
      >
        <div className="flex items-center justify-between p-4 border-b-3 border-border">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border-2 border-border rounded-lg
                       text-muted hover:bg-primary hover:text-white hover:border-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
