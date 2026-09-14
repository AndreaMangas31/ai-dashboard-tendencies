/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "hn-orange": "#ff6600",
        "reddit-red": "#ff4500",
        "ph-purple": "#da552f",
        card: "#15181dbd",
        "tech-black": {
          50: "#f5f7fa",
          100: "#e4e9f0",
          200: "#cdd5df",
          300: "#a7b2c0",
          400: "#7f8b9b",
          500: "#5f6b7a",
          600: "#495463",
          700: "#3a424e",
          800: "#242a33",
          900: "#161a20",
          950: "#0f1115",
        },
      },
      animation: {
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-ring": "pulseRing 2s infinite",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
