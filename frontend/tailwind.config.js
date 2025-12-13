/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: '#F7F0E5',
        sand: '#E8DCC3',
        taupe: '#CBB89D',
        churchBrown: '#5A4632',
        gold: '#D9C5A3',
        // Couleurs existantes pour compatibilité
        'black-deep': '#121212',
      },
      fontFamily: {
        'display': ['Playfair Display', 'Cormorant', 'Fraunces', 'serif'],
        'sans': ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
        'serif': ['serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'ken-burns': 'kenBurns 20s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        kenBurns: {
          '0%, 100%': { transform: 'scale(1) translate(0, 0)' },
          '50%': { transform: 'scale(1.1) translate(-2%, -2%)' },
        },
      },
    },
  },
  plugins: [],
}

