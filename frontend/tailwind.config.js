/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          canvas: "#FAF7F0",
          surface: "#FFFFFF",
          sand: "#E7E1D6",
          darkSand: "#D8D0C3",
        },
        ink: {
          DEFAULT: "#20231F",
          muted: "#5E6853",
          light: "#828C77",
        },
        guidance: {
          DEFAULT: "#2F6B56",
          hover: "#265746",
          light: "#EBF3EF",
          border: "#A5C7BC",
        },
        review: {
          amber: "#A76119",
          light: "#FAF2EA",
          border: "#DEB88B",
        },
        error: {
          brick: "#A7443D",
          light: "#FAECEB",
          border: "#DF9E9A",
        },
      },
      fontFamily: {
        sans: ['Geist', 'Arial', 'sans-serif'],
        devanagari: ['"Noto Sans Devanagari"', '"Nirmala UI"', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      maxWidth: {
        'content': '1280px',
      },
    },
  },
  plugins: [],
}
