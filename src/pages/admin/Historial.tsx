import { useState, useEffect } from "react";
import { consolidacionesApi } from "@/lib/api";
import { Consolidacion } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import PeriodSelector, { getCurrentPeriodo, formatPeriodo } from "@/components/PeriodSelector";
import { Download, FileSpreadsheet } from "lucide-react";

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
          <p className="text-muted-foreground text-sm mt-1">{consolidaciones.length} consolidaciones — {formatPeriodo(periodo)}</p>
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
          {consolidaciones.map((c) => (
            <div key={c.id} className="bg-card border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info/10">
                  <FileSpreadsheet className="w-5 h-5 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{c.nombre_archivo}</h3>
                  <p className="text-xs text-muted-foreground">
                    {c.fecha} · {c.archivos_count} programas · Por {c.creado_por}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => consolidacionesApi.descargar(Number(c.id))}>
                <Download className="w-4 h-4 mr-1" /> Descargar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Historial;
