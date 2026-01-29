import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-green-100 text-green-800 hover:bg-green-100",
    sourcing: "bg-muted text-muted-foreground hover:bg-muted",
    closing: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    closed: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    dead: "bg-red-100 text-red-800 hover:bg-red-100",
  };
  return (
    <Badge className={styles[status] || styles.sourcing}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
