import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "..", "client", "src"),
      "@shared": path.resolve(__dirname, "..", "shared"),
      "@assets": path.resolve(__dirname, "..", "docs", "assets", "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "..", "client"),
  publicDir: path.resolve(__dirname, "..", "public"),
  build: {
    outDir: path.resolve(__dirname, "..", "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'data-vendor': ['@tanstack/react-query'],
          'utility-vendor': ['lucide-react', 'wouter'],
          // Large dependencies
          'chart-vendor': ['recharts'],
        }
      }
    },
    chunkSizeWarningLimit: 1500,
  },
});
