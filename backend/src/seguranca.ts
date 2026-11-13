import type { NextFunction, Request, Response } from 'express';

/** Cabeçalhos de segurança para uma API JSON (sem dependências externas). */
export function cabecalhosSeguros() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    next();
  };
}

/**
 * Limite simples de requisições por IP numa janela de tempo.
 * Em ambiente serverless o contador é por instância: protege contra abuso pontual,
 * não substitui um limite distribuído (ex.: Vercel Firewall ou Redis).
 */
export function limitarTaxa({ janelaMs = 60_000, limite = 30 } = {}) {
  const contagem = new Map<string, { n: number; inicio: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const agora = Date.now();
    const chave = String(req.headers['x-forwarded-for'] ?? req.ip ?? 'desconhecido').split(',')[0].trim();
    const atual = contagem.get(chave);
    if (!atual || agora - atual.inicio >= janelaMs) {
      contagem.set(chave, { n: 1, inicio: agora });
    } else {
      atual.n += 1;
      if (atual.n > limite) {
        res.setHeader('Retry-After', String(Math.ceil((atual.inicio + janelaMs - agora) / 1000)));
        res.status(429).json({ erro: 'muitas_requisicoes', mensagem: 'Muitas tentativas. Aguarde um minuto.' });
        return;
      }
    }
    if (contagem.size > 5000) for (const [k, v] of contagem) if (agora - v.inicio >= janelaMs) contagem.delete(k);
    next();
  };
}
