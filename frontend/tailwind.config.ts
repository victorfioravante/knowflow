import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D85A30',
          light: '#F4845F',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#1D9E75',
          light: '#34C896',
          foreground: '#ffffff',
        },
        surface: {
          DEFAULT: '#F9F9F7',
          card: '#FFFFFF',
        },
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.04)',
      },
    },
  },
  plugins: [],
} satisfies Config
