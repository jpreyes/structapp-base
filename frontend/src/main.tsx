import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { useThemeStore } from "./store/useTheme";

const theme = (mode: "light" | "dark") => createTheme({
  palette: {
    mode,
    primary: { main: "#2563eb" },
    secondary: { main: "#f97316" },
  },
  typography: { fontFamily: "Inter, system-ui, sans-serif" },
});

const queryClient = new QueryClient();

function ThemedRoot() {
  const mode = useThemeStore((s) => s.mode);
  return (
    <ThemeProvider theme={theme(mode)}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemedRoot />
    </QueryClientProvider>
  </React.StrictMode>
);




