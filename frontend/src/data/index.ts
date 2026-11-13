'use client';
import { repositorioMemoria } from './memoria';
import type { Repositorio } from './repositorio';
import { repositorioSupabase } from './supabase';

let instancia: Repositorio | null = null;

/** Supabase se as variáveis existirem; senão, modo demonstração no navegador. */
export function repo(): Repositorio {
  if (instancia) return instancia;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  instancia = url && chave ? repositorioSupabase(url, chave) : repositorioMemoria();
  return instancia;
}

export type { Repositorio } from './repositorio';
export * from './tipos';
