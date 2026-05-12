/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{ts,tsx}',
    './index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 深色主题专用色板
        surface: {
          DEFAULT: '#1a1a2e',
          light: '#222240',
          lighter: '#2a2a4a'
        },
        accent: {
          primary: '#6c63ff',
          secondary: '#48cae4',
          warm: '#ff6b6b'
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace']
      }
    }
  },
  plugins: []
}
