import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Image,
  Video,
  Palette,
  Tags,
  Sparkles,
  Lightbulb,
  Mic,
  Captions,
  Film,
} from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/editor", label: "Script Editor", icon: FileText },
  { path: "/assets", label: "Assets", icon: Image },
  { path: "/studio", label: "Recording Studio", icon: Video },
  { path: "/thumbnails", label: "Thumbnails", icon: Palette },
  { path: "/metadata", label: "Metadata", icon: Tags },
  { path: "/ai", label: "AI Tools", icon: Sparkles },
  { path: "/voiceover", label: "Voiceover", icon: Mic },
  { path: "/transcribe", label: "Transcribe", icon: Captions },
  { path: "/broll", label: "B-Roll Video", icon: Film },
  { path: "/ideas", label: "Ideas", icon: Lightbulb },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-surface border-r-3 border-border flex flex-col shrink-0">
      <div className="p-5 border-b-3 border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-neo bg-primary flex items-center justify-center border-2 border-border shadow-neo-sm">
            <Video size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground tracking-tight leading-tight">
              YoutubeMaker
            </h1>
            <p className="text-xs text-muted font-semibold tracking-wide uppercase">
              Studio
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150
              ${
                isActive
                  ? "bg-primary/15 text-primary border-l-[3px] border-primary"
                  : "text-foreground/70 hover:text-foreground hover:bg-foreground/5 border-l-[3px] border-transparent"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t-3 border-border">
        <ThemeSwitcher />
      </div>
    </aside>
  );
}
