import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#0f766e",
        "accent-soft": "#ccfbf1",
        border: "#dbe4e8",
        canvas: "#f4f8f7",
        focus: "#0d9488",
        foreground: "#243238",
        heading: "#102a2e",
        muted: "#52646b",
        surface: "#ffffff",
      },
    },
  },
  plugins: [],
} satisfies Config;
