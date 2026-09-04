/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        verified: '#22c55e',
        emerging: '#f59e0b',
        flagged: '#ef4444',
      }
    },
  },
  plugins: [],
}

