import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { archivosApi, consolidacionesApi, programasApi, usuariosApi } from "@/lib/api";
import { ArchivoSubido, Consolidacion } from "@/lib/constants";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import PeriodSelector, { getCurrentPeriodo, formatPeriodo } from "@/components/PeriodSelector";
import { Clock, CheckSquare, FileSpreadsheet, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [periodo, setPeriodo] = useState(getCurrentPeriodo());
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [consolidaciones, setConsolidaciones] = useState<Consolidacion[]>([]);
  const [programas, setProgramas] = useState<{ id: number; nombre: string }[]>([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      archivosApi.listar(undefined, periodo),
      consolidacionesApi.listar(periodo),
      programasApi.listar(),
      usuariosApi.listar(),
    ])
      .then(([arch, cons, progs, users]) => {
        setArchivos(arch);
        setConsolidaciones(cons);
        setProgramas(progs);
        setTotalUsuarios(users.filter((u) => u.activo).length);
      })
      .finally(() => setLoading(false));
  }, [periodo]);

  const pendientes = archivos.filter((a) => a.estado === "pendiente").length;
  const validados = archivos.filter((a) => a.estado === "validado").length;
  const totalConsolidaciones = consolidaciones.length;

  const programStatus = programas.map((p) => {
    const archivo = archivos.find((a) => a.programa === p.nombre);
    return { programa: p.nombre, estado: archivo?.estado || null };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Panel de Administración</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {currentUser?.cesfam_nombre && <span className="font-semibold">{currentUser.cesfam_nombre}</span>}
            {currentUser?.cesfam_nombre && " · "}
            Resumen del estado de los archivos REM — {formatPeriodo(periodo)}
          </p>
        </div>
        <PeriodSelector periodo={periodo} onChange={setPeriodo} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Pendientes" value={pendientes} icon={Clock} variant="warning" />
        <MetricCard title="Validados" value={validados} icon={CheckSquare} variant="success" />
        <MetricCard title="Consolidaciones" value={totalConsolidaciones} icon={FileSpreadsheet} variant="info" />
        <MetricCard title="Usuarios Activos" value={totalUsuarios} icon={Users} />
      </div>

      {/* Program Status Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-display text-foreground">Estado por Programa</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {programStatus.map((ps) => (
            <div
              key={ps.programa}
              className="bg-card border rounded-lg p-3 text-center hover:shadow-sm transition-shadow"
            >
              <p className="text-xs font-semibold text-foreground truncate mb-2">{ps.programa}</p>
              {ps.estado ? (
                <StatusBadge status={ps.estado} />
              ) : (
                <span className="text-[10px] text-muted-foreground italic">Sin archivo</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/pendientes">
          <div className="flex items-center justify-between bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div>
              <h3 className="font-semibold text-foreground">Archivos Pendientes</h3>
              <p className="text-sm text-muted-foreground">{pendientes} archivos esperando revisión</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </Link>
        <Link to="/admin/consolidar">
          <div className="flex items-center justify-between bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div>
              <h3 className="font-semibold text-foreground">Consolidar Archivos</h3>
              <p className="text-sm text-muted-foreground">{validados} archivos listos para consolidar</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </Link>
      </div>

      {/* Recent Consolidations */}
      <div>
        <h2 className="text-lg font-semibold font-display text-foreground mb-4">Consolidaciones del Periodo</h2>
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Archivo</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Programas</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Creado por</th>
              </tr>
            </thead>
            <tbody>
              {consolidaciones.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    Sin consolidaciones en este periodo
                  </td>
                </tr>
              ) : (
                consolidaciones.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.nombre_archivo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.fecha}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.archivos_count}/{programas.length}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.creado_por}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
