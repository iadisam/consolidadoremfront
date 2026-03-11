import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { archivosApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const SubirArchivo = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const { toast } = useToast();

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
    try {
      await archivosApi.subir(file);
      setUploaded(true);
      toast({ title: "Archivo subido exitosamente", description: "Pendiente de aprobación por el administrador." });
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Subir Archivo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Programa: <span className="font-semibold text-foreground">{user?.programa}</span>
        </p>
      </div>

      {/* Download template */}
      <div className="bg-card border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Plantilla Base</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Descargue la plantilla SA_26_V1.1.xlsm, complétela con sus datos y luego súbala aquí
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => archivosApi.descargarPlantilla()}>
          <Download className="w-4 h-4 mr-1" /> Descargar SA_26_V1.1.xlsm
        </Button>
      </div>

      {/* Upload zone */}
      {!uploaded && (
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
      {file && !uploaded && (
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

          {validation?.valid && (
            <Button onClick={handleUpload} disabled={uploading} className="w-full sm:w-auto">
              {uploading ? "Subiendo..." : "Subir Archivo al Sistema"}
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
            Su archivo está pendiente de aprobación por el administrador.
          </p>
          <Button variant="outline" onClick={() => { setFile(null); setValidation(null); setUploaded(false); }}>
            Subir otro archivo
          </Button>
        </div>
      )}
    </div>
  );
};

export default SubirArchivo;
