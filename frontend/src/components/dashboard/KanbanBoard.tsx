import { useState } from "react";
import { Project, ProjectStatus, useProjectsStore } from "@/stores/projects";
import { ProjectCard } from "./ProjectCard";

interface KanbanBoardProps {
  projects: Project[];
  statuses: { value: ProjectStatus; label: string; color: string }[];
}

export function KanbanBoard({ projects, statuses }: KanbanBoardProps) {
  const { updateProject } = useProjectsStore();
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => {
        const columnProjects = projects.filter((p) => p.status === status.value);
        const is_drag_over = dragOverColumn === status.value;

        return (
          <div
            key={status.value}
            className={`min-w-[280px] flex-shrink-0 rounded-neo p-3 transition-colors duration-150 ${
              is_drag_over ? "bg-primary/10 ring-2 ring-primary/30" : "bg-surface/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(status.value);
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => {
              setDragOverColumn(null);
              const projectId = e.dataTransfer.getData("projectId");
              if (projectId) {
                updateProject(projectId, { status: status.value });
              }
            }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-3 h-3 rounded-full ${status.color}`} />
              <h3 className="font-bold text-sm text-foreground">{status.label}</h3>
              <span className="text-xs font-semibold text-muted ml-auto bg-foreground/5 px-1.5 py-0.5 rounded-md">
                {columnProjects.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnProjects.map((project) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("projectId", project.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <ProjectCard project={project} />
                </div>
              ))}
              {columnProjects.length === 0 && (
                <div className={`border-2 border-dashed rounded-neo p-6 text-center text-sm transition-colors ${
                  is_drag_over ? "border-primary/50 text-primary" : "border-border/40 text-muted"
                }`}>
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
