/* eslint-disable react/prop-types */
import { Navigate, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContent";
import { usePermisosStore } from "../store/PermisosStore";
import { useQuery } from "@tanstack/react-query";
import { useUsuariosStore } from "../store/UsuariosStore";
import { Spinner1 } from "../components/moleculas/Spinner1";
import { useAuthStore } from "../store/AuthStore";
import { useEffect, useState } from "react";

export const ProtectedRoute = ({ children, accessBy }) => {
  const { user } = UserAuth();
  const { mostrarPermisosGlobales } = usePermisosStore();
  const location = useLocation();
  const { datausuarios } = useUsuariosStore();
  const { cerrarSesion } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const {
  data:dataPermisosGlobales,
  isLoading: isLoadingPermisosGlobales,
  refetch: refetchPermisosGlobales,
  } = useQuery({
    queryKey: ["mostrar permisos globales", datausuarios?.id],
    queryFn: () => mostrarPermisosGlobales({ id_usuario: datausuarios?.id }),
    enabled: !!datausuarios?.id,
  });
  // Permiso: consider prefix match to support nested routes (e.g., /configuracion/empresa/empresabasicos)
  const hasPermission = dataPermisosGlobales?.some((item) => {
    const link = item.modulos?.link || "";
    const current = location.pathname || "";
    if (!link || link === "-") return false;
    // Special case: Home ('/') must match exactly, never grant all
    if (link === "/") return current === "/";
    // Match exact or nested paths (ensure segment boundary)
    return current === link || current.startsWith(link + "/");
  });
  // Rutas permitidas por autenticación (no requieren permiso explícito)
  const allowlistByAuth = new Set(["/miperfil"]);

  // Si rol 'pendiente' y sin permisos, redirigir a pantalla informativa
  useEffect(() => {
    const roleName = datausuarios?.roles?.nombre?.toLowerCase?.();
    const noPermisos = Array.isArray(dataPermisosGlobales) && dataPermisosGlobales.length === 0;
    // One-time grace: if first load returns empty, refetch once before deciding
    if (user && roleName === "pendiente" && noPermisos) {
      // do nothing here; handled in render by redirect to /acceso-pendiente
      return;
    }
    // Auto-logout para roles no superadmin (ni pendiente) si no tienen permisos
    if (user && roleName !== "superadmin" && roleName !== "pendiente" && noPermisos && !loggingOut) {
      let cancelled = false;
      (async () => {
        // brief delay to allow backend triggers to finish
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled) return;
        const { data } = await refetchPermisosGlobales();
        const stillEmpty = Array.isArray(data) && data.length === 0;
        if (stillEmpty && !cancelled) {
          try {
            setLoggingOut(true);
            await cerrarSesion();
          } finally {
            setLoggingOut(true);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [user, datausuarios?.roles?.nombre, dataPermisosGlobales, loggingOut, cerrarSesion, refetchPermisosGlobales]);
 
  if (accessBy === "non-authenticated") {
    if (!user) {
      return children;
    } else {
      return <Navigate to="/" />;
    }
  } else if (accessBy === "authenticated") {
    // If user is undefined/null and we haven't resolved session yet, show loader to avoid blank
    if (!user && !datausuarios) {
      return <Spinner1 />;
    }
    if (user) {
      // While permissions load and route requires permissions, show loader to avoid flash/blank
      if (isLoadingPermisosGlobales) {
        return <Spinner1 />;
      }
      // Si rol pendiente y sin permisos, enviar a acceso pendiente
      const roleName = datausuarios?.roles?.nombre?.toLowerCase?.();
      if (roleName === "pendiente" && Array.isArray(dataPermisosGlobales) && dataPermisosGlobales.length === 0) {
        return <Navigate to="/acceso-pendiente" replace />;
      }
      // Permitir rutas en allowlist para usuarios autenticados sin exigir permiso
      if (allowlistByAuth.has(location.pathname)) {
        return children;
      }
      // Solo redirigir si ya se consultaron permisos y no hay permiso
      if (dataPermisosGlobales && !hasPermission) {
        return <Navigate to="/404" replace />;
      }
      return children;
    }
  }
  return <Navigate to="/login" />;
};
