/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        affinia: {
          primary: '#ec4899',
          secondary: '#0ea5e9',
          dark: '#1a1625',
          darker: '#0f0d15',
          accent: '#8b5cf6',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
        purple: {
          900: '#581c87',
          800: '#7c2d8e',
          700: '#a855f7',
          600: '#c084fc',
          500: '#d8b4fe',
        }
      },
      backgroundImage: {
        'galaxy': 'linear-gradient(135deg, #0f0d15 0%, #1a1625 50%, #2d1b3d 100%)',
        'card-gradient': 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        'stats-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 20px rgba(236, 72, 153, 0.3)',
        'neon-blue': '0 0 20px rgba(14, 165, 233, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}