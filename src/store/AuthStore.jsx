import { create } from "zustand";
import { supabase } from "../index";
import { hardRedirect } from "../utils/navigation";
import { useUsuariosStore } from "./UsuariosStore";
import { usePermisosStore } from "./PermisosStore";

export const useAuthStore = create(() => ({
  loginGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Fuerza selector de cuenta para evitar reutilizar sesión previa de Google
  queryParams: { prompt: "select_account" },
  redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },
  cerrarSesion: async () => {
    // Cerrar sesión en Supabase
    await supabase.auth.signOut();
    // Limpiar estados locales mínimos para evitar residuos entre usuarios
    try {
      useUsuariosStore.setState({ datausuarios: [] });
      usePermisosStore.setState({
        datapermisos: [],
        dataPermisosGlobales: null,
        selectedModules: [],
      });
    } catch (e) {
      // ignore state reset errors
    }
    // Forzar redirección a login como último recurso, incluso si no estamos en una ruta protegida
    try {
      hardRedirect('/login');
    } catch (_) { /* ignore */ }
  },
  loginEmail: async (p) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: p.email,
      password: p.password,
    });
    if (error) {
      if (error.status === 400) {
        throw new Error("Correo o contraseña incorrectos");
      } else {
        throw new Error("Error al iniciar sesión: " + error.message);
      }
    }
    return data.user
  },
  crearUserYLogin:async(p)=>{
    const { data, error } = await supabase.auth.signUp({
      email: p.email,
      password: p.password,
      
    })
    if (error) {
      throw new Error(error.message);
    }
    return data.user
  },
  // obtenerIdAuthSupabase: async () => {
  //     const response = await ObtenerIdAuthSupabase();
  //     return response;
  //   },
}));
