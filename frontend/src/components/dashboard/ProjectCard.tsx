import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Badge, Button } from "@/components/common";
import { useProjectsStore, Project, ProjectStatus } from "@/stores/projects";
import { FileText, Video, Trash2, ArrowRight, CheckSquare, Square } from "lucide-react";
import { STATUSES } from "./Dashboard";

const DEFAULT_CHECKLIST = [
  "Script written",
  "Script reviewed",
  "Thumbnail created",
  "Description written",
  "Tags added",
  "Recording done",
];

function getChecklistKey(projectId: string): string {
  return `project-checklist-${projectId}`;
}

function loadCheckedItems(projectId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getChecklistKey(projectId));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveCheckedItems(projectId: string, checked: Set<string>): void {
  localStorage.setItem(getChecklistKey(projectId), JSON.stringify([...checked]));
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const { deleteProject, updateProject } = useProjectsStore();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() =>
    loadCheckedItems(project.id)
  );

  useEffect(() => {
    saveCheckedItems(project.id, checkedItems);
  }, [project.id, checkedItems]);

  const toggleItem = useCallback((item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }, []);

  const statusInfo = STATUSES.find((s) => s.value === project.status);
  const statusIdx = STATUSES.findIndex((s) => s.value === project.status);
  const nextStatus = statusIdx < STATUSES.length - 1 ? STATUSES[statusIdx + 1] : null;
  const completedCount = DEFAULT_CHECKLIST.filter((i) => checkedItems.has(i)).length;

  return (
    <Card hover className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-lg text-foreground leading-tight">
          {project.title}
        </h3>
        <Badge variant={project.status === "publish" ? "success" : "primary"}>
          {statusInfo?.label}
        </Badge>
      </div>

      {project.description && (
        <p className="text-sm text-muted line-clamp-2">
          {project.description}
        </p>
      )}

      {project.due_date && (
        <p className="text-xs text-muted">
          Due: {new Date(project.due_date).toLocaleDateString()}
        </p>
      )}

      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted uppercase tracking-wide">
            Checklist
          </span>
          <span className={`text-xs font-bold ${completedCount === DEFAULT_CHECKLIST.length ? "text-emerald-400" : "text-muted"}`}>
            {completedCount}/{DEFAULT_CHECKLIST.length}
          </span>
        </div>
        <div className="w-full bg-foreground/10 rounded-full h-1.5">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / DEFAULT_CHECKLIST.length) * 100}%` }}
          />
        </div>
        <ul className="space-y-0.5">
          {DEFAULT_CHECKLIST.map((item) => {
            const is_checked = checkedItems.has(item);
            return (
              <li key={item}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(item);
                  }}
                  className={`flex items-center gap-1.5 w-full text-left text-xs py-0.5 rounded transition-colors hover:bg-foreground/5 ${
                    is_checked ? "text-muted line-through" : "text-foreground"
                  }`}
                >
                  {is_checked ? (
                    <CheckSquare size={13} className="text-primary shrink-0" />
                  ) : (
                    <Square size={13} className="text-muted shrink-0" />
                  )}
                  {item}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center gap-2 mt-auto pt-2 border-t-2 border-border/20">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`/editor/${project.id}`)}
          title="Edit Script"
        >
          <FileText size={14} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`/studio/${project.id}`)}
          title="Record"
        >
          <Video size={14} />
        </Button>

        {nextStatus && (
          <Button
            size="sm"
            variant="accent"
            className="ml-auto"
            onClick={() => updateProject(project.id, { status: nextStatus.value as ProjectStatus })}
            title={`Move to ${nextStatus.label}`}
          >
            <ArrowRight size={14} />
          </Button>
        )}

        <Button
          size="sm"
          variant="danger"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this project?")) deleteProject(project.id);
          }}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </Card>
  );
}
