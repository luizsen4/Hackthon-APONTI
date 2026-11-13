'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { soDigitos } from '@/domain/texto';
import { ErroAuth, type Cancelar, type Repositorio } from './repositorio';
import type { Lideranca, NomeColecao } from './tipos';

// No banco as colunas são snake_case (criado_em); no app, camelCase (criadoEm).
const paraSnake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const paraCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const mapear = (o: Record<string, unknown>, f: (k: string) => string) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [f(k), v]));
const doBanco = <T,>(linha: Record<string, unknown>) => mapear(linha, paraCamel) as T;
const paraBanco = (o: object) => mapear(o as Record<string, unknown>, paraSnake);

/** O login da liderança usa telefone + PIN de 6 números como e-mail/senha sintéticos do Supabase Auth.
 *  Em produção, trocar por OTP via SMS (Supabase Phone Auth). */
const emailDe = (tel: string) => `${soDigitos(tel).slice(-11)}@lideranca.raiz.app`;

export function repositorioSupabase(url: string, chave: string): Repositorio {
  const sb: SupabaseClient = createClient(url, chave, { auth: { persistSession: true } });
  let perfil: Lideranca | null = null;
  try { perfil = JSON.parse(localStorage.getItem('raiz-sessao') || 'null'); } catch { /* sem sessão */ }

  function canal(tabela: string, filtro: string | undefined, recarregar: () => void): Cancelar {
    const ch = sb.channel(`${tabela}:${filtro ?? 'todos'}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tabela, ...(filtro ? { filter: filtro } : {}) }, recarregar)
      .subscribe();
    return () => { void sb.removeChannel(ch); };
  }

  async function carregarPerfil(): Promise<Lideranca> {
    const { data: u } = await sb.auth.getUser();
    if (!u.user) throw new ErroAuth('Não foi possível entrar agora.');
    const { data, error } = await sb.from('liderancas').select('nome,assoc,setor,tel').eq('user_id', u.user.id).single();
    if (error || !data) throw new ErroAuth('Conta sem perfil de liderança.');
    perfil = data as Lideranca;
    localStorage.setItem('raiz-sessao', JSON.stringify(perfil));
    return perfil;
  }

  const repo: Repositorio = {
    modo: 'supabase',
    assinar(col, setor, cb) {
      let vivo = true;
      const recarregar = async () => {
        const { data } = await sb.from(col).select('*').eq('setor', setor);
        if (vivo) cb((data ?? []).map((l) => doBanco(l)) as never);
      };
      void recarregar();
      const parar = canal(col, `setor=eq.${setor}`, recarregar);
      return () => { vivo = false; parar(); };
    },
    assinarDoc(col, id, cb) {
      let vivo = true;
      const recarregar = async () => {
        const { data } = await sb.from(col).select('*').eq('id', id).maybeSingle();
        if (vivo) cb(data ? (doBanco(data) as never) : null);
      };
      void recarregar();
      const parar = canal(col, `id=eq.${id}`, recarregar);
      return () => { vivo = false; parar(); };
    },
    async inserir(col, dados) {
      const { data: u } = await sb.auth.getUser();
      const linha = paraBanco({ ...dados, ...(['pedidos', 'relatos'].includes(col) && u.user ? { autor: (dados as { autor?: string }).autor ?? u.user.id } : {}) });
      const { data, error } = await sb.from(col).insert(linha).select('id').single();
      if (error) throw error;
      return String(data.id);
    },
    async atualizar(col, id, patch) {
      const { error } = await sb.from(col).update(paraBanco(patch)).eq('id', id);
      if (error) throw error;
    },
    async apagar(col: NomeColecao, id) {
      const { error } = await sb.from(col).delete().eq('id', id);
      if (error) throw error;
    },
    alerta: {
      assinar(setor, cb) {
        let vivo = true;
        const recarregar = async () => {
          const { data } = await sb.from('setores_estado').select('alerta').eq('setor', setor).maybeSingle();
          if (vivo) cb(!!data?.alerta);
        };
        void recarregar();
        const parar = canal('setores_estado', `setor=eq.${setor}`, recarregar);
        return () => { vivo = false; parar(); };
      },
      async definir(setor, ativo) {
        const { error } = await sb.from('setores_estado').upsert({ setor, alerta: ativo, atualizado_em: new Date().toISOString() });
        if (error) throw error;
      },
    },
    auth: {
      async entrar(tel, pin) {
        const { error } = await sb.auth.signInWithPassword({ email: emailDe(tel), password: pin });
        if (error) throw new ErroAuth('Telefone ou PIN errado.');
        return carregarPerfil();
      },
      async criarConta({ pin, ...l }) {
        const { data, error } = await sb.auth.signUp({ email: emailDe(l.tel), password: pin });
        if (error || !data.user) throw new ErroAuth(error?.message.includes('registered') ? 'Esse telefone já tem conta.' : 'Não foi possível criar a conta.');
        const { error: e2 } = await sb.from('liderancas').insert({ user_id: data.user.id, nome: l.nome, assoc: l.assoc, setor: l.setor, tel: soDigitos(l.tel).slice(-11) });
        if (e2) throw new ErroAuth('Conta criada, mas o perfil não foi salvo.');
        return carregarPerfil();
      },
      async contaExemplo() {
        throw new ErroAuth('A conta de exemplo só existe no modo demonstração.');
      },
      async sair() { await sb.auth.signOut(); perfil = null; localStorage.removeItem('raiz-sessao'); },
      sessao: () => perfil,
      async idMorador() {
        const { data } = await sb.auth.getUser();
        if (data.user) return data.user.id;
        // Morador não tem conta: sessão anônima do Supabase (ativar "Anonymous sign-ins" no painel).
        const { data: a, error } = await sb.auth.signInAnonymously();
        if (error || !a.user) throw new Error('sem_sessao');
        return a.user.id;
      },
    },
  };
  return repo;
}
