'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { falar } from '@/lib/fala';
import { Icone } from './Icone';

export type Vista = 'inicio' | 'ajustes' | 'morador' | 'lideranca' | 'cadastro' | 'conta' | 'pedido';

/** Cabeçalho com voltar, título, "Ouvir esta tela" e Ajustes. A vista pinta o tema (liderança = verde). */
export function Cabecalho({ vista, titulo, voltar, textoTela }: { vista: Vista; titulo?: string; voltar?: string | (() => void); textoTela?: () => string }) {
  const router = useRouter();
  const caminho = usePathname();
  useEffect(() => { document.body.setAttribute('data-vista', vista); }, [vista]);
  const lideranca = vista === 'lideranca' || vista === 'cadastro' || vista === 'conta';
  const aoVoltar = () => (typeof voltar === 'function' ? voltar() : router.push(voltar ?? '/'));
  return (
    <header>
      {vista !== 'inicio' && (
        <button type="button" className="hbtn" aria-label="Voltar" onClick={aoVoltar}><Icone nome="voltar" espessura={2.5} /></button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hmark simbolo-p" src="/marca/simbolo-raiz-preto.svg" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hmark simbolo-b" src="/marca/simbolo-raiz-branco.svg" alt="" />
      <div className="t">
        {vista === 'inicio' ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="wm wm-p" src="/marca/raiz-palavra-preto.svg" alt="RAIZ" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="wm wm-b" src="/marca/raiz-palavra-branco.svg" alt="RAIZ" />
          </>
        ) : titulo}
      </div>
      {lideranca && <span className="modo">Modo liderança</span>}
      <button type="button" className="hbtn" aria-label="Ouvir esta tela" onClick={() => { const t = textoTela?.() || document.querySelector('main h1')?.textContent || ''; if (t) void falar(t); }}>
        <Icone nome="somMais" espessura={2.2} /><span>Ouvir</span>
      </button>
      <Link className="hbtn" href={`/ajustes?volta=${encodeURIComponent(caminho || '/')}`} aria-label="Ajustes: letra, cores, botões e áudio" style={{ textDecoration: 'none' }}>
        <Icone nome="ajustes" espessura={2.2} /><span>Ajustes</span>
      </Link>
    </header>
  );
}

export function anunciar(t: string) {
  const el = document.getElementById('live');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => { el.textContent = t; }, 50);
}
