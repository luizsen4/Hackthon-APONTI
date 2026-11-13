'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Comunicacao = 'ambos' | 'audio' | 'texto';
export type Tema = 'claro' | 'escuro' | 'contraste';
export interface Preferencias { com: Comunicacao; letra: number; tamanho: 'normal' | 'grande'; tema: Tema }

export const PADRAO: Preferencias = { com: 'ambos', letra: 2, tamanho: 'normal', tema: 'claro' };
export const TAM_LETRA = [13, 15, 17, 20, 23];
export const NOME_LETRA = ['Pequena', 'Média', 'Grande', 'Maior', 'Muito grande'];
const CHAVE = 'raiz-prefs';

/** Aplica as escolhas de acessibilidade no documento (tema, letra, tamanho do toque). */
export function aplicar(p: Preferencias) {
  const r = document.documentElement;
  if (p.tema === 'claro') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', p.tema);
  r.style.setProperty('--font-base', `${TAM_LETRA[Math.min(5, Math.max(1, p.letra)) - 1]}px`);
  const grande = p.tamanho === 'grande';
  r.style.setProperty('--touch-min', grande ? '56px' : '44px');
  r.style.setProperty('--sign-columns', grande ? '1' : '2');
  r.style.setProperty('--icon-xl', grande ? '64px' : '48px');
  document.body.classList.toggle('so-audio', p.com === 'audio');
}

interface Ctx { prefs: Preferencias; definidas: boolean; mudar(p: Partial<Preferencias>): void; salvar(p?: Preferencias): void; }
const Contexto = createContext<Ctx | null>(null);

export function ProvedorPreferencias({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferencias>(PADRAO);
  const [definidas, setDefinidas] = useState(true);
  useEffect(() => {
    try {
      const s = localStorage.getItem(CHAVE);
      if (s) { const p = { ...PADRAO, ...JSON.parse(s) }; setPrefs(p); aplicar(p); } else { setDefinidas(false); aplicar(PADRAO); }
    } catch { aplicar(PADRAO); }
  }, []);
  const mudar = useCallback((d: Partial<Preferencias>) => setPrefs((p) => { const n = { ...p, ...d }; aplicar(n); return n; }), []);
  const salvar = useCallback((p?: Preferencias) => {
    setPrefs((atual) => { const n = p ?? atual; try { localStorage.setItem(CHAVE, JSON.stringify(n)); } catch { /* sem armazenamento */ } aplicar(n); return n; });
    setDefinidas(true);
  }, []);
  return <Contexto.Provider value={{ prefs, definidas, mudar, salvar }}>{children}</Contexto.Provider>;
}

export function usePreferencias() {
  const c = useContext(Contexto);
  if (!c) throw new Error('usePreferencias fora do provedor');
  return c;
}
