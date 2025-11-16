// vite.config.ts
import { defineConfig } from "file:///C:/Users/jprey/Dropbox/Workspace/sistema/structapp-base/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/jprey/Dropbox/Workspace/sistema/structapp-base/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    },
    watch: {
      // Configuración para Windows/Dropbox
      usePolling: false,
      interval: 100
    }
  },
  // Optimización de dependencias para Windows
  optimizeDeps: {
    include: ["react", "react-dom", "@mui/material", "@mui/x-data-grid"],
    force: false
  },
  // Caché más estable
  cacheDir: "node_modules/.vite"
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxqcHJleVxcXFxEcm9wYm94XFxcXFdvcmtzcGFjZVxcXFxzaXN0ZW1hXFxcXHN0cnVjdGFwcC1iYXNlXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxqcHJleVxcXFxEcm9wYm94XFxcXFdvcmtzcGFjZVxcXFxzaXN0ZW1hXFxcXHN0cnVjdGFwcC1iYXNlXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9qcHJleS9Ecm9wYm94L1dvcmtzcGFjZS9zaXN0ZW1hL3N0cnVjdGFwcC1iYXNlL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiA1MTczLFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgXCIvYXBpXCI6IHtcclxuICAgICAgICB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDo4MDAwXCIsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCBcIlwiKSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICB3YXRjaDoge1xyXG4gICAgICAvLyBDb25maWd1cmFjaVx1MDBGM24gcGFyYSBXaW5kb3dzL0Ryb3Bib3hcclxuICAgICAgdXNlUG9sbGluZzogZmFsc2UsXHJcbiAgICAgIGludGVydmFsOiAxMDAsXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgLy8gT3B0aW1pemFjaVx1MDBGM24gZGUgZGVwZW5kZW5jaWFzIHBhcmEgV2luZG93c1xyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJAbXVpL21hdGVyaWFsXCIsIFwiQG11aS94LWRhdGEtZ3JpZFwiXSxcclxuICAgIGZvcmNlOiBmYWxzZSxcclxuICB9LFxyXG4gIC8vIENhY2hcdTAwRTkgbVx1MDBFMXMgZXN0YWJsZVxyXG4gIGNhY2hlRGlyOiBcIm5vZGVfbW9kdWxlcy8udml0ZVwiLFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrWSxTQUFTLG9CQUFvQjtBQUMvWixPQUFPLFdBQVc7QUFFbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxVQUFVLEVBQUU7QUFBQSxNQUM5QztBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQTtBQUFBLE1BRUwsWUFBWTtBQUFBLE1BQ1osVUFBVTtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxTQUFTLGFBQWEsaUJBQWlCLGtCQUFrQjtBQUFBLElBQ25FLE9BQU87QUFBQSxFQUNUO0FBQUE7QUFBQSxFQUVBLFVBQVU7QUFDWixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
