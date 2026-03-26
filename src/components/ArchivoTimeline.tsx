import { Upload, CheckCircle, XCircle, FileSpreadsheet, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogEntry {
  id: string;
  accion: string;
  detalle: string | null;
  usuario_nombre: string;
  fecha: string;
}

const accionConfig: Record<string, { icon: typeof Upload; color: string; label: string }> = {
  subida: { icon: Upload, color: "text-info", label: "Archivo subido" },
  validacion: { icon: CheckCircle, color: "text-success", label: "Archivo validado" },
  rechazo: { icon: XCircle, color: "text-destructive", label: "Archivo rechazado" },
  consolidacion: { icon: FileSpreadsheet, color: "text-primary", label: "Incluido en consolidación" },
  resubida: { icon: RefreshCw, color: "text-warning", label: "Archivo re-subido" },
};

const fallback = { icon: Clock, color: "text-muted-foreground", label: "Acción" };

const ArchivoTimeline = ({ logs, loading }: { logs: LogEntry[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
        Cargando historial...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">Sin historial de actividad registrado.</p>
    );
  }

  return (
    <div className="relative pl-4 space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

      {logs.map((log, i) => {
        const config = accionConfig[log.accion] || fallback;
        const Icon = config.icon;
        return (
          <div key={log.id} className="relative flex items-start gap-3 py-2">
            <div className={cn("relative z-10 flex items-center justify-center w-4 h-4 rounded-full bg-card border border-border shrink-0 -ml-4", config.color)}>
              <Icon className="w-2.5 h-2.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-xs font-semibold", config.color)}>{config.label}</span>
                <span className="text-[10px] text-muted-foreground">{formatFecha(log.fecha)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                por <span className="font-medium text-foreground">{log.usuario_nombre}</span>
              </p>
              {log.detalle && (
                <p className="text-xs text-muted-foreground/80 mt-0.5 italic">"{log.detalle}"</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function formatFecha(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-CL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export default ArchivoTimeline;
