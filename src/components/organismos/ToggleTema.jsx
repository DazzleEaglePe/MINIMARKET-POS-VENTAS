import styled from "styled-components";
import { useThemeStore } from "../../store/ThemeStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { useMemo, useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Icon } from "@iconify/react";

const MODES = ["light", "dark", "system"];
const MODE_META = {
  light: { icon: "mdi:white-balance-sunny", label: "CLARO" },
  dark: { icon: "mdi:weather-night", label: "OSCURO" },
  system: { icon: "mdi:monitor", label: "SISTEMA" },
};

export function ToggleTema({ isOpen = true }) {
  const { editarUsuarios, datausuarios } = useUsuariosStore();
  const { themeMode, setThemeMode } = useThemeStore();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const index = useMemo(() => Math.max(0, MODES.indexOf(themeMode)), [themeMode]);

  const updateUserTheme = async (tema) => {
    if (!datausuarios?.id) return;
    await editarUsuarios({ id: datausuarios.id, tema });
  };

  const { mutate: persistTema } = useMutation({
    mutationKey: ["editar tema"],
    mutationFn: updateUserTheme,
    onSuccess: () => queryClient.invalidateQueries(["mostrar usuarios"]),
  });

  const setMode = useCallback((mode) => {
    setThemeMode(mode);
    if (mode === "light" || mode === "dark") persistTema(mode);
  }, [persistTema, setThemeMode]);

  const handleKey = (e) => {
    if (!expanded && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setExpanded(true);
      e.preventDefault();
      return;
    }
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const delta = e.key === "ArrowDown" ? 1 : -1;
    const next = (index + delta + MODES.length) % MODES.length;
    setMode(MODES[next]);
  };

  return (
    <Container aria-label="Selector de tema">
      <div className="container">
        <button
          type="button"
          className={`header ${expanded ? "open" : ""}`}
          aria-expanded={expanded}
          aria-controls="theme-options"
          onClick={() => setExpanded((p) => !p)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded((p) => !p);
            }
          }}
          title="Seleccionar tema"
        >
          <span className="icon current" aria-hidden>
            <Icon icon={MODE_META[themeMode]?.icon} />
          </span>
          <span className={`label ${isOpen ? "show" : "hide"}`}>
            {MODE_META[themeMode]?.label}
          </span>
          <span className={`chevron ${expanded ? "rot" : ""}`} aria-hidden>
            <Icon icon="mdi:chevron-down" />
          </span>
        </button>
        <ul
          className="list"
          role="radiogroup"
          aria-orientation="vertical"
          id="theme-options"
          onKeyDown={handleKey}
          hidden={!expanded}
        >
          <li>
            <button
              type="button"
              role="radio"
              aria-checked={themeMode === "light"}
              className={`item ${themeMode === "light" ? "active" : ""}`}
              onClick={() => setMode("light")}
              title="Tema claro"
            >
              <span className="icon" aria-hidden>
                <Icon icon="mdi:white-balance-sunny" />
              </span>
              <span className={`label ${isOpen ? "show" : "hide"}`}>CLARO</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              role="radio"
              aria-checked={themeMode === "dark"}
              className={`item ${themeMode === "dark" ? "active" : ""}`}
              onClick={() => setMode("dark")}
              title="Tema oscuro"
            >
              <span className="icon" aria-hidden>
                <Icon icon="mdi:weather-night" />
              </span>
              <span className={`label ${isOpen ? "show" : "hide"}`}>OSCURO</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              role="radio"
              aria-checked={themeMode === "system"}
              className={`item ${themeMode === "system" ? "active" : ""}`}
              onClick={() => setMode("system")}
              title="Seguir sistema"
            >
              <span className="icon" aria-hidden>
                <Icon icon="mdi:monitor" />
              </span>
              <span className={`label ${isOpen ? "show" : "hide"}`}>SISTEMA</span>
            </button>
          </li>
        </ul>
      </div>
    </Container>
  );
}

ToggleTema.propTypes = {
  isOpen: PropTypes.bool,
};

const Container = styled.div`
  justify-content: center;
  display: flex;
  .container {
    width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    height: 36px;
    margin: 8px 8px 0 8px;
    padding: 0 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 5px;
    background: ${({ theme }) => theme.bg3};
    color: ${({ theme }) => theme.text};
    cursor: pointer;
    transition: background .12s ease-in-out, border-color .12s ease-in-out;
  }
  .header:hover { background: ${({ theme }) => theme.bgAlpha}; }
  .header.open { border-color: ${({ theme }) => theme.bg5}; }
  .header .icon { display: flex; filter: grayscale(0%); font-size: 18px; }
  .header .chevron { display: flex; transition: transform .15s ease-in-out; }
  .header .chevron.rot { transform: rotate(180deg); }
  .list {
    list-style: none;
    margin: 8px 8px 0 8px;
    padding: 4px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 10px;
    background: ${({ theme }) => theme.bg3};
  }
  .item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    height: 36px;
    padding: 0 10px;
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.text};
    border-radius: 8px;
    cursor: pointer;
    transition: background .12s ease-in-out, color .12s ease-in-out;
  }
  .item:hover {
    background: ${({ theme }) => theme.bgAlpha};
  }
  .item.active {
    background: ${({ theme }) => theme.bg6};
    color: ${({ theme }) => theme.color1};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.bg5};
  }
  .icon { font-size: 18px; display: flex; align-items: center; filter: grayscale(100%); }
  .item:hover .icon, .item.active .icon { filter: grayscale(0%); }
  .label { font-size: 12px; font-weight: 700; letter-spacing: .2px; }
  .label.hide { display: none; }
  .label.show { display: inline; }
`;
