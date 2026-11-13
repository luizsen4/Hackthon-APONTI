import cors from 'cors';
import express from 'express';
import type { Modelo } from './ia/modelo.js';
import { rotasIA } from './rotas/ia.js';
import { cabecalhosSeguros, limitarTaxa } from './seguranca.js';

export interface Opcoes {
  obterModelo: () => Modelo | null;
  origens?: string[];
  limitePorMinuto?: number;
}

export function criarApp({ obterModelo, origens = ['http://localhost:3000'], limitePorMinuto = 30 }: Opcoes) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(cabecalhosSeguros());
  app.use(cors({ origin: origens }));
  app.use(express.json({ limit: '4mb' }));

  app.get('/', (_req, res) => {
    res.json({ servico: 'RAIZ API', saude: '/api/saude' });
  });
  app.get('/api/saude', (_req, res) => {
    res.json({ ok: true, ia: Boolean(obterModelo()) });
  });

  app.use('/api/ia', limitarTaxa({ limite: limitePorMinuto }));
  app.use('/api/ia', rotasIA(obterModelo));

  app.use((_req, res) => { res.status(404).json({ erro: 'nao_encontrado' }); });
  return app;
}
