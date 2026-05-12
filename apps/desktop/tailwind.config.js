/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{ts,tsx}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f0f1a',  // Abyss — deepest
          light: '#161625',    // Void — panels background
          lighter: '#1e1e32'   // Mist — cards, elevated surfaces
        },
        accent: {
          primary: '#7c6ff7',   // cool violet (OKLCH 65% 0.18 280)
          secondary: '#5ec5d4', // cyan (OKLCH 72% 0.12 200)
          warm: '#d4895e'       // subdued amber (OKLCH 60% 0.15 15)
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace']
      },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.87, 0, 0.13, 1)'
      }
    }
  },
  plugins: []
}
