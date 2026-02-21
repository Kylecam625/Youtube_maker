import { useEffect, useState } from "react";
import { useProjectsStore, ProjectStatus } from "@/stores/projects";
import { Button, Card, Badge } from "@/components/common";
import { Plus, LayoutGrid, List, Calendar, Columns3 } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import { KanbanBoard } from "./KanbanBoard";
import { CalendarView } from "./CalendarView";
import { NewProjectModal } from "./NewProjectModal";

const STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: "idea", label: "Idea", color: "bg-muted" },
  { value: "research", label: "Research", color: "bg-blue-400" },
  { value: "script", label: "Script", color: "bg-purple-400" },
  { value: "record", label: "Record", color: "bg-orange-400" },
  { value: "edit", label: "Edit", color: "bg-yellow-400" },
  { value: "review", label: "Review", color: "bg-pink-400" },
  { value: "publish", label: "Published", color: "bg-emerald-400" },
];

export { STATUSES };

type ViewMode = "kanban" | "grid" | "list" | "calendar";

const VIEW_MODES: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: "kanban", icon: Columns3, label: "Kanban" },
  { mode: "grid", icon: LayoutGrid, label: "Grid" },
  { mode: "list", icon: List, label: "List" },
  { mode: "calendar", icon: Calendar, label: "Calendar" },
];

export function Dashboard() {
  const { projects, is_loading, fetchProjects } = useProjectsStore();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "all">("all");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects =
    filterStatus === "all"
      ? projects
      : projects.filter((p) => p.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Dashboard</h1>
          <p className="text-muted mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in pipeline
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus size={18} className="mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-surface border-3 border-border rounded-neo overflow-hidden">
          {VIEW_MODES.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                viewMode === mode
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground hover:bg-background"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | "all")}
          className="neo-input w-auto"
        >
          <option value="all">All Stages</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {is_loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard projects={filteredProjects} statuses={STATUSES} />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {filteredProjects.length === 0 && (
            <Card className="col-span-full text-center py-16">
              <p className="text-muted text-lg">No projects yet</p>
              <p className="text-muted/60 text-sm mt-1">Create your first project to get started</p>
            </Card>
          )}
        </div>
      ) : viewMode === "list" ? (
        <Card padding="none">
          <table className="w-full">
            <thead>
              <tr className="border-b-3 border-border text-left">
                <th className="p-3 font-bold text-foreground">Title</th>
                <th className="p-3 font-bold text-foreground">Status</th>
                <th className="p-3 font-bold text-foreground">Due Date</th>
                <th className="p-3 font-bold text-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id} className="border-b border-border/30 hover:bg-foreground/5 cursor-pointer transition-colors">
                  <td className="p-3 font-semibold text-foreground">{project.title}</td>
                  <td className="p-3">
                    <Badge variant={project.status === "publish" ? "success" : "primary"}>
                      {STATUSES.find((s) => s.value === project.status)?.label}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted">
                    {project.due_date ? new Date(project.due_date).toLocaleDateString() : "\u2014"}
                  </td>
                  <td className="p-3 text-muted">
                    {new Date(project.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <CalendarView projects={filteredProjects} />
      )}

      <NewProjectModal is_open={showNewModal} onClose={() => setShowNewModal(false)} />
    </div>
  );
}
