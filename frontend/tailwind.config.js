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
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#5d94c0',
          300: '#7cc4ff',
          400: '#38a0ff',
          500: '#4954d5',
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
          300: '#0b1d20',
          400: '#272158',
        },
        neon: {
          blue: '#3b82f6',
          cyan: '#22d3ee',
          purple: '#a855f7',
          violet: '#8b5cf6',
          pink: '#ec4899',
        },
        ink: {
          900: '#05060e',
          800: '#0a0c1a',
          700: '#0f1226',
          600: '#151935',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(34, 33, 33, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(112, 115, 152, 0.07)',
        'neon-blue': '0 0 30px rgba(59,130,246,0.45), 0 0 60px rgba(59,130,246,0.25)',
        'neon-purple': '0 0 30px rgba(168,85,247,0.45), 0 0 60px rgba(168,85,247,0.25)',
        'card-lift': '0 30px 60px -20px rgba(2,6,23,0.7)',
      },
      backgroundImage: {
        'mesh-dark': 'radial-gradient(at 20% 20%, rgba(59,130,246,0.18) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168,85,247,0.18) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(34,211,238,0.12) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(236,72,153,0.12) 0px, transparent 50%)',
        'grid-fade': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
        'gradient-blue-purple': 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      keyframes: {
        'float-slow': {
          '0%,100%': { transform: 'translateY(0) translateX(0) rotate(0)' },
          '50%': { transform: 'translateY(-30px) translateX(15px) rotate(8deg)' },
        },
        'float-fast': {
          '0%,100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-15px) translateX(-10px)' },
        },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(168,85,247,0.6), 0 0 80px rgba(168,85,247,0.3)' },
        },
        'gradient-shift': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'float-slow': 'float-slow 12s ease-in-out infinite',
        'float-fast': 'float-fast 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin-slow 30s linear infinite',
      },
    },
  },
  plugins: [],
}
