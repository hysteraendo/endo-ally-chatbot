/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Lora', 'serif'],
        'sans': ['Source Sans 3', 'sans-serif'],
      },
      colors: {
        'brand-pink': '#E43E58',
        'brand-yellow': '#F3C500',
        'brand-dark': '#2E2E2E',
        'brand-light': '#F8F8F8',
      }
    },
  },
  plugins: [],
}
