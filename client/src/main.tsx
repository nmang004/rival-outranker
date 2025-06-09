import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";

// Cache bust: 2025-06-09 19:55 - Remove Replit script

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="seo-analyzer-theme">
    <App />
    <Toaster />
  </ThemeProvider>
);
