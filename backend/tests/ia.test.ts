import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { criarApp } from '../src/criar-app.js';
import type { Modelo } from '../src/ia/modelo.js';

function app(resposta: unknown, espiao?: (prompt: string) => void) {
  const modelo: Modelo = {
    perguntarJSON: vi.fn(async (prompt: string) => { espiao?.(prompt); return resposta; }),
  };
  return criarApp({ obterModelo: () => modelo, limitePorMinuto: 1000 });
}

describe('POST /api/ia/sinal', () => {
  it('aceita só chaves da lista fechada', async () => {
    const r = await request(app({ sinal: 'lona_rasgada', confianca: 'alta', o_que_vi: 'lona azul rasgada' }))
      .post('/api/ia/sinal').send({ texto: 'a lona rasgou' });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true, sinal: 'lona_rasgada', visto: 'lona azul rasgada' });
  });

  it('recusa chave inventada e confiança baixa', async () => {
    const a = await request(app({ sinal: 'terremoto', confianca: 'alta' })).post('/api/ia/sinal').send({ texto: 'x' });
    const b = await request(app({ sinal: 'rachadura', confianca: 'baixa' })).post('/api/ia/sinal').send({ texto: 'x' });
    expect(a.body.ok).toBe(false);
    expect(b.body.ok).toBe(false);
  });

  it('valida a entrada', async () => {
    const r = await request(app({})).post('/api/ia/sinal').send({});
    expect(r.status).toBe(400);
  });
});

describe('POST /api/ia/cadastro', () => {
  it('não envia CPF ao modelo e filtra as necessidades', async () => {
    let enviado = '';
    const r = await request(app(
      { nome: 'Maria', necessidades: ['acamada', 'diabetes', 'outro'], necessidadeOutro: 'usa aparelho na tomada', canal: 'zap' },
      (p) => { enviado = p; },
    )).post('/api/ia/cadastro').send({ relato: 'Maria, CPF 529.982.247-25, fica na cama' });
    expect(enviado).not.toMatch(/529\.?982/);
    expect(r.body.necessidades).toEqual(['acamada', 'outro']);
    expect(r.body.necessidadeOutro).toBe('usa aparelho na tomada');
    expect(r.body.canal).toBe('visita');
  });
});

describe('POST /api/ia/mensagem', () => {
  const base = 'Lona rasgada. Não tire nem mexa na lona da barreira.';
  it('volta ao texto oficial se a IA disser que é seguro', async () => {
    const r = await request(app({ mensagem: 'Pode ficar tranquila, está seguro.' }))
      .post('/api/ia/mensagem').send({ base, pessoa: { nome: 'Ana', necessidades: [], canal: 'audio' } });
    expect(r.body).toEqual({ mensagem: base, adaptada: false });
  });
  it('usa a mensagem adaptada quando respeita as regras', async () => {
    const r = await request(app({ mensagem: 'Dona Ana, não mexa na lona.' }))
      .post('/api/ia/mensagem').send({ base, pessoa: { nome: 'Ana Rocha', canal: 'visita' } });
    expect(r.body.adaptada).toBe(true);
  });
});

describe('IA desligada', () => {
  it('responde 503 para o app usar o modo manual', async () => {
    const r = await request(criarApp({ obterModelo: () => null })).post('/api/ia/aviso').send({ texto: 'Mutirão sábado' });
    expect(r.status).toBe(503);
    const s = await request(criarApp({ obterModelo: () => null })).get('/api/saude');
    expect(s.body).toEqual({ ok: true, ia: false });
  });
});

describe('segurança', () => {
  it('envia cabeçalhos de segurança e limita requisições por IP', async () => {
    const a = criarApp({ obterModelo: () => null, limitePorMinuto: 2 });
    const s = await request(a).get('/api/saude');
    expect(s.headers['x-content-type-options']).toBe('nosniff');
    await request(a).post('/api/ia/aviso').send({ texto: 'abc' });
    await request(a).post('/api/ia/aviso').send({ texto: 'abc' });
    const r = await request(a).post('/api/ia/aviso').send({ texto: 'abc' });
    expect(r.status).toBe(429);
  });
});
