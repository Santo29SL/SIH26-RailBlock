/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          primary: '#1e3a8a', // Deep blue
          accent: '#f59e0b',  // Warning amber
        }
      }
    },
  },
  plugins: [],
}