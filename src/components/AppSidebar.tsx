import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { NAV_ITEMS_ADMIN, NAV_ITEMS_ENCARGADO } from "@/lib/constants";
import { LogOut, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const navItems = user.rol === "admin" ? NAV_ITEMS_ADMIN : NAV_ITEMS_ENCARGADO;

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 min-h-screen",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-accent">
          <FileSpreadsheet className="w-5 h-5 text-sidebar-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold font-display text-sidebar-foreground leading-tight">
              Consolidador REM
            </h1>
            <p className="text-[10px] text-sidebar-muted leading-tight">Dirección de Salud</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-sidebar-border px-3 py-4 space-y-3">
        {!collapsed && (
          <div className="px-2">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.nombre}</p>
            <p className="text-[10px] text-sidebar-muted truncate">{user.email}</p>
            {user.programa && (
              <span className="inline-block mt-1 text-[10px] bg-sidebar-accent text-sidebar-primary px-2 py-0.5 rounded-full">
                {user.programa}
              </span>
            )}
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-colors"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
};

export default AppSidebar;
