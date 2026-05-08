import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
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
      boxShadow: {
        lift: "0 18px 48px rgba(17, 18, 15, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
