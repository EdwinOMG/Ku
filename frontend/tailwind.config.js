/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#EDE8DC',
          card: '#FDFAF4',
          nav: '#F5F0E8',
          border: '#C8C3B5',
          muted: '#E8E3D8',
        },
        ink: {
          DEFAULT: '#2C2C2A',
          secondary: '#5F5E5A',
          muted: '#888780',
          faint: '#B4B2A9',
        },
        amber: {
          warm: '#633806',
          mid: '#854F0B',
          light: '#FAEEDA',
          tag: '#BA7517',
        }
      },
      fontFamily: {
        sans: ['Georgia', 'serif'],
      },
      borderRadius: {
        card: '12px',
      }
    },
  },
  plugins: [],
}