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
          bg: '#f8fafc',         // Clean Soft Canvas Background
          card: '#ffffff',       // Pure White Card
          cardHover: '#f8fafc',  // Subtle Hover
          surface: '#f1f5f9',    // Surface Layer
          border: '#e2e8f0',     // Crisp Light Border
          borderHover: '#cbd5e1',// Active Border
          dark: '#0f172a',       // Deep Slate Heading
          textMuted: '#64748b',  // Readable Muted Slate
          blue: '#2563eb',       // Vande Bharat Royal Blue
          sky: '#0284c7',        // Corridor Electric Cyan
          indigo: '#4f46e5',     // AI Accent Indigo
          emerald: '#10b981',    // Safe Clear Signal Green
          amber: '#f59e0b',      // Warning Signal Amber
          rose: '#ef4444',       // Stop Signal Red
          gold: '#d97706',       // Track Accent Gold
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      animation: {
        'train-smooth-load': 'trainSmoothLoad 3.8s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'train-normal-cruise': 'trainNormalCruise 14s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        trainSmoothLoad: {
          '0%': { left: '-480px' },
          '100%': { left: '105%' },
        },
        trainNormalCruise: {
          '0%': { left: '-480px' },
          '100%': { left: '105%' },
        },
      },
    },
  },
  plugins: [],
}
