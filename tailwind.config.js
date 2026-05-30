/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1976D2',
          light: '#F5F7FA',
          accent: '#E3F2FD',
        },
      },
    },
  },
  plugins: [],
  important: '#root',
};
