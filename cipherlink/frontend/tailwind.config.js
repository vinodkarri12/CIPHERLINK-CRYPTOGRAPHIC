/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#050711",
          card: "rgba(11, 15, 36, 0.7)",
          cardHover: "rgba(18, 24, 54, 0.85)",
          border: "rgba(0, 229, 255, 0.2)",
          borderGlow: "rgba(0, 229, 255, 0.5)",
          cyan: "#00E5FF",
          cyanDim: "rgba(0, 229, 255, 0.15)",
          purple: "#8B5CF6",
          purpleDim: "rgba(139, 92, 246, 0.15)",
          violet: "#6366F1",
          emerald: "#10B981",
          rose: "#F43F5E",
          amber: "#F59E0B",
          dark: "#080c1d"
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        cyber: ['"Rajdhani"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.35)',
        'glow-cyan-lg': '0 0 35px rgba(0, 229, 255, 0.5)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.35)',
        'glow-purple-lg': '0 0 35px rgba(139, 92, 246, 0.5)',
        'inner-glow': 'inset 0 0 15px rgba(0, 229, 255, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}

