import 'dotenv/config';
import { criarApp } from './app.js';
import { modeloAnthropic } from './ia/modelo.js';

const modelo = modeloAnthropic(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5');
const origens = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim());
const porta = Number(process.env.PORT || 4000);

criarApp({ obterModelo: () => modelo, origens }).listen(porta, () => {
  console.log(`RAIZ API em http://localhost:${porta} · IA ${modelo ? 'ativa' : 'desligada (sem ANTHROPIC_API_KEY)'}`);
});
