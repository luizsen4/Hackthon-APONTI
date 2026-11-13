'use client';
import { AVISO_TIPOS, TELEFONE_DEFESA_CIVIL } from '@/domain/catalogo';
import { atras } from '@/domain/texto';
import type { Aviso } from '@/data/tipos';
import { falar } from '@/lib/fala';
import { Icone } from './Icone';

const ORDEM = { urgente: 0, abrigo: 1, aviso: 2, campanha: 3 } as const;
const recente = (a: Aviso) => Date.now() - a.criadoEm < 48 * 3600e3;

/** Urgente e abrigo recentes ficam no topo; o resto por data. */
export function ordenarAvisos(l: Aviso[]) {
  return [...l].sort((a, b) => {
    const d = ORDEM[a.tipo] - ORDEM[b.tipo];
    if (recente(a) && recente(b) && d) return d;
    return b.criadoEm - a.criadoEm;
  });
}

export function CartaoAviso({ a, aoApagar }: { a: Aviso; aoApagar?: () => void }) {
  const t = AVISO_TIPOS[a.tipo] ?? AVISO_TIPOS.aviso;
  const ouvir = () => falar(`${t.label}. ${a.titulo}. ${a.texto}${a.tipo === 'abrigo' ? ` Endereço: ${a.endereco}. Confirme no zero oitocentos, zero oito um, três quatro zero zero.` : ''}`);
  return (
    <article className={`aviso ${t.cls}`}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="pill av-tag"><Icone nome={t.icone} /><span>{t.label}</span></span>
        <span className="small">{atras(a.criadoEm)}</span>
      </div>
      <h3>{a.titulo}</h3>
      {a.texto && <p style={{ fontSize: 'var(--fs-small)' }}>{a.texto}</p>}
      {a.tipo === 'abrigo' && (
        <>
          {a.endereco && <p style={{ fontWeight: 700 }}>Endereço: {a.endereco}</p>}
          <p className="small">Confirme se está aberto no {TELEFONE_DEFESA_CIVIL} antes de ir.</p>
        </>
      )}
      <p className="small">Publicado por {a.autor || 'liderança'}</p>
      <div className="row">
        <button type="button" className="listen" onClick={ouvir}><Icone nome="som" /><span>Ouvir</span></button>
        {aoApagar && <button type="button" className="b-link" style={{ alignSelf: 'auto' }} onClick={aoApagar}>Apagar</button>}
      </div>
    </article>
  );
}

export function Feed({ avisos, vazio, aoApagar }: { avisos: Aviso[]; vazio: string; aoApagar?: (a: Aviso) => void }) {
  if (!avisos.length) return <p className="small card">{vazio}</p>;
  return (
    <div className="feed">
      {ordenarAvisos(avisos).slice(0, 12).map((a) => <CartaoAviso key={a.id} a={a} aoApagar={aoApagar ? () => aoApagar(a) : undefined} />)}
    </div>
  );
}
