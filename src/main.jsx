import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // reintentos prudentes
      refetchOnWindowFocus: false,
      staleTime: 30_000, // evita refetch agresivo
      gcTime: 5 * 60_000, // cache 5min
      networkMode: "online",
    },
    mutations: {
      networkMode: "online",
      retry: 1,
    },
  },
});
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
   
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
   
  </React.StrictMode>
);
