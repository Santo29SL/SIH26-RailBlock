/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        railway: {
          bg: '#f8fafc',
          card: '#ffffff',
          cardHover: '#f8fafc',
          surface: '#f1f5f9',
          border: '#e2e8f0',
          borderHover: '#cbd5e1',
          dark: '#0f172a',
          textMuted: '#64748b',
          blue: '#1e40af',
          sky: '#0284c7',
          emerald: '#15803d',
          amber: '#d97706',
          rose: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Calibri', 'Carlito', '"Segoe UI"', 'Arial', 'sans-serif'],
        display: ['Calibri', 'Carlito', '"Segoe UI"', 'Arial', 'sans-serif'],
        body: ['Calibri', 'Carlito', '"Segoe UI"', 'Arial', 'sans-serif'],
        mono: ['Consolas', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
