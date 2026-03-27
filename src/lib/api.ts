/**
 * API Service Layer - Comunicación con FastAPI Backend
 * Maneja JWT, llamadas HTTP y transformación de datos
 */

import { User, UserRole, ArchivoSubido, Consolidacion, FileStatus } from "@/lib/constants";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://172.25.5.106:8021";

// ==================== TOKEN MANAGEMENT ====================

let accessToken: string | null = localStorage.getItem("access_token");

export const setToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
};

export const getToken = () => accessToken;

// ==================== HTTP CLIENT ====================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // No agregar Content-Type si es FormData (el browser lo pone automáticamente con boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Error de conexión" }));
    const detail = error.detail;
    // Si detail es un objeto estructurado (ej: validación de mes), preservar la estructura
    if (typeof detail === "object" && detail !== null) {
      const apiErr = new ApiError(response.status, detail.mensaje || detail.error || "Error desconocido");
      (apiErr as any).structured = detail;
      throw apiErr;
    }
    throw new ApiError(response.status, detail || "Error desconocido");
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ==================== TIPOS DE RESPUESTA API ====================

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    programa_id: number | null;
    programa_nombre: string | null;
  };
}

interface ApiArchivo {
  id: number;
  usuario_id: number;
  programa_id: number;
  nombre_archivo: string;
  estado: string;
  observaciones: string | null;
  fecha_subida: string;
  fecha_validacion: string | null;
  activo: boolean;
  periodo: string | null;
  usuario_nombre: string;
  programa_nombre: string;
  validado_por_nombre: string | null;
}

interface ApiConsolidacion {
  id: number;
  nombre_archivo: string;
  archivos_count: number;
  creado_por: number;
  fecha: string;
  periodo: string | null;
  creado_por_nombre: string;
}

interface ApiUsuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  programa_id: number | null;
  activo: boolean;
  created_at: string;
  programa_nombre?: string;
}

interface ApiPrograma {
  id: number;
  nombre: string;
  codigo?: string;
}

// ==================== TRANSFORMADORES ====================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function transformArchivo(a: ApiArchivo): ArchivoSubido {
  return {
    id: String(a.id),
    usuario_id: String(a.usuario_id),
    usuario_nombre: a.usuario_nombre || "Desconocido",
    programa: (a.programa_nombre || "Sin programa") as any,
    nombre_archivo: a.nombre_archivo,
    fecha_subida: formatDate(a.fecha_subida),
    estado: a.estado as FileStatus,
    periodo: a.periodo || undefined,
    observaciones: a.observaciones || undefined,
    validado_por: a.validado_por_nombre || undefined,
    fecha_validacion: a.fecha_validacion ? formatDate(a.fecha_validacion) : undefined,
  };
}

function transformConsolidacion(c: ApiConsolidacion): Consolidacion {
  return {
    id: String(c.id),
    fecha: formatDate(c.fecha),
    archivos_count: c.archivos_count,
    nombre_archivo: c.nombre_archivo,
    creado_por: c.creado_por_nombre || "Admin",
    periodo: c.periodo || undefined,
  };
}

function transformUsuario(u: ApiUsuario): User {
  return {
    id: String(u.id),
    nombre: u.nombre,
    email: u.email,
    rol: u.rol as UserRole,
    programa: u.programa_nombre as any,
    activo: u.activo,
  };
}

// ==================== DESCARGA HELPER ====================

function descargarConFetch(url: string, fallbackFilename?: string) {
  fetch(url, { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} })
    .then((r) => {
      if (!r.ok) throw new Error("Error al descargar");
      const filename = r.headers.get("content-disposition")?.match(/filename="?(.+?)"?$/)?.[1] || fallbackFilename;
      return r.blob().then((blob) => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      if (filename) a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch((err) => {
      console.error("Error descargando:", err);
      alert("Error al descargar el archivo");
    });
}

// ==================== AUTH ====================

export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setToken(data.access_token);

    const user: User = {
      id: String(data.user.id),
      nombre: data.user.nombre,
      email: data.user.email,
      rol: data.user.rol as UserRole,
      programa: (data.user.programa_nombre || undefined) as any,
      activo: true,
    };

    return { user, token: data.access_token };
  },

  async getMe(): Promise<User> {
    const data = await apiRequest<{
      id: number;
      nombre: string;
      email: string;
      rol: string;
      programa_id: number | null;
      programa_nombre: string | null;
    }>("/auth/me");

    return {
      id: String(data.id),
      nombre: data.nombre,
      email: data.email,
      rol: data.rol as UserRole,
      programa: (data.programa_nombre || undefined) as any,
      activo: true,
    };
  },

  logout() {
    setToken(null);
  },
};

