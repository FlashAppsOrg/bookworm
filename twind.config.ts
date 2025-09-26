import { Options } from "$fresh/plugins/twind.ts";

export default {
  selfURL: import.meta.url,
  darkMode: 'class',
  preflight: {
    "@font-face": [
      {
        fontFamily: "Poppins",
        fontWeight: "400",
        src: 'url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap")',
      },
    ],
    "body": {
      transition: "background-color 0.3s ease",
    },
    ".theme-teal": {
      "--color-primary": "#0D9488",
      "--color-primary-dark": "#0F766E",
      "--color-primary-light": "#14B8A6",
      "--color-secondary": "#FF7F7F",
      "--color-secondary-dark": "#FF6B6B",
      "--color-secondary-light": "#FF9999",
    },
    ".theme-indigo": {
      "--color-primary": "#4F46E5",
      "--color-primary-dark": "#4338CA",
      "--color-primary-light": "#6366F1",
      "--color-secondary": "#10B981",
      "--color-secondary-dark": "#059669",
      "--color-secondary-light": "#34D399",
    },
    ".theme-green": {
      "--color-primary": "#059669",
      "--color-primary-dark": "#047857",
      "--color-primary-light": "#10B981",
      "--color-secondary": "#3B82F6",
      "--color-secondary-dark": "#2563EB",
      "--color-secondary-light": "#60A5FA",
    },
  },
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary, #00D4FF)",
          dark: "var(--color-primary-dark, #00AAFF)",
          light: "var(--color-primary-light, #33DDFF)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary, #FFD700)",
          dark: "var(--color-secondary-dark, #FFB700)",
          light: "var(--color-secondary-light, #FFE44D)",
        },
        accent: "#FF6B35",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-in": "bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
} as Options;