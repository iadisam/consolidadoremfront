import { useState, useEffect } from "react";
import { consolidacionesApi } from "@/lib/api";
import { Consolidacion } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import PeriodSelector, { getCurrentPeriodo, formatPeriodo } from "@/components/PeriodSelector";
import { Download, FileSpreadsheet, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const estadoConfig = {
  aprobada: { label: "Aprobada", icon: CheckCircle, className: "bg-success/15 text-success border-success/30" },
  rechazada: { label: "Rechazada", icon: XCircle, className: "bg-destructive/15 text-destructive border-destructive/30" },
  pendiente: { label: "Pendiente", icon: Clock, className: "bg-warning/15 text-warning border-warning/30" },
};

const Historial = () => {
  const [periodo, setPeriodo] = useState(getCurrentPeriodo());
  const [consolidaciones, setConsolidaciones] = useState<Consolidacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    consolidacionesApi
      .listar(periodo)
      .then(setConsolidaciones)
      .finally(() => setLoading(false));
  }, [periodo]);

  // Show all consolidations (approved, rejected, pending) in history
  const aprobadas = consolidaciones.filter((c) => c.estado === "aprobada");
  const otras = consolidaciones.filter((c) => c.estado !== "aprobada");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Historial de Consolidaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {aprobadas.length} aprobada(s), {consolidaciones.length} total — {formatPeriodo(periodo)}
          </p>
        </div>
        <PeriodSelector periodo={periodo} onChange={setPeriodo} />
      </div>

      {consolidaciones.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground">Sin consolidaciones</p>
          <p className="text-sm text-muted-foreground">No hay consolidaciones en {formatPeriodo(periodo)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consolidaciones.map((c) => {
            const config = estadoConfig[c.estado] || estadoConfig.pendiente;
            const Icon = config.icon;
            return (
              <div key={c.id} className="bg-card border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info/10">
                    <FileSpreadsheet className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm">{c.nombre_archivo}</h3>
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", config.className)}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.fecha} · {c.archivos_count} programas · Por {c.creado_por}
                    </p>
                    {c.observaciones_revision && (
                      <p className="text-xs text-muted-foreground/80 mt-0.5 italic">
                        "{c.observaciones_revision}"
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => consolidacionesApi.descargar(Number(c.id))}>
                  <Download className="w-4 h-4 mr-1" /> Descargar
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Historial;
