import type { RoomStatus } from "@/lib/store";

const styles: Record<RoomStatus, { dot: string; label: string; text: string; bg: string }> = {
  available: { dot: "bg-success", label: "Available", text: "text-success", bg: "bg-success/10" },
  soon: { dot: "bg-warning", label: "Reserved Soon", text: "text-warning-foreground", bg: "bg-warning/20" },
  occupied: { dot: "bg-destructive", label: "Occupied", text: "text-destructive", bg: "bg-destructive/10" },
};

export function StatusBadge({ status }: { status: RoomStatus }) {
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${s.bg} ${s.text}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot} ${status !== "available" ? "animate-pulse" : ""}`} />
      {s.label}
    </span>
  );
}
