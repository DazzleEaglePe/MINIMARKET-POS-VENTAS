/* eslint-disable react/prop-types */
import styled from "styled-components";
import {
  Sidebar,
  SwitchHamburguesa,
  Spinner1,
  useEmpresaStore,
  useUsuariosStore,
  MenuMovil,
  useAuthStore,
  UserAuth,
} from "../index";
import { useEffect, useRef, useState } from "react";
import { Device } from "../styles/breakpoints";
import { useQuery } from "@tanstack/react-query";
import { useMostrarSucursalAsignadasQuery } from "../tanstack/AsignacionesSucursalStack";
import Swal from "sweetalert2";
import { supabase } from "../supabase/supabase.config";
export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stateMenu, setStateMenu] = useState(false);

  const { mostrarusuarios } = useUsuariosStore();
  const { mostrarempresa } = useEmpresaStore();
    const { user } = UserAuth(); // Accedemos al contexto
  const id_auth = user?.id; // Obtenemos el id_auth del usuario autenticado
  const {
    data: datausuarios,
    isLoading: isLoadingUsuarios,
    error: errorUsuarios,
  } = useQuery({
    queryKey: ["mostrar usuarios"],
    queryFn: () => mostrarusuarios({ id_auth: id_auth }),
    refetchOnWindowFocus: false,
    enabled: !!id_auth,
  });

  const {
    isLoading: isLoadingSucursales,
    error: errorSucursales,
  } = useMostrarSucursalAsignadasQuery();

  const {
    data: dataEmpresa,
    isLoading: isLoadingEmpresa,
    error: errorEmpresa,
  } = useQuery({
    queryKey: ["mostrar empresa", datausuarios?.id],
    queryFn: () => mostrarempresa({ _id_usuario: datausuarios?.id }),
    enabled: !!datausuarios,
    refetchOnWindowFocus: false,
  });

  // Consolidación de isLoading y error
  const isLoading =
    isLoadingUsuarios || isLoadingSucursales || isLoadingEmpresa;
  const error = errorUsuarios || errorSucursales || errorEmpresa;

  // Idle session handler: prompt to continue or logout, except when a caja is open
  const idleTimerRef = useRef(null);
  const promptOpenRef = useRef(false);
  const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 min
  const PROMPT_TIMEOUT_MS = 30 * 1000; // 30s

  useEffect(() => {
    if (!user) return; // only when authenticated

    const startIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(onIdle, IDLE_TIMEOUT_MS);
    };

    const resetIdle = () => {
      startIdleTimer();
    };

    const hasOpenCaja = async () => {
      try {
        if (!dataEmpresa?.id) return false;
        const { data, error } = await supabase.rpc(
          "mostrarcajasabiertasporempresa",
          { _id_empresa: dataEmpresa.id }
        );
        if (error) return false;
        return Array.isArray(data) && data.length > 0;
      } catch {
        return false;
      }
    };

    const onIdle = async () => {
      if (promptOpenRef.current) return;
      // Do not prompt/logout if there's an open caja
      const openCaja = await hasOpenCaja();
      if (openCaja) {
        startIdleTimer();
        return;
      }
      promptOpenRef.current = true;
      const result = await Swal.fire({
        title: "Sesión inactiva",
        text: "¿Deseas continuar conectado?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Mantener sesión",
        cancelButtonText: "Cerrar sesión",
        timer: PROMPT_TIMEOUT_MS,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      promptOpenRef.current = false;

      // If dismissed by timer or cancel -> logout; if confirmed -> continue
      const dismissedByTimer = result?.dismiss === Swal.DismissReason.timer;
      const cancelled = result?.dismiss === Swal.DismissReason.cancel;
      if (dismissedByTimer || cancelled) {
        try {
          await useAuthStore.getState().cerrarSesion();
        } finally {
          // no-op
        }
      } else if (result?.isConfirmed) {
        startIdleTimer();
      }
    };

    // Start and subscribe
    startIdleTimer();
    const events = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];
    events.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, resetIdle));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dataEmpresa?.id, IDLE_TIMEOUT_MS, PROMPT_TIMEOUT_MS]);

  //  if (datausuarios == null) {
  //    refetchUsuarios();
  //  }
  if (isLoading) {
    return <Spinner1 />;
  }
  if (error) {
    return <span>error layout...{error.message} </span>;
  }
  return (
    <Container className={sidebarOpen ? "active" : ""}>
      <section className="contentSidebar">
        <Sidebar
          state={sidebarOpen}
          setState={() => setSidebarOpen(!sidebarOpen)}
        />
      </section>
      <section className="contentMenuhambur">
        <SwitchHamburguesa
          state={stateMenu}
          setstate={() => setStateMenu(!stateMenu)}
        />
        {stateMenu ? <MenuMovil setState={() => setStateMenu(false)} /> : null}
      </section>

      <Containerbody>{children}</Containerbody>
    </Container>
  );
}
const Container = styled.main`
  display: grid;
  grid-template-columns: 1fr;
  transition: 0.1s ease-in-out;
  color: ${({ theme }) => theme.text};
  .contentSidebar {
    display: none;
    /* background-color: rgba(78, 45, 78, 0.5); */
  }
  .contentMenuhambur {
    position: absolute;
    /* background-color: rgba(53, 219, 11, 0.5); */
  }
  @media ${Device.tablet} {
    grid-template-columns: 88px 1fr;
    &.active {
      grid-template-columns: 260px 1fr;
    }
    .contentSidebar {
      display: initial;
    }
    .contentMenuhambur {
      display: none;
    }
  }
`;
const Containerbody = styled.section`
  /* background-color: rgba(231, 13, 136, 0.5); */
  grid-column: 1;
  width: 100%;

  @media ${Device.tablet} {
    margin-top: 0;
    grid-column: 2;
  }
`;
