import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner1 } from "../components/moleculas/Spinner1";
import { supabase } from "../supabase/supabase.config";
import { bootstrapUserAfterLogin } from "../supabase/securityBootstrap";
import { MostrarUsuarios } from "../index";

export function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      try {
        // Esperar a que la sesión esté lista
        let user = null;
        for (let i = 0; i < 20; i++) {
          const { data } = await supabase.auth.getSession();
          user = data?.session?.user ?? null;
          if (user) break;
          await sleep(150);
        }
        if (!user) throw new Error("No session");

        // Bootstrap seguro (idempotente)
        try {
          await bootstrapUserAfterLogin({ id_auth: user.id, email: user.email });
        } catch (e) {
          // ignore bootstrap errors here; fallback will handle
          console.debug("bootstrapUserAfterLogin error", e);
        }

        // Esperar a que exista la fila en usuarios (evita rebote al login)
        for (let i = 0; i < 10; i++) {
          const row = await MostrarUsuarios({ id_auth: user.id });
          if (row && row.id) break;
          await sleep(200);
        }

        if (!cancelled) navigate("/", { replace: true });
      } catch (e) {
        if (!cancelled) navigate("/login", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return <Spinner1 />;
}

export default OAuthCallback;
