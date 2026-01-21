import { AlertTriangle, CheckSquare } from "lucide-react";

export function TaskSummary({ overdue, dueThisWeek }: { overdue: number; dueThisWeek: number }) {
  if (overdue === 0 && dueThisWeek === 0) return <span className="text-muted-foreground text-sm">—</span>;

  return (
    <div className="flex items-center gap-2 text-sm">
      {overdue > 0 && (
        <span className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="h-3 w-3" />
          {overdue}
        </span>
      )}
      {dueThisWeek > 0 && (
        <span className="flex items-center gap-1 text-amber-600">
          <CheckSquare className="h-3 w-3" />
          {dueThisWeek}
        </span>
      )}
    </div>
  );
}
