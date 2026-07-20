/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './App.{js,ts,jsx,tsx}',
    './index.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'ios': '1.25rem', // Standard iOS card radius (20px)
        'ios-lg': '2.25rem', // Large iOS card radius (36px)
        'ios-sm': '0.75rem', // Small iOS element radius (12px)
      },
      colors: {
        systemGray: {
          1: '#8e8e93',
          2: '#aeaeb2',
          3: '#c7c7cc',
          4: '#d1d1d6',
          5: '#e5e5ea',
          6: '#f2f2f7',
        },
        systemBlue: '#007aff',
        systemRed: '#ff3b30',
        systemGreen: '#34c759',
      },
      boxShadow: {
        'ios': '0 2px 12px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.12)',
        'ios-lg': '0 15px 45px -12px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'ios': '20px',
      }
    },
  },
  plugins: [],
};