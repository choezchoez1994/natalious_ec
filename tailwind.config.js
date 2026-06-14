/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        paper: "var(--paper)",
        ink: "var(--ink)",
        teal: "var(--teal)",
        plum: "var(--plum)",
        line: "var(--line)",
      },
      fontFamily: {
        serif: ["'Bodoni Moda'", "Georgia", "serif"],
        sans: ["'Hanken Grotesk'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
