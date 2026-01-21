// Status badge component for displaying various statuses across the CRM
// Used for deals, blocks, interests, and other entity statuses

const STATUS_STYLES: Record<string, string> = {
  // Deal statuses
  sourcing: "bg-slate-100 text-slate-700",
  live: "bg-blue-100 text-blue-700",
  closing: "bg-amber-100 text-amber-700",
  closed: "bg-green-100 text-green-700",
  dead: "bg-red-100 text-red-700",
  // Block statuses
  available: "bg-green-100 text-green-700",
  reserved: "bg-amber-100 text-amber-700",
  sold: "bg-slate-100 text-slate-700",
  withdrawn: "bg-slate-100 text-slate-500",
  // Interest statuses
  prospecting: "bg-slate-100 text-slate-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  committed: "bg-purple-100 text-purple-700",
  funded: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-700";
  const displayText = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {displayText}
    </span>
  );
}
