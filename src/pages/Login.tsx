import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FileSpreadsheet, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(email, password);
    setLoading(false);

    if (!success) {
      setError("Credenciales incorrectas. Verifique su correo y contraseña.");
    }
  };

  // Redirigir cuando el user se carga tras login exitoso
  if (user) {
    navigate(user.rol === "admin" ? "/admin" : "/usuario/subir", { replace: true });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/20">
              <FileSpreadsheet className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-display text-primary-foreground">
              Consolidador REM
            </span>
          </div>
          <h2 className="text-4xl font-extrabold font-display text-primary-foreground leading-tight mb-4">
            Sistema de Consolidación<br />de Archivos REM
          </h2>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            Plataforma de gestión para la consolidación de Resúmenes Estadísticos Mensuales de los 14 programas de salud.
          </p>
        </div>
        <div className="text-primary-foreground/50 text-sm">
          <p>Municipalidad de Maipú · Dirección de Salud</p>
          <p className="mt-1">© 2026 — Todos los derechos reservados</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-base font-bold font-display text-foreground">Consolidador REM</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Iniciar Sesión</h1>
            <p className="text-muted-foreground text-sm">Ingrese sus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@maipu.cl"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
