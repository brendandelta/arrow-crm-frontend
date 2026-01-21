import { formatDate } from "./utils";

export function CloseCountdown({ daysUntilClose, expectedClose }: { daysUntilClose: number | null; expectedClose: string | null }) {
  if (daysUntilClose === null || expectedClose === null) return <span className="text-muted-foreground">—</span>;

  const isUrgent = daysUntilClose <= 7;
  const isPast = daysUntilClose < 0;

  return (
    <div className={`text-sm ${isPast ? "text-red-600" : isUrgent ? "text-amber-600" : ""}`}>
      <div className="font-medium">{formatDate(expectedClose)}</div>
      <div className="text-xs text-muted-foreground">
        {isPast
          ? `${Math.abs(daysUntilClose)}d overdue`
          : daysUntilClose === 0
          ? "Today"
          : `${daysUntilClose}d`}
      </div>
    </div>
  );
}
