'use client';
import type { Canal, Necessidade, SinalChave } from '@/domain/catalogo';

/** Cliente das funções de IA. A chave do modelo fica só no servidor (pasta backend). */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class IaIndisponivel extends Error {}

async function post<T>(rota: string, corpo: unknown, ms = 20000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${BASE}/api/ia/${rota}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), signal: ctrl.signal });
    if (r.status === 503) throw new IaIndisponivel('A IA está desligada. Use o modo manual.');
    if (!r.ok) throw new Error(`falha_${r.status}`);
    return (await r.json()) as T;
  } catch (e) {
    if (e instanceof IaIndisponivel) throw e;
    throw new IaIndisponivel('Não consegui usar a IA agora.');
  } finally {
    clearTimeout(t);
  }
}

export type RespostaSinal = { ok: true; sinal: SinalChave; visto: string } | { ok: false; visto: string };

export const ia = {
  sinalPorFoto: (imagem: { base64: string; tipo: 'image/jpeg' }) => post<RespostaSinal>('sinal', { imagem }, 30000),
  sinalPorTexto: (texto: string) => post<RespostaSinal>('sinal', { texto }),
  organizarCadastro: (relato: string) => post<{
    nome: string; endereco: string; referencia: string; necessidades: Necessidade[]; necessidadeOutro: string;
    canal: Canal; contato: string; descartado: boolean;
  }>('cadastro', { relato }),
  adaptarMensagem: (base: string, pessoa: { nome: string; necessidades: string[]; canal: Canal }) =>
    post<{ mensagem: string; adaptada: boolean }>('mensagem', { base, pessoa }),
  simplificarAviso: (texto: string) => post<{ ok: boolean; texto: string }>('aviso', { texto }),
};
