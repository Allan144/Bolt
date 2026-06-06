/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      colors: {
        stone: {
          950: '#0c0a09',
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.7s ease forwards',
      },
    },
  },
  plugins: [],
};
