import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { archivosApi } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { ArchivoSubido } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { getCurrentPeriodo, formatPeriodo } from "@/components/PeriodSelector";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download, Calendar, AlertTriangle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface MesValidationError {
  mesArchivo: string;
  anioArchivo: number;
  mesEsperado: string;
  anioEsperado: number;
  ayuda: string;
}

const SubirArchivo = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [mesError, setMesError] = useState<MesValidationError | null>(null);
  const [archivoExistente, setArchivoExistente] = useState<ArchivoSubido | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const { toast } = useToast();

  const periodo = getCurrentPeriodo();

  // Verificar si ya existe un archivo para este periodo
  useEffect(() => {
    setCheckingExisting(true);
    archivosApi
      .listar(undefined, periodo)
      .then((archivos) => {
        // Buscar archivo activo del usuario para este periodo
        const existente = archivos.find(
          (a) => a.estado !== "rechazado"
        );
        setArchivoExistente(existente || null);
      })
      .catch(() => setArchivoExistente(null))
      .finally(() => setCheckingExisting(false));
  }, [periodo, uploaded]);

  const canUpload = !archivoExistente;

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setUploaded(false);

    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsm") {
      setValidation({ valid: false, errors: ["Formato no válido. Solo se aceptan archivos .xlsm"] });
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setValidation({ valid: false, errors: ["El archivo excede el tamaño máximo de 50 MB"] });
      return;
    }

    setTimeout(() => {
      setValidation({ valid: true, errors: [] });
    }, 500);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMesError(null);
    try {
      await archivosApi.subir(file, undefined, periodo);
      setUploaded(true);
      setFile(null);
      setValidation(null);
      toast({ title: "Archivo subido exitosamente", description: `Periodo: ${formatPeriodo(periodo)}. Pendiente de aprobación.` });
    } catch (err: any) {
      const structured = err?.structured;
      if (structured && structured.error === "Validación de mes fallida") {
        setMesError({
          mesArchivo: structured.mes_archivo,
          anioArchivo: structured.anio_archivo,
          mesEsperado: structured.mes_esperado,
          anioEsperado: structured.anio_esperado,
          ayuda: structured.ayuda,
        });
      } else {
        toast({ title: "Error al subir", description: err.message, variant: "destructive" });
      }
    } finally {
      setUploading(false);
    }
  };

  if (checkingExisting) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Subir Archivo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Programa: <span className="font-semibold text-foreground">{user?.programa}</span>
        </p>
      </div>

      {/* Active period indicator */}
      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
        <Calendar className="w-5 h-5 text-accent" />
        <div>
          <p className="text-sm font-semibold text-foreground">Periodo activo: {formatPeriodo(periodo)}</p>
          <p className="text-xs text-muted-foreground">El archivo se registrará para este periodo mensual</p>
        </div>
      </div>

      {/* Download template */}
      <div className="bg-card border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Plantilla Base</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Descargue la plantilla SA_26_V1.2.xlsm, complétela con sus datos y luego súbala aquí
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => archivosApi.descargarPlantilla()}>
          <Download className="w-4 h-4 mr-1" /> Descargar SA_26_V1.2.xlsm
        </Button>
      </div>

      {/* Blocked: already has active file */}
      {!canUpload && !uploaded && archivoExistente && (
        <div className="bg-muted/50 border border-border rounded-xl p-8 text-center space-y-3">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-foreground text-lg">Ya tiene un archivo para {formatPeriodo(periodo)}</h3>
          <p className="text-sm text-muted-foreground">
            Su archivo <span className="font-semibold text-foreground">{archivoExistente.nombre_archivo}</span> se encuentra en estado{" "}
            <span className="font-semibold text-foreground">{archivoExistente.estado}</span>.
          </p>
          <p className="text-xs text-muted-foreground">
            Solo podrá subir un nuevo archivo si el administrador rechaza el actual.
          </p>
          <Link to="/usuario/archivos">
            <Button variant="outline" size="sm" className="mt-2">
              <FileSpreadsheet className="w-4 h-4 mr-1" /> Ver mis archivos
            </Button>
          </Link>
        </div>
      )}

      {/* Upload zone - only if allowed */}
      {canUpload && !uploaded && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept=".xlsm"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">
            Arrastra tu archivo aquí o <span className="text-accent">haz clic para seleccionar</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">Formato: .xlsm · Máximo: 50 MB</p>
        </div>
      )}

      {/* Selected file */}
      {file && canUpload && !uploaded && (
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>

          {validation && (
            <div className={`rounded-lg p-4 ${validation.valid ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"}`}>
              <div className="flex items-center gap-2 mb-2">
                {validation.valid ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-sm font-semibold text-success">Archivo válido y listo para subir</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-destructive" />
                    <span className="text-sm font-semibold text-destructive">Archivo inválido</span>
                  </>
                )}
              </div>
              {validation.errors.length > 0 && (
                <ul className="space-y-1 ml-7">
                  {validation.errors.map((err, i) => (
                    <li key={i} className="text-xs text-destructive">{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {mesError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-sm font-semibold text-destructive">El archivo no corresponde al mes esperado</span>
              </div>
              <div className="ml-7 space-y-1 text-xs">
                <p className="text-destructive">
                  <span className="font-medium">Mes del archivo:</span> {mesError.mesArchivo} {mesError.anioArchivo}
                </p>
                <p className="text-destructive">
                  <span className="font-medium">Mes esperado:</span> {mesError.mesEsperado} {mesError.anioEsperado}
                </p>
                <p className="text-destructive/80 mt-1">{mesError.ayuda}</p>
              </div>
            </div>
          )}

          {validation?.valid && (
            <Button onClick={handleUpload} disabled={uploading} className="w-full sm:w-auto">
              {uploading ? "Subiendo..." : `Subir Archivo — ${formatPeriodo(periodo)}`}
            </Button>
          )}
        </div>
      )}

      {/* Success */}
      {uploaded && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-8 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-success mx-auto" />
          <h3 className="font-bold text-foreground text-lg">¡Archivo subido exitosamente!</h3>
          <p className="text-sm text-muted-foreground">
            Periodo: {formatPeriodo(periodo)} · Pendiente de aprobación por el administrador.
          </p>
          <Link to="/usuario/archivos">
            <Button variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-1" /> Ver mis archivos
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default SubirArchivo;
