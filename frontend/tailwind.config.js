/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          500: '#0071e3', // Apple-inspired restrained accent
          600: '#0058b6',
          700: '#00428d',
        },
        surface: {
          bg: '#f5f5f7',
          card: '#ffffff',
          subtle: '#fbfbfd',
          dark: '#1d1d1f',
        },
        text: {
          primary: '#1d1d1f',
          secondary: '#6e6e73',
          tertiary: '#86868b',
        }
      },
      borderRadius: {
        'apple-sm': '12px',
        'apple': '18px',
        'apple-lg': '24px',
        'apple-xl': '32px',
      },
      boxShadow: {
        'soft-sm': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'soft': '0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 16px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.07)',
      },
      backdropBlur: {
        'glass': '20px',
      }
    },
  },
  plugins: [],
}
