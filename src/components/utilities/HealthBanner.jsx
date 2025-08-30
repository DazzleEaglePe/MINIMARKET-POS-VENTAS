import { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../../supabase/supabase.config";

// Banner que avisa cuando no hay conectividad con Supabase REST
export default function HealthBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer;

  const ping = async () => {
      try {
    // Petición muy ligera (lista de buckets); si falla asumimos offline
    const { error } = await supabase.storage.listBuckets();
    if (mounted) setOffline(!!error);
      } catch {
    if (mounted) setOffline(true);
      } finally {
    if (mounted) timer = setTimeout(ping, offline ? 10_000 : 30_000); // backoff corto si está caído
      }
    };

    ping();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [offline]);

  if (!offline) return null;
  return (
    <Bar>
      Sin conexión con el servidor. Reintentando...
    </Bar>
  );
}

const Bar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: #a61b1b;
  color: #fff;
  text-align: center;
  padding: 6px 10px;
  font-size: 14px;
`;
