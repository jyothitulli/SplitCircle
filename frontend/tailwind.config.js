/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — these read CSS variables so every utility
        // automatically adapts between the light and dark themes.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-hover': 'rgb(var(--surface-hover) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',

        primary: {
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
        },
        secondary: {
          50: 'rgb(var(--secondary-50) / <alpha-value>)',
          100: 'rgb(var(--secondary-100) / <alpha-value>)',
          400: 'rgb(var(--secondary-400) / <alpha-value>)',
          500: 'rgb(var(--secondary-500) / <alpha-value>)',
          600: 'rgb(var(--secondary-600) / <alpha-value>)',
          700: 'rgb(var(--secondary-700) / <alpha-value>)',
        },
        accent: {
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
        },
        success: {
          500: 'rgb(var(--success-500) / <alpha-value>)',
          600: 'rgb(var(--success-600) / <alpha-value>)',
        },
        danger: {
          500: 'rgb(var(--danger-500) / <alpha-value>)',
          600: 'rgb(var(--danger-600) / <alpha-value>)',
        },
        warning: {
          500: 'rgb(var(--warning-500) / <alpha-value>)',
        },

        // Static aliases used sparingly for things that never theme-swap
        cream: '#FAF7F2',
      },
      fontFamily: {
        display: ['"Clash Display"', '"Cabinet Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Satoshi"', '"General Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        xl2: '18px',
        xl3: '22px',
        xl4: '28px',
        squircle: '38% 62% 63% 37% / 41% 44% 56% 59%',
      },
      boxShadow: {
        soft: '0 20px 60px -30px rgb(var(--shadow-color) / 0.35)',
        panel: '0 30px 90px -40px rgb(var(--shadow-color) / 0.5)',
        'panel-sm': '0 16px 50px -28px rgb(var(--shadow-color) / 0.35)',
        glow: '0 0 0 1px rgb(var(--primary-500) / 0.18), 0 0 60px -12px rgb(var(--primary-500) / 0.55)',
        'glow-cyan': '0 0 0 1px rgb(var(--secondary-500) / 0.2), 0 0 50px -14px rgb(var(--secondary-500) / 0.6)',
        'glow-pink': '0 0 0 1px rgb(var(--accent-500) / 0.2), 0 0 50px -14px rgb(var(--accent-500) / 0.6)',
        'inner-line': 'inset 0 0 0 1px rgb(var(--border) / 1)',
        'inner-glass': 'inset 0 1px 0 0 rgb(255 255 255 / 0.08), inset 0 0 0 1px rgb(255 255 255 / 0.06)',
        lift: '0 40px 100px -30px rgb(var(--shadow-color) / 0.55), 0 10px 30px -12px rgb(0 0 0 / 0.35)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
        'aurora-1': 'radial-gradient(circle at 30% 30%, rgb(var(--primary-500) / 0.55), transparent 60%)',
        'aurora-2': 'radial-gradient(circle at 70% 40%, rgb(var(--secondary-500) / 0.45), transparent 60%)',
        'aurora-3': 'radial-gradient(circle at 50% 80%, rgb(var(--accent-500) / 0.4), transparent 60%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-line': 'linear-gradient(90deg, transparent, rgb(var(--border-strong)), transparent)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        orbit: { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        shimmer: { '0%': { backgroundPosition: '-468px 0' }, '100%': { backgroundPosition: '468px 0' } },
        pulseRing: { '0%': { transform: 'scale(0.85)', opacity: 0.8 }, '80%': { transform: 'scale(1.6)', opacity: 0 }, '100%': { transform: 'scale(1.6)', opacity: 0 } },
        popIn: { '0%': { transform: 'scale(0.92)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        auroraDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
          '33%': { transform: 'translate(4%, 6%) scale(1.12) rotate(8deg)' },
          '66%': { transform: 'translate(-5%, -3%) scale(0.95) rotate(-6deg)' },
        },
        auroraDriftSlow: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-6%, 5%) scale(1.08)' },
        },
        meshPulse: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        borderSpin: {
          '0%': { '--angle': '0deg' },
          '100%': { '--angle': '360deg' },
        },
        dashFlow: {
          '0%': { strokeDashoffset: 24 },
          '100%': { strokeDashoffset: 0 },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        particleFloat: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '50%': { transform: 'translate(6px,-10px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        float: 'float 6s ease-in-out infinite',
        orbit: 'orbit 14s linear infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-ring': 'pulseRing 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
        'pop-in': 'popIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'aurora-drift': 'auroraDrift 22s ease-in-out infinite',
        'aurora-drift-slow': 'auroraDriftSlow 28s ease-in-out infinite',
        'mesh-pulse': 'meshPulse 8s ease-in-out infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
        'dash-flow': 'dashFlow 1s linear infinite',
        ticker: 'ticker 22s linear infinite',
        'particle-float': 'particleFloat 5s ease-in-out infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backgroundSize: {
        '200': '200% 200%',
      },
    },
  },
  plugins: [],
};
