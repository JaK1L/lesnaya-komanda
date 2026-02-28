/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#ffffff',
        accent: {
          DEFAULT: '#4aff75',
          dark: '#2d5a2d',
        },
        gray: {
          DEFAULT: '#1a1a1a',
          light: '#2a2a2a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Unbounded', 'sans-serif'],
      },
      fontSize: {
        'hero': 'clamp(4rem, 12vw, 8rem)',
      },
    },
  },
  plugins: [],
}