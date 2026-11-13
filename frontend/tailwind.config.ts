import type { Config } from 'tailwindcss';

// Cores e espaços vêm dos tokens CSS do design system RAIZ (src/styles/tokens).
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        pagina: 'var(--bg-page)',
        cartao: 'var(--surface-card)',
        afundado: 'var(--surface-sunken)',
        texto: 'var(--text-strong)',
        suave: 'var(--text-muted)',
        borda: 'var(--border-soft)',
        lideranca: 'var(--lid, #1B6B3A)',
        emergencia: 'var(--emergency-bg)',
      },
      borderRadius: { cartao: 'var(--radius-md)' },
    },
  },
};
export default config;
