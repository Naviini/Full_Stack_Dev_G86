/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        urbanist: ['Urbanist', 'sans-serif'],
      },
      colors: {
        primary: '#FF6523',
        secondary: '#9C4CE0',
        accent: '#F1E1FF',
        light: '#F3F3F0',
      }
    },
  },
  plugins: [],
}
