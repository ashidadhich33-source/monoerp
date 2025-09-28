/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        'screen-75': '75vh',
      },
      touchAction: {
        'pan-x': 'pan-x',
        'pan-y': 'pan-y',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}