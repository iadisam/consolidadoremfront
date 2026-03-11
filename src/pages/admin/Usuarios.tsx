import { useState, useEffect } from "react";
import { usuariosApi, programasApi } from "@/lib/api";
import { User, UserRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Usuarios = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [programas, setProgramas] = useState<{ id: number; nombre: string }[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Form state
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formProgramaId, setFormProgramaId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progs, usrs] = await Promise.all([
        programasApi.listar(),
        usuariosApi.listar(),
      ]);
      setProgramas(progs);
      setUsers(usrs);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.programa && u.programa.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      await usuariosApi.crear({
        nombre: formNombre,
        email: formEmail,
        password: formPassword,
        rol: "encargado",
        programa_id: formProgramaId ? Number(formProgramaId) : undefined,
      });
      setDialogOpen(false);
      setFormNombre("");
      setFormEmail("");
      setFormPassword("");
      setFormProgramaId("");
      toast({ title: "Usuario creado", description: "El usuario ha sido creado exitosamente." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} encargados de programa</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, correo o programa..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Correo</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Programa</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {users.length === 0
                    ? "Se requiere endpoint GET /usuarios en la API para listar usuarios"
                    : "No se encontraron resultados"}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{u.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                      {u.programa}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${u.activo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-1">
                    <Button variant="ghost" size="sm"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input placeholder="Nombre Apellido" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input placeholder="usuario@maipu.cl" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Programa asignado</Label>
              <Select value={formProgramaId} onValueChange={setFormProgramaId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar programa" /></SelectTrigger>
                <SelectContent>
                  {programas.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input placeholder="••••••••" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !formNombre || !formEmail || !formPassword}
            >
              {creating ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;
