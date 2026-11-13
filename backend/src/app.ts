import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { Modelo } from './ia/modelo.js';
import { rotasIA } from './rotas/ia.js';

export interface Opcoes {
  obterModelo: () => Modelo | null;
  origens?: string[];
  limitePorMinuto?: number;
}

export function criarApp({ obterModelo, origens = ['http://localhost:3000'], limitePorMinuto = 30 }: Opcoes) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: origens }));
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/saude', (_req, res) => {
    res.json({ ok: true, ia: Boolean(obterModelo()) });
  });

  app.use('/api/ia', rateLimit({ windowMs: 60_000, limit: limitePorMinuto, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use('/api/ia', rotasIA(obterModelo));

  app.use((_req, res) => { res.status(404).json({ erro: 'nao_encontrado' }); });
  return app;
}
