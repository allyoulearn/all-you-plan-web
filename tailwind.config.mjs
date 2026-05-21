export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#effcfc', 100: '#d6f5f5', 200: '#b0ebeb',
          300: '#7adcdc', 400: '#3ec4c4', 500: '#1b9e9e',
          600: '#0d7377', 700: '#0f5f62', 800: '#124d50',
          900: '#134043', 950: '#042628',
        },
        accent: {
          50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8',
          300: '#f9a8d4', 400: '#f472b6', 500: '#e84393',
          600: '#c2185b', 700: '#9d174d', 800: '#831843',
          900: '#500724', 950: '#2e0515',
        },
        secondary: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b',
          900: '#0f172a', 950: '#020617',
        },
        'q-do': { DEFAULT: '#f05a28', light: '#ff7b4f', dark: '#c44218' },
        'q-schedule': { DEFAULT: '#74b9ff', light: '#a3d1ff', dark: '#4a9ae0' },
        'q-delegate': { DEFAULT: '#f9e54d', light: '#fbed7a', dark: '#d4c22f' },
        'q-drop': { DEFAULT: '#7f8fa6', light: '#a0aec0', dark: '#5a6a80' },
        success: { DEFAULT: '#55efc4', light: '#81f5d8', dark: '#2dd4a8' },
        danger: { DEFAULT: '#ff6b6b', light: '#ff9b9b', dark: '#e64545' },
        surface: {
          light: '#ffffff',
          dark: '#0d1a2d',
        },
        background: {
          light: '#f0f4f8',
          dark: '#0d1a2d',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        glass: '20px',
        btn: '14px',
        input: '10px',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0, 0, 0, 0.2)',
        'glass-hover': '0 4px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        glow: '0 0 20px rgba(27, 158, 158, 0.2)',
        'glow-accent': '0 0 20px rgba(232, 67, 147, 0.2)',
        modal: '0 20px 60px -12px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        glass: '16px',
      },
      animation: {
        'check-bounce': 'checkBounce 0.4s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        checkBounce: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
