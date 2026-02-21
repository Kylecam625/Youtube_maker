import { useMemo, useState } from "react";
import { Card } from "@/components/common";
import { Project } from "@/stores/projects";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarViewProps {
  projects: Project[];
}

export function CalendarView({ projects }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const projectsByDate = useMemo(() => {
    const map = new Map<string, Project[]>();
    projects.forEach((p) => {
      if (!p.due_date) return;
      const dateStr = new Date(p.due_date).toISOString().split("T")[0];
      const existing = map.get(dateStr) || [];
      map.set(dateStr, [...existing, p]);
    });
    return map;
  }, [projects]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const today = new Date().toISOString().split("T")[0];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <Card padding="none">
      <div className="flex items-center justify-between p-4 border-b-3 border-border">
        <button onClick={prevMonth} className="p-1 hover:bg-background rounded-lg">
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-bold text-lg">{monthName}</h3>
        <button onClick={nextMonth} className="p-1 hover:bg-background rounded-lg">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="p-2 text-center text-xs font-bold text-muted border-b-2 border-border/20">
            {d}
          </div>
        ))}

        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="p-2 min-h-[80px] border-b border-r border-border/10" />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayProjects = projectsByDate.get(dateStr) || [];
          const isToday = dateStr === today;

          return (
            <div
              key={day}
              className={`p-1.5 min-h-[80px] border-b border-r border-border/10 ${
                isToday ? "bg-primary/10" : ""
              }`}
            >
              <span className={`text-xs font-semibold ${isToday ? "text-primary" : "text-muted"}`}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayProjects.map((p) => (
                  <div
                    key={p.id}
                    className="text-xs px-1 py-0.5 rounded bg-primary/20 text-foreground truncate font-medium cursor-pointer hover:bg-primary/30"
                    title={p.title}
                  >
                    {p.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
