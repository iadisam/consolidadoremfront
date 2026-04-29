import { FileSpreadsheet, Upload, FolderOpen, LayoutDashboard, Clock, Users, CheckSquare, Settings, FileCheck, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

export const PROGRAMS = [
  "Infantil",
  "Respiratorio",
  "Salud Mental",
  "Dental",
  "Adolescentes",
  "Procedimientos",
  "PDS",
  "IVADEC",
  "Familia",
  "MAMAV",
  "PASMI",
  "Promoción",
  "Adulto",
  "PSSYR",
] as const;

export type Program = typeof PROGRAMS[number];

export type UserRole = "admin" | "encargado";

export type FileStatus = "pendiente" | "validado" | "rechazado" | "consolidado";

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  programa?: Program;
  activo: boolean;
  cesfam_id?: number;
  cesfam_nombre?: string;
}

export interface ArchivoSubido {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  programa: Program;
  nombre_archivo: string;
  fecha_subida: string;
  estado: FileStatus;
  periodo?: string;
  observaciones?: string;
  validado_por?: string;
  fecha_validacion?: string;
}

export type ConsolidacionEstado = "pendiente" | "aprobada" | "rechazada";

export interface Consolidacion {
  id: string;
  fecha: string;
  archivos_count: number;
  nombre_archivo: string;
  creado_por: string;
  periodo?: string;
  estado: ConsolidacionEstado;
  observaciones_revision?: string;
}


export const NAV_ITEMS_ADMIN = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Pendientes", icon: Clock, path: "/admin/pendientes" },
  { label: "Validados", icon: CheckSquare, path: "/admin/validados" },
  { label: "Consolidar", icon: FileSpreadsheet, path: "/admin/consolidar" },
  { label: "Historial", icon: FolderOpen, path: "/admin/historial" },
  { label: "Usuarios", icon: Users, path: "/admin/usuarios" },
];

export const NAV_ITEMS_ENCARGADO = [
  { label: "Subir Archivo", icon: Upload, path: "/usuario/subir" },
  { label: "Mis Archivos", icon: FileCheck, path: "/usuario/archivos" },
];
