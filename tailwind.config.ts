import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Warm, calm "kitchen table" palette.
        cream: "#fbf7f0",
        herb: {
          50: "#f1f7f0",
          100: "#dcebd9",
          500: "#4e8d5b",
          600: "#3d7349",
          700: "#2f5a39",
        },
        clay: {
          400: "#e08a5d",
          500: "#d9743f",
          600: "#bd5d2c",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
