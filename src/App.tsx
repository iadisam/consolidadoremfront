import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import Pendientes from "@/pages/admin/Pendientes";
import Validados from "@/pages/admin/Validados";
import Consolidar from "@/pages/admin/Consolidar";
import Historial from "@/pages/admin/Historial";
import Usuarios from "@/pages/admin/Usuarios";
import SubirArchivo from "@/pages/usuario/SubirArchivo";
import MisArchivos from "@/pages/usuario/MisArchivos";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.rol === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/usuario/subir" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/pendientes" element={<Pendientes />} />
              <Route path="/admin/validados" element={<Validados />} />
              <Route path="/admin/consolidar" element={<Consolidar />} />
              <Route path="/admin/historial" element={<Historial />} />
              <Route path="/admin/usuarios" element={<Usuarios />} />
            </Route>

            {/* Encargado routes */}
            <Route element={<ProtectedRoute allowedRoles={["encargado"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/usuario/subir" element={<SubirArchivo />} />
              <Route path="/usuario/archivos" element={<MisArchivos />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
