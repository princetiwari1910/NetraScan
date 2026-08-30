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
        navy: {
          950: '#07111F',
          900: '#0B1424',
          850: '#101B2D',
          800: '#162338',
          700: '#1E2E48',
          600: '#2A3F60',
          500: '#3B537E',
        },
        charcoal: {
          950: '#06080C',
          900: '#0B0E14',
          850: '#11151D',
          800: '#181D26',
          700: '#222834',
        },
        tech: {
          blue: '#2563EB',
          sky: '#0EA5E9',
          cyan: '#22D3EE',
          glow: '#38BDF8',
        },
        clinical: {
          orange: '#F97316',
          softOrange: '#FB923C',
          lightOrange: '#FDBA74',
          peach: '#FFEDD5',
        },
        grade: {
          0: '#10B981',
          1: '#F59E0B',
          2: '#F97316',
          3: '#EF4444',
          4: '#A855F7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'dark-sm': '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'dark-lg': '0 10px 30px -4px rgba(0, 0, 0, 0.6)',
        'glow-blue': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'glow-cyan': '0 0 20px -3px rgba(34, 211, 238, 0.35)',
        'glow-orange': '0 0 20px -3px rgba(249, 115, 22, 0.35)',
      },
      animation: {
        'scan': 'scan 3s ease-in-out infinite alternate',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
