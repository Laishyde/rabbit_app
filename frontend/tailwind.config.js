/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#81C784',
        secondary: '#FFB74D',
        accent: '#4CAF50',
        background: '#F1F8E9',
        surface: '#FFFFFF',
        text: '#5D4037',
      },
    },
  },
  plugins: [],
}
