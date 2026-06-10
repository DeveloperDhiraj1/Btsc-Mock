/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // dark mode support using CSS class
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#5d94c0',
          300: '#7cc4ff',
          400: '#38a0ff',
          500: '#4954d5', // primary action color
          600: '#290c9c',
          700: '#320e9e',
          800: '#265894',
          900: '#5755b6',
          950: '#c8659d',
        },
        dark: {
          50: '#57749c',
          100: '#253145',
          200: '#1f2937',
          300: '#0b1d20', // dark background cards
          400: '#272158', // deep dark background body
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(34, 33, 33, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(112, 115, 152, 0.07)',
      }
    },
  },
  plugins: [],
}
