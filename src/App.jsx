import { ThemeProvider } from "styled-components";
import {
  AuthContextProvider,
  Dark,
  GlobalStyles,
  Light,
  MyRoutes,
  useThemeStore,
  useUsuariosStore,
} from "./index";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ErrorBoundary from "./components/utilities/ErrorBoundary";
import HealthBanner from "./components/utilities/HealthBanner";

function App() {
  const { setTheme, themeStyle, setThemeByName, theme, themeMode, setThemeMode } = useThemeStore();
  const { datausuarios } = useUsuariosStore();
  const location = useLocation();
  // Aplicar tema: en login forzamos light, en app usamos el tema del usuario si existe; sino el persistido
  useEffect(() => {
    if (location.pathname === "/login") {
      setTheme({ tema: "light", style: Light });
      return;
    }
    if (datausuarios?.tema && (datausuarios?.tema === "light" || datausuarios?.tema === "dark")) {
      const t = datausuarios?.tema === "dark" ? Dark : Light;
      setTheme({ tema: datausuarios?.tema, style: t });
      if (themeMode !== datausuarios?.tema) {
        // sincroniza preferencia a light/dark si perfil lo define
        setThemeMode(datausuarios?.tema);
      }
    } else {
      // usar tema persistido
      setThemeByName(theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, datausuarios?.tema]);

  // Si el modo es 'system', suscribirse a cambios del SO
  useEffect(() => {
    if (themeMode !== "system") return;
    const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (!mql) return;
    const handler = () => setThemeMode('system');
    try {
      mql.addEventListener('change', handler);
    } catch {
      // Safari
      mql.addListener(handler);
    }
    return () => {
      try {
        mql.removeEventListener('change', handler);
      } catch {
        mql.removeListener(handler);
      }
    };
  }, [themeMode, setThemeMode]);
  return (
    <ThemeProvider theme={themeStyle}>
      <AuthContextProvider>
        <GlobalStyles />
        <ErrorBoundary>
          <HealthBanner />
          <MyRoutes />
        </ErrorBoundary>

        <ReactQueryDevtools initialIsOpen={true} />
      </AuthContextProvider>
    </ThemeProvider>
  );
}

export default App;
