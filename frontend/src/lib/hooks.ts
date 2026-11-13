'use client';
import { useEffect, useState } from 'react';
import { repo, type Colecoes, type NomeColecao } from '@/data';

/** Lista viva de uma coleção do setor (atualiza sozinha quando o banco muda). */
export function useColecao<K extends NomeColecao>(col: K, setor: string | null) {
  const [lista, setLista] = useState<Colecoes[K][]>([]);
  useEffect(() => {
    if (!setor) { setLista([]); return; }
    return repo().assinar(col, setor, setLista);
  }, [col, setor]);
  return lista;
}

export function useAlerta(setor: string | null) {
  const [ativo, setAtivo] = useState(false);
  useEffect(() => (setor ? repo().alerta.assinar(setor, setAtivo) : undefined), [setor]);
  return ativo;
}

/** Valor guardado no aparelho (localStorage), com estado React. */
export function useGuardado(chave: string, inicial: string | null = null) {
  const [v, setV] = useState<string | null>(inicial);
  useEffect(() => { try { setV(localStorage.getItem(chave) ?? inicial); } catch { /* sem armazenamento */ } }, [chave, inicial]);
  const salvar = (n: string | null) => { setV(n); try { if (n === null) localStorage.removeItem(chave); else localStorage.setItem(chave, n); } catch { /* idem */ } };
  return [v, salvar] as const;
}
