import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { archivosApi } from "@/lib/api";
import { ArchivoSubido } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const MisArchivos = () => {
  const { user } = useAuth();
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // La API filtra por usuario automáticamente para rol "encargado"
    archivosApi
      .listar()
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
        <h1 className="text-2xl font-bold font-display text-foreground">Mis Archivos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Programa: <span className="font-semibold text-foreground">{user?.programa}</span>
        </p>
      </div>

      {archivos.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center space-y-4">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <p className="font-semibold text-foreground">No ha subido archivos aún</p>
            <p className="text-sm text-muted-foreground mt-1">Comience subiendo su archivo REM</p>
          </div>
          <Link to="/usuario/subir">
            <Button>
              <Upload className="w-4 h-4 mr-2" /> Subir Archivo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {archivos.map((a) => (
            <div key={a.id} className="bg-card border rounded-xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                    <FileSpreadsheet className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{a.nombre_archivo}</h3>
                    <p className="text-xs text-muted-foreground">Subido el {a.fecha_subida}</p>
                  </div>
                </div>
                <StatusBadge status={a.estado} />
              </div>

              {a.estado === "rechazado" && a.observaciones && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-destructive">Motivo del rechazo:</p>
                    <p className="text-xs text-destructive/80 mt-1">{a.observaciones}</p>
                  </div>
                </div>
              )}

              {a.estado === "rechazado" && (
                <Link to="/usuario/subir">
                  <Button size="sm" variant="outline">
                    <Upload className="w-4 h-4 mr-1" /> Subir nuevo archivo
                  </Button>
                </Link>
              )}

              {a.estado === "validado" && a.validado_por && (
                <p className="text-xs text-muted-foreground">
                  Validado por <span className="font-medium text-foreground">{a.validado_por}</span> el {a.fecha_validacion}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisArchivos;
