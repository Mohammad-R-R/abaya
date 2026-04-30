/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        gold: {
          50: '#fdfaf0',
          100: '#faf3d0',
          200: '#f5e49b',
          300: '#efd065',
          400: '#e8ba3c',
          500: '#d4a017',
          600: '#b07d0f',
          700: '#8a5e0c',
          800: '#6e4b11',
          900: '#5b3e14',
        },
        sand: {
          50: '#fdf8f0',
          100: '#f8edda',
          200: '#f0d9b0',
          300: '#e4bf7e',
          400: '#d9a452',
          500: '#cc8c35',
          600: '#b5722a',
          700: '#965a24',
          800: '#7a4923',
          900: '#643c20',
        },
        ink: {
          900: '#0f0e0c',
          800: '#1e1c18',
          700: '#2e2b24',
          600: '#3d3930',
          500: '#5a5447',
          400: '#7a7368',
          300: '#a09891',
          200: '#c5bfba',
          100: '#e2ddd9',
          50:  '#f5f2ef',
        }
      },
      backgroundImage: {
        'mesh-gold': 'radial-gradient(at 40% 20%, hsla(47,85%,60%,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(35,80%,55%,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(45,70%,65%,0.06) 0px, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      }
    },
  },
  plugins: [],
}
