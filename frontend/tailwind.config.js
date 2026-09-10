/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coop: {
          bg: '#FDFBF7',
          card: '#FFFFFF',
          sidebar: '#F4EFE6',
          border: '#E6E0D5',
          forest: {
            DEFAULT: '#1B3B2B',
            light: '#2A523D',
            dark: '#12271C',
            muted: '#EDF3EF',
          },
          saffron: {
            DEFAULT: '#D97706',
            light: '#F59E0B',
            dark: '#B45309',
            muted: '#FEF3C7',
          },
          charcoal: {
            DEFAULT: '#1F2937',
            light: '#4B5563',
            muted: '#9CA3AF',
          },
          sand: {
            DEFAULT: '#F5F1E8',
            dark: '#E2DACB',
          },
          fairness: {
            high: '#059669',
            mid: '#D97706',
            debt: '#DC2626',
          }
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'coop': '0 2px 8px -2px rgba(27, 59, 43, 0.08), 0 1px 3px -1px rgba(27, 59, 43, 0.04)',
        'coop-hover': '0 8px 24px -4px rgba(27, 59, 43, 0.12), 0 2px 6px -2px rgba(27, 59, 43, 0.06)',
      }
    },
  },
  plugins: [],
}
