import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#11120f",
        paper: "#f7f5ef",
        chalk: "#fffdf8",
        slate: "#56615f",
        moss: "#60735f",
        vine: "#7f2430",
        clay: "#c9bca9",
        rain: "#6f8fa1"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        lift: "0 18px 48px rgba(17, 18, 15, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
