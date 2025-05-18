import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        progress: {
          "0%": { width: "0%" },
          "20%": { width: "20%" },
          "40%": { width: "40%" },
          "60%": { width: "60%" },
          "80%": { width: "80%" },
          "100%": { width: "100%" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "bounce-delayed": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            opacity: "1", 
            boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.5)" 
          },
          "50%": { 
            opacity: "0.8", 
            boxShadow: "0 0 0 8px rgba(59, 130, 246, 0)" 
          },
        },
        "sparkle": {
          "0%": { 
            transform: "scale(1) rotate(0deg)", 
            opacity: "1" 
          },
          "50%": { 
            transform: "scale(1.2) rotate(180deg)", 
            opacity: "0.7" 
          },
          "100%": { 
            transform: "scale(1) rotate(360deg)", 
            opacity: "1" 
          }
        },
        "float": {
          "0%, 100%": { 
            transform: "translateY(0) translateX(0)" 
          },
          "25%": { 
            transform: "translateY(-10px) translateX(5px)" 
          },
          "50%": { 
            transform: "translateY(0) translateX(10px)" 
          },
          "75%": { 
            transform: "translateY(10px) translateX(5px)" 
          }
        },
        "celebrate": {
          "0%": { 
            transform: "scale(1) rotate(0deg)", 
            filter: "brightness(100%)" 
          },
          "25%": { 
            transform: "scale(1.1) rotate(-5deg)", 
            filter: "brightness(110%)" 
          },
          "50%": { 
            transform: "scale(1.2) rotate(0deg)", 
            filter: "brightness(120%)" 
          },
          "75%": { 
            transform: "scale(1.1) rotate(5deg)", 
            filter: "brightness(110%)" 
          },
          "100%": { 
            transform: "scale(1) rotate(0deg)", 
            filter: "brightness(100%)" 
          }
        },
        "badge-pop": {
          "0%": { 
            transform: "scale(0)", 
            opacity: "0" 
          },
          "70%": { 
            transform: "scale(1.1)", 
            opacity: "1" 
          },
          "100%": { 
            transform: "scale(1)", 
            opacity: "1" 
          }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-slow": "bounce 2s infinite",
        "bounce-delay-0": "bounce 1.5s infinite",
        "bounce-delay-300": "bounce 1.5s infinite 0.3s",
        "bounce-delay-600": "bounce 1.5s infinite 0.6s",
        "fadeIn": "fadeIn 0.5s ease-in-out",
        "progress": "progress 15s ease-in-out forwards",
        "bounce-delayed": "bounce-delayed 2s infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "sparkle": "sparkle 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "celebrate": "celebrate 1.5s ease-in-out",
        "badge-pop": "badge-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
