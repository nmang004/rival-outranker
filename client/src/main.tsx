import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";

// Cache bust: 2025-06-09 19:55 - Remove Replit script

console.log("React mounting starting...");

const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

try {
  createRoot(rootElement!).render(
    <ThemeProvider defaultTheme="light" storageKey="seo-analyzer-theme">
      <App />
      <Toaster />
    </ThemeProvider>
  );
  console.log("React mounting completed successfully");
} catch (error) {
  console.error("React mounting failed:", error);
  // Fallback: render a simple message
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; background: red; color: white;">
        React mounting failed: ${error}
      </div>
    `;
  }
}
