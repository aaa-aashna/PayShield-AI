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
        background: '#f8fafc', // Clean, bright fintech canvas (Slate 50)
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f1f5f9', // Slate 100
          hover: '#f8fafc', // Slate 50
          border: '#e2e8f0', // Slate 200 - razor thin crisp border
          dark: '#0f172a',
        },
        ink: {
          DEFAULT: '#0f172a', // Slate 900 - deep sharp typography
          secondary: '#475569', // Slate 600 - calm legible text
          muted: '#64748b', // Slate 500 - clear labels
          faint: '#cbd5e1', // Slate 300
        },
        brand: {
          DEFAULT: '#0284c7', // Sky 600 - authoritative fintech blue
          hover: '#0369a1',
          subtle: '#f0f9ff',
          border: '#bae6fd',
        },
        risk: {
          low: '#16a34a', // Green 600
          medium: '#d97706', // Amber 600
          high: '#ea580c', // Orange 600
          critical: '#dc2626', // Red 600
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
