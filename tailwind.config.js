/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode
  theme: {
    extend: {
      // Add any additional theme extensions here
      fontFamily: {
        'custom-sans': ['Inter', 'Roboto', 'sans-serif'],
        'custom-mono': ['Martian Mono', 'Consolas', 'monospace'],
      },
    },
  },
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'], // Ensure paths to your files are correct
};
