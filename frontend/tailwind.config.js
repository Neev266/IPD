/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        legal: {
          navy: '#0B1F3A',
          emerald: '#1F4D3A',
          gold: '#C9A227',
          ivory: '#F7F5F2',
          gray: '#E5E7EB',
          text: '#1F2937',        // Default text color
          textLight: '#4B5563',   // Muted text color
          border: '#E5E7EB',      // Border color
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        'legal': '0 4px 6px -1px rgba(11, 31, 58, 0.1), 0 2px 4px -1px rgba(11, 31, 58, 0.06)',
        'legal-hover': '0 10px 15px -3px rgba(11, 31, 58, 0.1), 0 4px 6px -2px rgba(11, 31, 58, 0.05)',
      }
    },
  },
  plugins: [],
}
