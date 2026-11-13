import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { CANAIS, NECESSIDADES, SINAIS, type Necessidade } from '../catalogo.js';
import { limpar, PROIBIDAS, semDocumento } from '../ia/guardas.js';
import type { Modelo } from '../ia/modelo.js';
import { PROMPT_SINAL, promptAviso, promptCadastro, promptMensagem, promptSinalTexto } from '../ia/prompts.js';

const sinalEntrada = z
  .object({
    texto: z.string().trim().min(1).max(1500).optional(),
    imagem: z
      .object({ base64: z.string().min(10).max(8_000_000), tipo: z.enum(['image/jpeg', 'image/png', 'image/webp']) })
      .optional(),
  })
  .refine((v) => v.texto || v.imagem, { message: 'Envie uma foto ou um texto.' });

const sinalSaida = z.object({
  sinal: z.string(),
  confianca: z.string().optional(),
  o_que_vi: z.string().optional(),
});

const cadastroEntrada = z.object({ relato: z.string().trim().min(3).max(1500) });
const mensagemEntrada = z.object({
  base: z.string().trim().min(5).max(800),
  pessoa: z.object({
    nome: z.string().max(80).default(''),
    necessidades: z.array(z.string()).max(20).default([]),
    canal: z.enum(CANAIS).default('visita'),
  }),
});
const avisoEntrada = z.object({ texto: z.string().trim().min(3).max(800) });

type Manipulador = (req: Request, res: Response, modelo: Modelo) => Promise<void>;

export function rotasIA(obterModelo: () => Modelo | null) {
  const r = Router();

  const comModelo = (fn: Manipulador) => async (req: Request, res: Response) => {
    const modelo = obterModelo();
    if (!modelo) {
      res.status(503).json({ erro: 'ia_indisponivel', mensagem: 'IA indisponível. Use o modo manual.' });
      return;
    }
    try {
      await fn(req, res, modelo);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ erro: 'entrada_invalida', detalhes: e.issues.map((i) => i.message) });
        return;
      }
      res.status(502).json({ erro: 'falha_ia', mensagem: 'Não foi possível usar a IA agora.' });
    }
  };

  // Foto ou texto -> uma chave da lista fechada de sinais (ou incerto).
  r.post('/sinal', comModelo(async (req, res, modelo) => {
    const e = sinalEntrada.parse(req.body);
    const bruto = e.imagem
      ? await modelo.perguntarJSON(`${PROMPT_SINAL}\nAnalise a foto anexada.`, e.imagem)
      : await modelo.perguntarJSON(promptSinalTexto(e.texto!));
    const s = sinalSaida.safeParse(bruto);
    const visto = s.success ? limpar(s.data.o_que_vi, 120) : '';
    const chave = s.success ? s.data.sinal.trim() : '';
    const valido = (SINAIS as readonly string[]).includes(chave) && s.success && s.data.confianca !== 'baixa';
    res.json(valido ? { ok: true, sinal: chave, visto } : { ok: false, visto });
  }));

  // Relato livre da liderança -> campos do cadastro, para conferência humana.
  r.post('/cadastro', comModelo(async (req, res, modelo) => {
    const { relato } = cadastroEntrada.parse(req.body);
    const j = (await modelo.perguntarJSON(promptCadastro(semDocumento(relato)))) as Record<string, unknown>;
    const necessidades = (Array.isArray(j.necessidades) ? j.necessidades : [])
      .map(String)
      .filter((k): k is Necessidade => (NECESSIDADES as readonly string[]).includes(k));
    const canal = (CANAIS as readonly string[]).includes(String(j.canal)) ? String(j.canal) : 'visita';
    res.json({
      nome: limpar(j.nome, 80),
      endereco: limpar(j.endereco, 120),
      referencia: limpar(j.referencia, 120),
      necessidades: [...new Set(necessidades)],
      necessidadeOutro: necessidades.includes('outro') ? limpar(j.necessidadeOutro, 80) : '',
      canal,
      contato: limpar(j.contato, 80),
      descartado: Boolean(j.descartado),
    });
  }));

  // Aviso oficial -> mensagem para o canal de uma pessoa. Se a IA sair das regras, volta o texto oficial.
  r.post('/mensagem', comModelo(async (req, res, modelo) => {
    const { base, pessoa } = mensagemEntrada.parse(req.body);
    const primeiroNome = pessoa.nome.split(' ').slice(0, 2).join(' ');
    const necs = pessoa.necessidades.filter((k) => (NECESSIDADES as readonly string[]).includes(k)).join(', ');
    let mensagem = base;
    let adaptada = false;
    try {
      const j = (await modelo.perguntarJSON(promptMensagem(base, primeiroNome, necs, pessoa.canal))) as { mensagem?: unknown };
      const t = String(j.mensagem ?? '').trim();
      if (t && t.length <= 600 && !PROIBIDAS.test(t)) { mensagem = t; adaptada = true; }
    } catch { /* usa o texto oficial */ }
    res.json({ mensagem, adaptada });
  }));

  // Aviso da liderança -> linguagem simples, sem inventar informação.
  r.post('/aviso', comModelo(async (req, res, modelo) => {
    const { texto } = avisoEntrada.parse(req.body);
    const j = (await modelo.perguntarJSON(promptAviso(texto))) as { texto?: unknown };
    const t = String(j.texto ?? '').trim().slice(0, 800);
    if (!t || PROIBIDAS.test(t)) { res.json({ ok: false, texto }); return; }
    res.json({ ok: true, texto: t });
  }));

  return r;
}
