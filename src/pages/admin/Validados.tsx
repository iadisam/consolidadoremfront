import { useState, useEffect } from "react";
import { archivosApi } from "@/lib/api";
import { ArchivoSubido } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const Validados = () => {
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    archivosApi
      .listar("validado")
      .then(setArchivos)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Archivos Validados</h1>
        <p className="text-muted-foreground text-sm mt-1">{archivos.length} archivos aprobados</p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Programa</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Encargado</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha Subida</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Validado por</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {archivos.map((a) => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{a.programa}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.usuario_nombre}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.fecha_subida}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.validado_por}</td>
                <td className="px-4 py-3"><StatusBadge status={a.estado} /></td>
                <td className="px-4 py-3">
                  <Button variant="outline" size="sm" onClick={() => archivosApi.descargar(Number(a.id))}>
                    <Download className="w-4 h-4 mr-1" /> Descargar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Validados;
