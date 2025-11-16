import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
    watch: {
      // Configuración para Windows/Dropbox
      usePolling: false,
      interval: 100,
    },
  },
  // Optimización de dependencias para Windows
  optimizeDeps: {
    include: ["react", "react-dom", "@mui/material", "@mui/x-data-grid"],
    force: false,
  },
  // Caché más estable
  cacheDir: "node_modules/.vite",
});
