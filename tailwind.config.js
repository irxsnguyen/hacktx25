/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        nunito: ['Nunito', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sun: {
          50: '#FFFBF0',
          100: '#FFF7E6',
          200: '#FFEECC',
          300: '#FFE4B3',
          400: '#FFD700',
          500: '#FFB347',
          600: '#FF8C00',
          700: '#FF7F00',
          800: '#FF6347',
          900: '#FF4500',
        },
        earth: {
          50: '#F0F8F0',
          100: '#E6F3E6',
          200: '#CCE6CC',
          300: '#B3D9B3',
          400: '#99CC99',
          500: '#7FB87F',
          600: '#66A366',
          700: '#4D804D',
          800: '#336633',
          900: '#1A4D1A',
        },
        sky: {
          50: '#F0F8FF',
          100: '#E6F3FF',
          200: '#CCE6FF',
          300: '#B3D9FF',
          400: '#99CCFF',
          500: '#80BFFF',
          600: '#66B3FF',
          700: '#4DA6FF',
          800: '#3399FF',
          900: '#1A8CFF',
        },
        stone: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
      },
      backgroundImage: {
        'sun-gradient': 'linear-gradient(135deg, #FFFBF0 0%, #FFE4B3 50%, #FFB347 100%)',
        'earth-gradient': 'linear-gradient(135deg, #F0F8F0 0%, #CCE6CC 50%, #7FB87F 100%)',
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
      animation: {
        'sun-glow': 'sun-glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'sun-glow': {
          '0%': { boxShadow: '0 0 20px rgba(255, 179, 71, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(255, 179, 71, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
