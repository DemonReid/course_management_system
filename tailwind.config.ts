import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#1a365d',
          950: '#0f1f3d',
        },
        gold: {
          50: '#faf6eb',
          100: '#f5edce',
          200: '#ebd99e',
          300: '#e0c26e',
          400: '#d4ab3e',
          500: '#c9a84c',
          600: '#a87a2e',
          700: '#875c24',
          800: '#66441a',
          900: '#452c10',
        },
      },
      fontFamily: {
        sans: ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-noto-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
