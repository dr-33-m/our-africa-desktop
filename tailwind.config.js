/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Wakanda-inspired modern color palette
        primary: {
          DEFAULT: "#4F2A6A",
          dark: "#7E4A9B",
        },
        secondary: {
          DEFAULT: "#F9A826",
          dark: "#FBC02D",
        },
        accent: {
          DEFAULT: "#FFD700",
          dark: "#FFEB3B",
        },
        background: {
          DEFAULT: "#F5F5F5",
          dark: "#1A1A1A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#2A2A2A",
        },
        text: {
          DEFAULT: "#1A1A1A",
          dark: "#F5F5F5",
        },
        "text-secondary": {
          DEFAULT: "#6B7280",
          dark: "#9CA3AF",
        },
        border: {
          DEFAULT: "#D1D5DB",
          dark: "#4B5563",
        },
        success: {
          DEFAULT: "#10B981",
          dark: "#34D399",
        },
        warning: {
          DEFAULT: "#F59E0B",
          dark: "#FBBF24",
        },
        error: {
          DEFAULT: "#EF4444",
          dark: "#F87171",
        },
      },
      spacing: {
        18: "4.5rem",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        progress: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out",
        slideUp: "slideUp 0.5s ease-out",
        progress: "progress 1s ease-out",
      },
    },
  },
  plugins: [],
};
