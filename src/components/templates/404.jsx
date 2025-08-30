import styled from "styled-components";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lottieanimacion } from "../../index";
import vacio from "../../assets/vacioanimacion.json";

export function PageNot() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const quickLinks = [
    { to: "/", label: "Inicio" },
    { to: "/pos", label: "POS" },
    { to: "/configuracion/productos", label: "Productos" },
    { to: "/miperfil", label: "Mi perfil" },
  ];

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {}
  };

  return (
    <Container>
      <div className="wrap">
        <div className="art">
          <Lottieanimacion alto={220} ancho={220} animacion={vacio} />
        </div>
        <div className="content">
          <h1>404</h1>
          <p className="title">Página no encontrada</p>
          <p className="subtitle">
            No encontramos «{pathname}». Puede que el enlace haya cambiado o no
            tengas permisos.
          </p>
          <div className="actions">
            <button className="btn primary" onClick={() => navigate(-1)}>
              Volver
            </button>
            <Link className="btn" to="/">Ir a inicio</Link>
            <button className="btn ghost" onClick={copyUrl}>Copiar URL</button>
          </div>
          <div className="links">
            {quickLinks.map((l) => (
              <Link key={l.to} to={l.to} className="chip">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};

  .wrap {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    align-items: center;
    max-width: 980px;
    width: 100%;
  }
  .art { display: grid; place-items: center; }

  .content { text-align: center; }
  h1 {
    font-size: clamp(3rem, 8vw, 6rem);
    margin: 0;
    letter-spacing: 2px;
  }
  .title { font-size: clamp(1.25rem, 2.4vw, 1.6rem); margin: .25rem 0 0.5rem; font-weight: 700; }
  .subtitle { opacity: .8; }

  .actions { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: center; margin-top: 1.25rem; }
  .btn {
    border: 1px solid ${({ theme }) => theme.color2};
    background: transparent;
    color: ${({ theme }) => theme.text};
    padding: .6rem 1rem;
    border-radius: 10px;
    cursor: pointer;
    text-decoration: none;
  }
  .btn.primary { background: ${({ theme }) => theme.color2}; color: ${({ theme }) => theme.bg }; border-color: ${({ theme }) => theme.color2}; }
  .btn.ghost { opacity: .8; }

  .links { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; margin-top: 1rem; }
  .chip {
    background: ${({ theme }) => theme.cardBg || "rgba(161,161,161,0.1)"};
    color: ${({ theme }) => theme.text};
    padding: .35rem .75rem;
    border-radius: 999px;
    text-decoration: none;
    border: 1px dashed ${({ theme }) => theme.color2};
  }

  @media (min-width: 900px) {
    .wrap { grid-template-columns: 320px 1fr; text-align: left; }
    .content { text-align: left; }
    .actions { justify-content: flex-start; }
    .links { justify-content: flex-start; }
  }
`;
