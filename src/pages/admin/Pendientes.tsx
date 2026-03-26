import { useState, useEffect, useRef } from "react";
import { archivosApi } from "@/lib/api";
import { ArchivoSubido } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import PeriodSelector, { getCurrentPeriodo, formatPeriodo } from "@/components/PeriodSelector";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Download, Check, X, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Pendientes = () => {
  const [periodo, setPeriodo] = useState(getCurrentPeriodo());
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    archivosApi
      .listar("pendiente", periodo)
      .then(setArchivos)
      .finally(() => setLoading(false));
  }, [periodo]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await archivosApi.validar(Number(id), "validado");
      setArchivos((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Archivo aprobado", description: "El archivo ha sido validado exitosamente." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setProcessing(rejectId);
    try {
      await archivosApi.validar(Number(rejectId), "rechazado", rejectReason);
      setArchivos((prev) => prev.filter((a) => a.id !== rejectId));
      toast({ title: "Archivo rechazado", description: "Se ha notificado al encargado.", variant: "destructive" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRejectId(null);
      setRejectReason("");
      setProcessing(null);
    }
  };

  const handleEditUpload = async () => {
    if (!editId || !editFile) return;
    setProcessing(editId);
    try {
      await archivosApi.resubir(Number(editId), editFile);
      toast({ title: "Archivo actualizado", description: "El documento reparado ha sido subido exitosamente." });
      const updated = await archivosApi.listar("pendiente", periodo);
      setArchivos(updated);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setEditId(null);
      setEditFile(null);
      setProcessing(null);
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
          <h1 className="text-2xl font-bold font-display text-foreground">Archivos Pendientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{archivos.length} archivos esperando revisión — {formatPeriodo(periodo)}</p>
        </div>
        <PeriodSelector periodo={periodo} onChange={setPeriodo} />
      </div>

      {archivos.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Check className="w-12 h-12 text-success mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground">Todo al día</p>
          <p className="text-sm text-muted-foreground">No hay archivos pendientes en {formatPeriodo(periodo)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {archivos.map((archivo) => (
            <div key={archivo.id} className="bg-card border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{archivo.programa}</h3>
                  <StatusBadge status={archivo.estado} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Subido por <span className="font-medium text-foreground">{archivo.usuario_nombre}</span> el {archivo.fecha_subida}
                </p>
                <p className="text-xs text-muted-foreground">{archivo.nombre_archivo}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => archivosApi.descargar(Number(archivo.id))}>
                  <Download className="w-4 h-4 mr-1" /> Ver
                </Button>
                <Button size="sm" variant="default" onClick={() => handleApprove(archivo.id)} disabled={processing === archivo.id}>
                  <Check className="w-4 h-4 mr-1" /> Aprobar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setEditId(archivo.id); setEditFile(null); }} disabled={processing === archivo.id}>
                  <Pencil className="w-4 h-4 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setRejectId(archivo.id)} disabled={processing === archivo.id}>
                  <X className="w-4 h-4 mr-1" /> Rechazar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo del Rechazo</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Describa el motivo del rechazo (ej: Faltan datos en sección A02)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || !!processing}>
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Reupload Dialog */}
      <Dialog open={!!editId} onOpenChange={() => { setEditId(null); setEditFile(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Documento Reparado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Seleccione el archivo .xlsm corregido. Este reemplazará el documento actual manteniendo al encargado original.
          </p>
          <input ref={fileInputRef} type="file" accept=".xlsm" className="hidden" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            {editFile ? editFile.name : "Seleccionar archivo .xlsm"}
          </Button>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditId(null); setEditFile(null); }}>Cancelar</Button>
            <Button onClick={handleEditUpload} disabled={!editFile || !!processing}>
              {processing ? "Subiendo..." : "Subir Documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pendientes;
