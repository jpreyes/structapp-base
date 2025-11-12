import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { useThemeStore } from "./store/useTheme";
const theme = (mode) => createTheme({
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
    return (_jsxs(ThemeProvider, { theme: theme(mode), children: [_jsx(CssBaseline, {}), _jsx(BrowserRouter, { children: _jsx(App, {}) })] }));
}
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(ThemedRoot, {}) }) }));
