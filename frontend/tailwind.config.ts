import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D85A30',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#1D9E75',
          foreground: '#ffffff',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
