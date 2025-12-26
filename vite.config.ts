import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split react and react-dom separately
          if (id.includes('react') && id.includes('react-dom')) {
            return 'react-dom';
          }
          if (id.includes('react')) {
            return 'react-core';
          }
          // Split router separately
          if (id.includes('react-router-dom')) {
            return 'router';
          }
          // Split query library
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          // Split UI components
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          // Split utilities
          if (id.includes('date-fns') || id.includes('clsx')) {
            return 'utils';
          }
          // Split icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    cssCodeSplit: true,
  },
}));
