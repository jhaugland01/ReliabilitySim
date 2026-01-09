/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sys-stable': '#10b981',
        'sys-degraded': '#f59e0b',
        'sys-down': '#ef4444',
      },
    },
  },
  plugins: [],
}
