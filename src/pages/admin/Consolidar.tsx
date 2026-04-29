import { useState, useEffect } from "react";
import { archivosApi, consolidacionesApi, programasApi } from "@/lib/api";
import { ArchivoSubido, Consolidacion } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import PeriodSelector, { getCurrentPeriodo, formatPeriodo } from "@/components/PeriodSelector";
import { CheckSquare, FileSpreadsheet, Download, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Consolidar = () => {
  const [periodo, setPeriodo] = useState(getCurrentPeriodo());
  const [validados, setValidados] = useState<ArchivoSubido[]>([]);
  const [programas, setProgramas] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [consolidating, setConsolidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");

  // Post-consolidation review state
  const [pendiente, setPendiente] = useState<Consolidacion | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [validating, setValidating] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    setShowRejectForm(false);
    setObservaciones("");
    Promise.all([
      archivosApi.listar("validado", periodo),
      programasApi.listar(),
      consolidacionesApi.listar(periodo),
    ])
      .then(([arch, progs, cons]) => {
        setValidados(arch);
        setProgramas(progs);
        // Check if there's a pending consolidation for this period
        const pending = cons.find((c) => c.estado === "pendiente");
        setPendiente(pending || null);
      })
      .finally(() => setLoading(false));
  }, [periodo]);

  const canConsolidate = validados.length >= 2 && !pendiente;

  const handleConsolidate = async () => {
    setConsolidating(true);
    setProgress(0);

    const phases = [
      { p: 10, text: "📂 Cargando plantilla base SA_26_V1.2.xlsm..." },
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
      const result = await consolidacionesApi.consolidar(ids, periodo);
      setProgress(100);
      setPhase("✅ Consolidación generada — pendiente de revisión");

      // Reload consolidations to get the pending one
      const cons = await consolidacionesApi.listar(periodo);
      const pending = cons.find((c) => c.estado === "pendiente");
      setPendiente(pending || null);

      toast({
        title: "Consolidación generada",
        description: "Descarga y revisa el archivo antes de aprobar.",
      });
    } catch (err: any) {
      toast({ title: "Error en consolidación", description: err.message, variant: "destructive" });
    } finally {
      setConsolidating(false);
    }
  };

  const handleApprove = async () => {
    if (!pendiente) return;
    setValidating(true);
    try {
      await consolidacionesApi.validar(Number(pendiente.id), "aprobada");
      toast({
        title: "✅ REM del mes cerrado",
        description: `Consolidación de ${formatPeriodo(periodo)} aprobada exitosamente.`,
      });
      setPendiente(null);
      // Reload validated files (they should now be 'consolidado')
      const arch = await archivosApi.listar("validado", periodo);
      setValidados(arch);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setValidating(false);
    }
  };

  const handleReject = async () => {
    if (!pendiente || !observaciones.trim()) return;
    setValidating(true);
    try {
      await consolidacionesApi.validar(Number(pendiente.id), "rechazada", observaciones.trim());
      toast({
        title: "Consolidación rechazada",
        description: "Puedes volver a consolidar los archivos.",
      });
      setPendiente(null);
      setShowRejectForm(false);
      setObservaciones("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setValidating(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Consolidar Archivos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {validados.length} de {programas.length} archivos validados — {formatPeriodo(periodo)}
          </p>
        </div>
        <PeriodSelector periodo={periodo} onChange={setPeriodo} />
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

      {/* Pending review panel */}
      {pendiente && !consolidating && (
        <div className="bg-warning/5 border border-warning/30 rounded-xl p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning/10 shrink-0">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Consolidación Pendiente de Revisión</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Se consolidaron {pendiente.archivos_count} archivos de {formatPeriodo(periodo)}.
                Descarga y revisa el archivo antes de aprobar.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Generado el {pendiente.fecha} por {pendiente.creado_por}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => consolidacionesApi.descargar(Number(pendiente.id))}
            >
              <Download className="w-4 h-4 mr-2" /> Descargar para Revisar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={validating}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              {validating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Aprobar y Cerrar REM
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={validating}
            >
              <XCircle className="w-4 h-4 mr-2" /> Rechazar
            </Button>
          </div>

          {/* Reject form */}
          {showRejectForm && (
            <div className="space-y-3 pt-2 border-t border-border">
              <label className="text-sm font-medium text-foreground">
                Motivo del rechazo
              </label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Describe por qué se rechaza la consolidación..."
                className="min-h-[80px]"
              />
              <Button
                variant="destructive"
                disabled={!observaciones.trim() || validating}
                onClick={handleReject}
              >
                {validating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Confirmar Rechazo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Consolidate button — only if no pending */}
      {!consolidating && !pendiente && (
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
