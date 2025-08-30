import { createClient } from "@supabase/supabase-js";

// Fetch con timeout para evitar requests colgados
const DEFAULT_TIMEOUT_MS = 15000; // 15s
const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = DEFAULT_TIMEOUT_MS, signal, ...rest } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException("Request timeout", "AbortError")), timeout);

    // Si ya viene un signal externo, aborta también este controller
    if (signal) {
        if (signal.aborted) controller.abort(signal.reason);
        else signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
    }

    try {
        const response = await fetch(resource, { ...rest, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timer);
    }
};

export const supabase = createClient(
    import.meta.env.VITE_APP_SUPABASE_URL,
    import.meta.env.VITE_APP_SUPABASE_ANON_KEY,
    {
        global: {
            fetch: fetchWithTimeout,
        },
    }
);