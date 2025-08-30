import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase/supabase.config";
import { MostrarUsuarios, InsertarEmpresa } from "../index";
import { bootstrapUserAfterLogin } from "../supabase/securityBootstrap";

const AuthContext = createContext();
/* eslint-disable react/prop-types */
export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const insertarDatos = useCallback(async (id_auth, correo) => {
    // Usar función segura: crea usuario si no existe y solo asigna superadmin si está en la whitelist
    try {
      await bootstrapUserAfterLogin({ id_auth, email: correo });
      // Esperar a que el registro de usuario esté disponible (primer login puede tardar por triggers)
      for (let i = 0; i < 10; i++) {
        const row = await MostrarUsuarios({ id_auth });
        if (row && row.id) break;
        await sleep(300);
      }
    } catch (e) {
      // Si la función falla, mantenemos experiencia previa como fallback mínimo
      const response = await MostrarUsuarios({ id_auth });
      if (!response) {
        await InsertarEmpresa({ id_auth, correo });
      }
    }
  }, []);
  
  useEffect(() => {
    // Fetch initial session eagerly to avoid a frame where user is null
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setUser(data.session.user);
          insertarDatos(data.session.user.id, data.session.user.email);
        } else {
          setUser(null);
        }
      } catch {
        // ignore
      }
    })();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session == null) {
        setUser(null);
        
      } else {
  setUser(session?.user);
  await insertarDatos(session?.user.id, session?.user.email);
      }
    });
    return () => {
      try {
        authListener.subscription?.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, [insertarDatos]);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};
export const UserAuth = () => {
  return useContext(AuthContext);
};
