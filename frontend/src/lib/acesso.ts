'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { repo, type Lideranca } from '@/data';
import { usePreferencias } from './preferencias';

/** Na primeira entrada, manda para o questionário de acessibilidade e volta depois. */
export function useExigePreferencias(volta: string) {
  const { definidas } = usePreferencias();
  const router = useRouter();
  useEffect(() => { if (!definidas) router.replace(`/ajustes?volta=${encodeURIComponent(volta)}`); }, [definidas, router, volta]);
}

/** Telas da liderança: sem sessão, volta ao login. */
export function useSessaoLideranca() {
  const router = useRouter();
  const [sessao, setSessao] = useState<Lideranca | null>(null);
  useEffect(() => {
    const s = repo().auth.sessao();
    if (!s) router.replace('/'); else setSessao(s);
  }, [router]);
  return sessao;
}
