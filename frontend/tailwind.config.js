/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f4',
          100: '#fde6e9',
          200: '#fcccd6',
          300: '#faa2b5',
          400: '#f6698d',
          500: '#ed3a6b',
          600: '#d91d58',
          700: '#b61449',
          800: '#981444',
          900: '#81153f',
        },
      }
    },
  },
  plugins: [],
}
