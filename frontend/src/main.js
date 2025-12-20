import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { useThemeStore } from "./store/useTheme";
const buildTheme = (mode) => {
    const isLight = mode === "light";
    const palette = {
        mode,
        primary: { main: isLight ? "#0f172a" : "#e5e7eb", contrastText: isLight ? "#f8fafc" : "#0b1021" },
        secondary: { main: "#2563eb", contrastText: "#f8fafc" },
        background: {
            default: isLight ? "#f6f7fb" : "#0b1021",
            paper: isLight ? "#ffffff" : "#111827",
        },
        text: {
            primary: isLight ? "#0f172a" : "#e5e7eb",
            secondary: isLight ? "#6b7280" : "#9ca3af",
        },
        divider: isLight ? "#e5e7eb" : "#1f2937",
        success: { main: "#22c55e" },
        warning: { main: "#f59e0b" },
        error: { main: "#ef4444" },
    };
    return createTheme({
        palette,
        shape: { borderRadius: 12 },
        typography: {
            fontFamily: `"Inter","Plus Jakarta Sans","Segoe UI",system-ui,sans-serif`,
            h4: { fontWeight: 700, letterSpacing: "-0.01em" },
            h5: { fontWeight: 700, letterSpacing: "-0.01em" },
            h6: { fontWeight: 700 },
            button: { textTransform: "none", fontWeight: 600 },
            body1: { color: palette.text.primary },
            body2: { color: palette.text.secondary },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: palette.background.default,
                        color: palette.text.primary,
                        fontFamily: `"Inter","Plus Jakarta Sans","Segoe UI",system-ui,sans-serif`,
                        minHeight: "100vh",
                    },
                    "#root": {
                        minHeight: "100vh",
                        backgroundColor: palette.background.default,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: isLight ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.9)",
                        backdropFilter: "blur(10px)",
                        color: palette.text.primary,
                        boxShadow: "none",
                        borderBottom: `1px solid ${palette.divider}`,
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: isLight ? "#f8fafc" : "#0b1021",
                        color: palette.text.primary,
                        borderRight: `1px solid ${palette.divider}`,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        border: `1px solid ${palette.divider}`,
                        boxShadow: isLight
                            ? "0 12px 30px rgba(15,23,42,0.06)"
                            : "0 12px 30px rgba(0,0,0,0.45)",
                        backgroundImage: isLight
                            ? "linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.92))"
                            : "none",
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        textTransform: "none",
                        fontWeight: 700,
                        boxShadow: "none",
                    },
                    contained: {
                        boxShadow: isLight
                            ? "0 10px 25px rgba(37,99,235,0.18)"
                            : "0 10px 30px rgba(37,99,235,0.25)",
                    },
                    outlined: {
                        borderColor: palette.divider,
                        backgroundColor: isLight ? "#ffffff" : palette.background.paper,
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        fontWeight: 600,
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        backgroundColor: isLight ? "#f8fafc" : "#0f172a",
                        ".MuiOutlinedInput-notchedOutline": {
                            borderColor: palette.divider,
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: palette.primary.main,
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: palette.primary.main,
                            boxShadow: isLight
                                ? "0 0 0 2px rgba(37,99,235,0.12)"
                                : "0 0 0 2px rgba(37,99,235,0.35)",
                        },
                    },
                    input: {
                        padding: "12px 14px",
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        marginBottom: 4,
                        "&.Mui-selected": {
                            backgroundColor: isLight ? "rgba(37,99,235,0.1)" : "rgba(37,99,235,0.2)",
                            color: isLight ? "#0f172a" : "#e5e7eb",
                            border: `1px solid ${isLight ? "#cbd5e1" : "#1f2937"}`,
                        },
                    },
                },
            },
        },
    });
};
const queryClient = new QueryClient();
function ThemedRoot() {
    const mode = useThemeStore((s) => s.mode);
    const theme = useMemo(() => buildTheme(mode), [mode]);
    return (_jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsx(BrowserRouter, { children: _jsx(App, {}) })] }));
}
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(ThemedRoot, {}) }) }));
