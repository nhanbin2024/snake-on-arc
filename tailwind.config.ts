import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        arcade: ['"Courier New"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        neon: '0 0 24px rgba(50, 255, 132, 0.32)',
        panel: '0 24px 80px rgba(0, 0, 0, 0.42)'
      },
      backgroundImage: {
        'arcade-grid': 'linear-gradient(rgba(70,255,140,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(70,255,140,.08) 1px, transparent 1px)'
      }
    }
  },
  plugins: []
};

export default config;
