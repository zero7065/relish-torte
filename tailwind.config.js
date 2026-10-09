/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/index.html', './client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6F0',
        sand: '#F0E7DA',
        charcoal: '#1C1917',
        cocoa: '#4A2C21',
        clay: '#C2705A',
        blush: '#E8B4B8',
        gold: '#C9A227',
        leaf: '#5A7A5A',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -14px rgba(74, 44, 33, 0.2)',
        lift: '0 18px 50px -12px rgba(74, 44, 33, 0.28)',
      },
    },
  },
  plugins: [],
};
