/** @type {import('tailwindcss').Config} */
export default {
    content: [
      './index.html',
      './src/**/*.{ts,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          gg: {
            bg:     '#06080f',
            card:   '#0d1424',
            border: '#1e2d45',
            cyan:   '#06b6d4',
            blue:   '#3b82f6',
            orange: '#f97316',
            green:  '#22c55e',
            purple: '#a855f7',
            muted:  '#94a3b8',
            dim:    '#475569',
          },
        },
        fontFamily: {
          orbitron: ['Orbitron', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }