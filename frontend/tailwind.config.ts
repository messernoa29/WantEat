import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          light: '#FF8A5B',
          dark: '#E5501A',
          50: '#FFF1EC',
        },
        secondary: {
          DEFAULT: '#2EC4B6',
          light: '#52D4C8',
          dark: '#25A99D',
        },
        accent: {
          DEFAULT: '#06D6A0',
          light: '#3EDEB5',
          dark: '#05BC8D',
        },
        warm: {
          DEFAULT: '#FFFCF7',
          100: '#FFF8EE',
          200: '#F0EDE8',
          300: '#E2DDD6',
        },
        brand: '#1A1A2E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(26,26,46,0.08), 0 1px 2px 0 rgba(26,26,46,0.04)',
        'card-hover': '0 4px 12px 0 rgba(26,26,46,0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config
