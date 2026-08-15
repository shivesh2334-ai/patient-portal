import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F0",
        ink: "#2B2B2B",
        teal: {
          50: "#EEF6F5",
          100: "#D3E9E6",
          400: "#3E8E88",
          600: "#2A6A66",
          700: "#1F504D",
        },
        terracotta: {
          100: "#F3DCCB",
          400: "#C77B4B",
          600: "#A85E33",
        },
        amber: {
          100: "#FBEFCB",
          500: "#D9A441",
        },
        rose: {
          100: "#F5DADA",
          500: "#C05B5B",
        },
      },
      fontFamily: {
        serif: ["Source Serif 4", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
