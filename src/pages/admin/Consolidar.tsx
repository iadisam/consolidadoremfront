import { useState, useEffect } from "react";
import { archivosApi, consolidacionesApi, programasApi } from "@/lib/api";
import { ArchivoSubido } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Consolidar = () => {
  const [validados, setValidados] = useState<ArchivoSubido[]>([]);
  const [programas, setProgramas] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [consolidating, setConsolidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultId, setResultId] = useState<number | null>(null);
  const [phase, setPhase] = useState("");
  const [done, setDone] = useState(false);
  const [resultFile, setResultFile] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      archivosApi.listar("validado"),
      programasApi.listar(),
    ])
      .then(([arch, progs]) => {
        setValidados(arch);
        setProgramas(progs);
      })
      .finally(() => setLoading(false));
  }, []);

  const canConsolidate = validados.length >= 2;

  const handleConsolidate = async () => {
    setConsolidating(true);
    setProgress(0);
    setDone(false);

    const phases = [
      { p: 10, text: "📂 Cargando plantilla base SA_26_V1.1.xlsm..." },
      { p: 30, text: "🔍 Identificando celdas editables..." },
      { p: 50, text: `🔄 Procesando ${validados.length} archivos...` },
      { p: 80, text: "📝 Consolidando datos..." },
    ];

    for (const ph of phases) {
      setProgress(ph.p);
      setPhase(ph.text);
      await new Promise((r) => setTimeout(r, 500));
    }

    try {
      const ids = validados.map((a) => Number(a.id));
      const result = await consolidacionesApi.consolidar(ids);
      setProgress(100);
      setPhase("✅ Consolidación completada");
      setResultFile(result.archivo);
      setResultId(result.consolidacion_id);
      setDone(true);
      toast({ title: "¡Consolidación completada!", description: "El archivo consolidado está listo para descargar." });
    } catch (err: any) {
      toast({ title: "Error en consolidación", description: err.message, variant: "destructive" });
    } finally {
      setConsolidating(false);
    }
  };

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
        <h1 className="text-2xl font-bold font-display text-foreground">Consolidar Archivos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {validados.length} de {programas.length} archivos validados
        </p>
      </div>

      {/* Program checklist */}
      <div className="bg-card border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Archivos Validados</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {programas.map((p) => {
            const isValidated = validados.some((a) => a.programa === p.nombre);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
                  isValidated
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-muted/50 border-border text-muted-foreground"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{p.nombre}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consolidation progress */}
      {consolidating && (
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span className="text-sm font-medium text-foreground">Consolidando...</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{phase}</p>
          <p className="text-xs text-muted-foreground">{progress}% completado</p>
        </div>
      )}

      {done && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center space-y-4">
          <FileSpreadsheet className="w-12 h-12 text-success mx-auto" />
          <div>
            <h3 className="font-bold text-foreground text-lg">¡Consolidación Exitosa!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Se consolidaron {validados.length} archivos correctamente
            </p>
          </div>
          <Button onClick={() => resultId && consolidacionesApi.descargar(resultId)}>
            <Download className="w-4 h-4 mr-2" /> Descargar {resultFile}
          </Button>
        </div>
      )}

      {!consolidating && !done && (
        <Button
          size="lg"
          disabled={!canConsolidate}
          onClick={handleConsolidate}
          className="w-full sm:w-auto"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Iniciar Consolidación ({validados.length} archivos)
        </Button>
      )}
    </div>
  );
};

export default Consolidar;
