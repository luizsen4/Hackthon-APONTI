import 'dotenv/config';
import type { Express } from 'express';
import { criarApp } from './criar-app.js';
import { modeloAnthropic } from './ia/modelo.js';

// Ponto de entrada da API.
// - Vercel: usa o `export default` como função serverless (Express detectado automaticamente).
// - Local e Render: `npm run dev` / `npm start` sobem o servidor na porta PORT.
const modelo = modeloAnthropic(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5');
const origens = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim()).filter(Boolean);

const app: Express = criarApp({ obterModelo: () => modelo, origens });
export default app;

if (!process.env.VERCEL) {
  const porta = Number(process.env.PORT || 4000);
  app.listen(porta, () => {
    console.log(`RAIZ API em http://localhost:${porta} · IA ${modelo ? 'ativa' : 'desligada (sem ANTHROPIC_API_KEY)'}`);
  });
}
