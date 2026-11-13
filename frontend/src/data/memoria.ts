'use client';
import { soDigitos } from '@/domain/texto';
import { ErroAuth, type Cancelar, type Repositorio } from './repositorio';
import type { Colecoes, Lideranca, NomeColecao } from './tipos';

/** MODO DEMONSTRAÇÃO: dados fictícios guardados só neste navegador (localStorage). */
const CHAVE = 'raiz-demo-v1';
type Banco = { [K in NomeColecao]: Record<string, Colecoes[K]> } & {
  alertas: Record<string, boolean>;
  liderancas: Record<string, Lideranca & { pinHash: string }>;
};

const vazio = (): Banco => ({ casas: {}, pessoas: {}, relatos: {}, avisos: {}, pedidos: {}, idents: {}, fotos: {}, alertas: {}, liderancas: {} });

function carregar(): Banco {
  if (typeof window === 'undefined') return vazio();
  try { return { ...vazio(), ...JSON.parse(localStorage.getItem(CHAVE) || '{}') }; } catch { return vazio(); }
}

export async function hashPin(tel: string, pin: string): Promise<string> {
  const dados = new TextEncoder().encode(`raiz:${tel}:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', dados);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export function repositorioMemoria(): Repositorio {
  let db = carregar();
  const ouvintes = new Set<() => void>();
  const salvar = () => {
    try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch { /* cota cheia ou modo privado: segue em memória */ }
    ouvintes.forEach((f) => f());
  };
  const ouvir = (f: () => void): Cancelar => { ouvintes.add(f); f(); return () => ouvintes.delete(f); };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => { if (e.key === CHAVE) { db = carregar(); ouvintes.forEach((f) => f()); } });
  }
  const SESSAO = 'raiz-sessao';

  return {
    modo: 'demo',
    assinar(col, setor, cb) {
      return ouvir(() => cb(Object.values(db[col]).filter((d) => (d as { setor?: string }).setor === setor) as never));
    },
    assinarDoc(col, id, cb) {
      return ouvir(() => cb((db[col][id] as never) ?? null));
    },
    async inserir(col, dados) {
      const id = dados.id || novoId();
      (db[col] as Record<string, unknown>)[id] = { ...dados, id };
      salvar();
      return id;
    },
    async atualizar(col, id, patch) {
      const atual = db[col][id];
      if (!atual) throw new Error('nao_encontrado');
      (db[col] as Record<string, unknown>)[id] = { ...atual, ...patch };
      salvar();
    },
    async apagar(col, id) { delete db[col][id]; salvar(); },
    alerta: {
      assinar: (setor, cb) => ouvir(() => cb(!!db.alertas[setor])),
      async definir(setor, ativo) { db.alertas[setor] = ativo; salvar(); },
    },
    auth: {
      async entrar(tel, pin) {
        const t = soDigitos(tel).slice(-11);
        const c = db.liderancas[t];
        if (!c) throw new ErroAuth('Não achamos esse telefone. Crie uma conta de liderança.');
        if (c.pinHash !== (await hashPin(t, pin))) throw new ErroAuth('PIN errado. Tente de novo.');
        const { pinHash: _, ...l } = c;
        localStorage.setItem(SESSAO, JSON.stringify(l));
        return l;
      },
      async criarConta({ pin, ...l }) {
        const t = soDigitos(l.tel).slice(-11);
        if (db.liderancas[t]) throw new ErroAuth('Esse telefone já tem conta. Volte e entre.');
        db.liderancas[t] = { ...l, tel: t, pinHash: await hashPin(t, pin) };
        salvar();
        return this.entrar(t, pin);
      },
      async contaExemplo() {
        const tel = '81900000000';
        if (!db.liderancas[tel]) {
          db.liderancas[tel] = { nome: 'Maria do Carmo', assoc: 'Associação de Moradores do Alto', setor: 'alto-do-maracana', tel, pinHash: await hashPin(tel, '123456') };
          salvar();
        }
        return this.entrar(tel, '123456');
      },
      async sair() { localStorage.removeItem(SESSAO); },
      sessao() {
        try { return JSON.parse(localStorage.getItem(SESSAO) || 'null'); } catch { return null; }
      },
      async idMorador() {
        let id = localStorage.getItem('raiz-morador');
        if (!id) { id = novoId(); localStorage.setItem('raiz-morador', id); }
        return id;
      },
    },
  };
}
