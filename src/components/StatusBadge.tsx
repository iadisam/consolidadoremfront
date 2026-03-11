import { FileStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusConfig: Record<FileStatus, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-warning/15 text-warning border-warning/30" },
  validado: { label: "Validado", className: "bg-success/15 text-success border-success/30" },
  rechazado: { label: "Rechazado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  consolidado: { label: "Consolidado", className: "bg-info/15 text-info border-info/30" },
};

const StatusBadge = ({ status }: { status: FileStatus }) => {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", config.className)}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
