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
        charcoal: {
          950: '#0B0D11',
          900: '#111318',
          850: '#181A1F',
          800: '#22252B',
          700: '#32363F',
        },
        warm: {
          50: '#FAF9F7',
          100: '#F7F7F5',
          200: '#EFECE6',
          300: '#E5E2DA',
          peach: '#FCF4EF',
          softPeach: '#F6D7C3',
          beige: '#F3E6DC',
        },
        orange: {
          primary: '#E8752F',
          soft: '#F4A261',
          dark: '#C85A20',
          50: '#FCF4EF',
          100: '#FAECE0',
          200: '#F6D7C3',
          500: '#E8752F',
          600: '#C85A20',
        },
        text: {
          primary: '#17191D',
          secondary: '#5F6368',
          muted: '#8A8F98',
        },
        medical: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        cyan: {
          muted: '#0891B2',
          accent: '#67C7D4',
        },
        grade: {
          0: '#16A34A',
          1: '#D97706',
          2: '#E8752F',
          3: '#DC2626',
          4: '#9333EA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'warm-xs': '0 1px 2px rgba(17, 19, 24, 0.04)',
        'warm-sm': '0 2px 8px rgba(17, 19, 24, 0.05)',
        'warm-md': '0 4px 20px -2px rgba(17, 19, 24, 0.06)',
        'dark-card': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'scan': 'scan 3s ease-in-out infinite alternate',
      },
      keyframes: {
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        }
      }
    },
  },
  plugins: [],
}
