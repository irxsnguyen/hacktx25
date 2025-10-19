/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm sunlight tones
        sun: {
          50: '#FFFBF0',   // Pale yellow
          100: '#FFF7E6',  // Soft cream
          200: '#FFEECC',  // Light golden
          300: '#FFE4B3',  // Warm yellow
          400: '#FFD700',  // Golden yellow
          500: '#FFB347',  // Orange-gold
          600: '#FF8C00',  // Dark orange
          700: '#FF7F00',  // Burnt orange
          800: '#FF6347',  // Tomato
          900: '#FF4500',  // Red orange
        },
        // Earthy greens
        earth: {
          50: '#F0F8F0',   // Pale green
          100: '#E6F3E6',  // Soft mint
          200: '#CCE6CC',  // Light sage
          300: '#B3D9B3',  // Sage green
          400: '#99CC99',  // Medium sage
          500: '#7FB87F',  // Forest green
          600: '#66A366',  // Dark forest
          700: '#4D804D',  // Deep green
          800: '#336633',  // Dark green
          900: '#1A4D1A',  // Very dark green
        },
        // Soft blue accents
        sky: {
          50: '#F0F8FF',   // Pale blue
          100: '#E6F3FF',  // Soft blue
          200: '#CCE6FF',  // Light blue
          300: '#B3D9FF',  // Sky blue
          400: '#99CCFF',  // Medium blue
          500: '#80BFFF',  // Bright blue
          600: '#66B3FF',  // Deep blue
          700: '#4DA6FF',  // Ocean blue
          800: '#3399FF',  // Royal blue
          900: '#1A8CFF',  // Navy blue
        },
        // Neutral earth tones
        neutral: {
          50: '#FAFAF9',   // Warm white
          100: '#F5F5F4',  // Stone
          200: '#E7E5E4',  // Light stone
          300: '#D6D3D1',  // Stone
          400: '#A8A29E',  // Medium stone
          500: '#78716C',  // Stone
          600: '#57534E',  // Dark stone
          700: '#44403C',  // Darker stone
          800: '#292524',  // Very dark stone
          900: '#1C1917',  // Almost black
        },
        // Legacy colors for compatibility
        primary: {
          DEFAULT: '#FFB347', // sun-500
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
        secondary: {
          DEFAULT: '#7FB87F', // earth-500
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
        accent: {
          DEFAULT: '#80BFFF', // sky-500
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
        base: {
          white: '#FFFFFF',
          'off-white': '#F5F5F4',
          text: '#44403C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'Poppins', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'sun-gradient': 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 50%, #FFFFFF 100%)',
        'earth-gradient': 'linear-gradient(135deg, #F0F8F0 0%, #CCE6CC 50%, #7FB87F 100%)',
        'sky-gradient': 'linear-gradient(135deg, #F0F8FF 0%, #CCE6FF 50%, #80BFFF 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'warm': '0 10px 25px -5px rgba(255, 179, 71, 0.2), 0 4px 6px -2px rgba(255, 179, 71, 0.1)',
        'earth': '0 10px 25px -5px rgba(127, 184, 127, 0.2), 0 4px 6px -2px rgba(127, 184, 127, 0.1)',
        'sky': '0 10px 25px -5px rgba(128, 191, 255, 0.2), 0 4px 6px -2px rgba(128, 191, 255, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'sun-glow': 'sun-glow 2s ease-in-out infinite alternate',
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
