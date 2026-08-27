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
        background: '#f8f8f6', // Premium editorial paper tone
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f3f3f0',
          border: '#e6e6e2',
          dark: '#111827',
        },
        ink: {
          DEFAULT: '#0f172a',
          secondary: '#475569',
          muted: '#8e99a8',
          faint: '#cbd5e1',
        },
        risk: {
          low: '#15803d',
          medium: '#b45309',
          high: '#c2410c',
          critical: '#b91c1c',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