// ==================== ARCHIVOS ====================

export const archivosApi = {
  async listar(estado?: string, periodo?: string): Promise<ArchivoSubido[]> {
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    if (periodo) params.set("periodo", periodo);
    const query = params.toString() ? `?${params}` : "";
    const data = await apiRequest<ApiArchivo[]>(`/archivos${query}`);
    return data.map(transformArchivo);
  },

  async subir(file: File, programaId?: number, periodo?: string): Promise<{ archivo_id: number; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);
    if (programaId) formData.append("programa_id", String(programaId));
    if (periodo) formData.append("periodo", periodo);
    return apiRequest(`/archivos/upload`, { method: "POST", body: formData });
  },

  async validar(archivoId: number, estado: "validado" | "rechazado", observaciones?: string) {
    return apiRequest("/archivos/validar", {
      method: "POST",
      body: JSON.stringify({ archivo_id: archivoId, estado, observaciones }),
    });
  },

  descargar(archivoId: number) {
    descargarConFetch(`${API_BASE_URL}/archivos/${archivoId}/download`);
  },

  descargarPlantilla() {
    descargarConFetch(`${API_BASE_URL}/plantilla/download`, "SA_26_V1.2.xlsm");
  },

  async resubir(archivoId: number, file: File): Promise<{ archivo_id: number; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest(`/archivos/${archivoId}/resubir`, { method: "POST", body: formData });
  },
};

// ==================== CONSOLIDACIONES ====================

export const consolidacionesApi = {
  async listar(periodo?: string): Promise<Consolidacion[]> {
    const params = new URLSearchParams();
    if (periodo) params.set("periodo", periodo);
    const query = params.toString() ? `?${params}` : "";
    const data = await apiRequest<ApiConsolidacion[]>(`/consolidaciones${query}`);
    return data.map(transformConsolidacion);
  },

  async consolidar(archivosIds: number[], periodo?: string): Promise<{ consolidacion_id: number; archivo: string }> {
    return apiRequest("/consolidar", { method: "POST", body: JSON.stringify({ archivos_ids: archivosIds, periodo }) });
  },

  descargar(consolidacionId: number) {
    descargarConFetch(`${API_BASE_URL}/consolidaciones/${consolidacionId}/download`);
  },
};

// ==================== PROGRAMAS ====================

export const programasApi = {
  async listar(): Promise<ApiPrograma[]> {
    return apiRequest<ApiPrograma[]>("/programas");
  },
};

// ==================== USUARIOS ====================

export const usuariosApi = {
  async listar(): Promise<User[]> {
    const data = await apiRequest<ApiUsuario[]>("/usuarios");
    return data.map(transformUsuario);
  },

  async crear(data: { nombre: string; email: string; password: string; rol: string; programa_id?: number }) {
    return apiRequest("/auth/register", { method: "POST", body: JSON.stringify(data) });
  },
};

// ==================== LOGS ====================

export const logsApi = {
  async obtener(limit = 100) {
    return apiRequest<any[]>(`/logs?limit=${limit}`);
  },

  async porArchivo(archivoId: number): Promise<{ id: string; accion: string; detalle: string | null; usuario_nombre: string; fecha: string }[]> {
    const data = await apiRequest<any[]>(`/archivos/${archivoId}/historial`);
    return data.map((l: any) => ({
      id: String(l.id),
      accion: l.accion,
      detalle: l.detalle || null,
      usuario_nombre: l.usuario_nombre || "Sistema",
      fecha: l.fecha,
    }));
  },
};
