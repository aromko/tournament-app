import type { Config } from "tailwindcss";

const config: Config = {
  corePlugins: {
    preflight: false,
  },
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  important: "#__next",
  theme: {
    extend: {
      screens: {
        sm: "375px",
        xl: "1440px",
      },
      colors: {
        "primary-light-cyan": "#cee3e9",
        "primary-neon-green": "#52ffa8",
        "neutral-grayish-blue": "#4e5d73",
        "neutral-dark-grayish-blue": "#323a49",
        "neutral-dark-blue": "#1f2632",
      },
      fontSize: {
        sm: "12px",
        xl: "28px",
      },
      fontFamily: {
        sans: "Manrope, sans-serif",
      },
    },
  },
  plugins: [],
};
export default config;
