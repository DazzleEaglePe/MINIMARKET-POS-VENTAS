import styled from "styled-components";
import { useAuthStore } from "../store/AuthStore";

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: ${({ theme }) => theme?.bg || "#0f172a"};
  color: ${({ theme }) => theme?.text || "#e2e8f0"};
`;

const Card = styled.div`
  max-width: 520px;
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 28px;
  backdrop-filter: blur(6px);
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 22px;
`;

const P = styled.p`
  margin: 8px 0 0 0;
  line-height: 1.5;
  opacity: 0.9;
`;

const Actions = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: #111827;
  color: #e5e7eb;
  cursor: pointer;
  transition: transform .08s ease, background .2s ease, border-color .2s ease;
  &:hover { transform: translateY(-1px); background: #0b1220; border-color: rgba(255,255,255,0.25); }
`;

export function AccesoPendiente() {
  const { cerrarSesion } = useAuthStore();

  return (
    <Wrapper>
      <Card>
        <Title>Acceso pendiente de aprobación</Title>
        <P>
          Tu cuenta inició sesión correctamente, pero aún no tiene permisos asignados.
          Un administrador debe aprobar tu rol para habilitar el acceso a los módulos.
        </P>
        <P>
          Si ya fuiste aprobado, cierra sesión y vuelve a iniciar para actualizar tus permisos.
        </P>
        <Actions>
          <Button onClick={cerrarSesion}>Cerrar sesión</Button>
        </Actions>
      </Card>
    </Wrapper>
  );
}

export default AccesoPendiente;
