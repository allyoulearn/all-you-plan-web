/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        // New design-system tokens
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        'paper-3': 'var(--paper-3)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        muted: 'var(--muted)',
        rule: 'var(--rule)',
        'rule-soft': 'var(--rule-soft)',
        accent: {
          DEFAULT: 'var(--accent)',
          // Legacy compat scale — used by old components until Tasks 18-19 retheme them
          50: '#fff3ee', 100: '#ffe4d5', 200: '#ffc8aa', 300: '#ffa070',
          400: '#ff7a3d', 500: '#ff5a1f', 600: '#f43e00', 700: '#c93300',
          800: '#a02c04', 900: '#822909',
        },
        'accent-ink': 'var(--accent-ink)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        bad: 'var(--bad)',
        // Legacy compat — kept so old components compile until Tasks 18-19 retheme them
        'q-do': { DEFAULT: '#f05a28', light: '#ff7b4f', dark: '#c44218' },
        'q-schedule': { DEFAULT: '#74b9ff', light: '#a3d1ff', dark: '#4a9ae0' },
        'q-delegate': { DEFAULT: '#f9e54d', light: '#fbed7a', dark: '#d4c22f' },
        'q-drop': { DEFAULT: '#7f8fa6', light: '#a0aec0', dark: '#5a6a80' },
        primary: {
          50: '#effcfc', 100: '#d6f5f5', 200: '#b0ebeb',
          300: '#7adcdc', 400: '#3ec4c4', 500: '#1b9e9e',
          600: '#0d7377', 700: '#0f5f62', 800: '#124d50',
          900: '#134043', 950: '#042628',
        },
        secondary: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b',
          900: '#0f172a', 950: '#020617',
        },
        danger: {
          DEFAULT: '#ff6b6b', light: '#ff9b9b', dark: '#e64545',
          50: '#fff5f5', 100: '#ffe3e3', 200: '#ffbdbd', 300: '#ff9b9b',
          400: '#ff6b6b', 500: '#ff6b6b', 600: '#e64545', 700: '#c0392b',
          800: '#992d22', 900: '#7a251c',
        },
        success: {
          DEFAULT: '#55efc4', light: '#81f5d8', dark: '#2dd4a8',
          50: '#f0fdf9', 100: '#ccfbef', 200: '#99f6e0', 300: '#5eead4',
          400: '#2dd4bf', 500: '#55efc4', 600: '#0d9488', 700: '#0f766e',
          800: '#115e59', 900: '#134e4a',
        },
      },
      fontFamily: {
        sans: ['Instrument Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'ui-serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '20px',
        pill: '999px',
        // Legacy compat aliases
        input: '10px',
        btn: '14px',
        glass: '20px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(20,18,12,0.04), 0 2px 8px rgba(20,18,12,0.04)',
        md: '0 1px 2px rgba(20,18,12,0.05), 0 8px 24px rgba(20,18,12,0.06)',
        'accent-glow': '0 6px 24px color-mix(in oklab, var(--accent) 30%, transparent)',
        // Legacy compat alias
        glass: '0 4px 24px rgba(0, 0, 0, 0.2)',
      },
      backdropBlur: {
        // Legacy compat alias
        glass: '16px',
      },
      backgroundImage: {
        // Legacy compat aliases
        'app-base': 'linear-gradient(180deg, #0c1424 0%, #0a1018 100%)',
        'app-sidebar': 'linear-gradient(180deg, #0d1526 0%, #091018 100%)',
      },
    },
  },
  plugins: [],
}
