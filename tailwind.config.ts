import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Vinyl / cassette warm palette
        cassette: {
          bg: "#1b140f", // deep brown-charcoal background
          surface: "#241a13",
          surface2: "#2e2118",
          groove: "#3a2a1c",
          amber: "#e2963c",
          amberdim: "#b9762a",
          rust: "#c1552c",
          cream: "#f2e8d8",
          creamdim: "#cbbfa9",
          tape: "#8a5a3b",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"],
        serif: ["var(--font-serif)", "Lora", "serif"],
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        tape: "0 2px 0 0 rgba(0,0,0,0.35), 0 8px 24px -8px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
