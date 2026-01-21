import { Users } from "lucide-react";

export function OutreachSummary({ targetsNeedingFollowup, activeTargets }: { targetsNeedingFollowup: number; activeTargets: number }) {
  if (activeTargets === 0) return <span className="text-muted-foreground text-sm">—</span>;

  return (
    <div className="text-sm">
      {targetsNeedingFollowup > 0 ? (
        <span className="flex items-center gap-1 text-amber-600">
          <Users className="h-3 w-3" />
          {targetsNeedingFollowup}/{activeTargets}
        </span>
      ) : (
        <span className="text-muted-foreground">{activeTargets} active</span>
      )}
    </div>
  );
}
