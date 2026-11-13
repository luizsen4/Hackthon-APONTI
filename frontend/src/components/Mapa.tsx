'use client';
import { NIVEL, SINAIS, ZONAS, centro, zona } from '@/domain/catalogo';
import type { CasaPainel, EstadoPainel } from '@/domain/prioridade';
import { atras } from '@/domain/texto';

const PADROES = (
  <defs>
    <pattern id="hx" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0L6 6M6 0L0 6" stroke="#fff" strokeOpacity=".55" strokeWidth="1" /></pattern>
    <pattern id="hd" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="#000" strokeOpacity=".35" strokeWidth="1" /></pattern>
    <pattern id="pt" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".9" fill="#000" fillOpacity=".4" /></pattern>
  </defs>
);

const teclado = (fn: () => void) => ({
  onClick: fn, tabIndex: 0, role: 'button' as const, style: { cursor: 'pointer' },
  onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } },
});

function Zonas({ selecionada, aoEscolher, opaco }: { selecionada: string | null; aoEscolher: (id: string) => void; opaco?: boolean }) {
  return (
    <>
      {ZONAS.map((z) => {
        const n = NIVEL[z.nivel], pts = z.poly.map((p) => p.join(',')).join(' '), on = selecionada === z.id;
        const lx = Math.min(...z.poly.map((q) => q[0])) + 12, ly = Math.min(...z.poly.map((q) => q[1])) + 15;
        const op = opaco ? (selecionada && !on ? 0.3 : 0.7) : on ? 0.85 : 0.62;
        return (
          <g key={z.id} {...teclado(() => aoEscolher(z.id))} aria-label={`Área ${z.nome}, risco ${n.txt}`}>
            <polygon points={pts} fill={n.cor} fillOpacity={op} stroke={on ? '#141414' : n.cor} strokeWidth={on ? 3.5 : 1.5} />
            {n.pat && <polygon points={pts} fill={`url(#${n.pat})`} pointerEvents="none" />}
            <text x={lx} y={ly} fontSize="9.5" fontWeight="800" fill="#141414" stroke="#fff" strokeWidth="3" paintOrder="stroke">{`${z.nivel} · ${z.nome}`}</text>
          </g>
        );
      })}
      <rect x="18" y="262" width="324" height="14" fill="#5B9BD5" opacity=".85" />
    </>
  );
}

/** Mapa pequeno do morador: ele toca na área onde fica a casa. */
export function MapaMorador({ selecionada, aoEscolher }: { selecionada: string | null; aoEscolher: (id: string) => void }) {
  const z = zona(selecionada);
  const c = z ? centro(z) : null;
  return (
    <svg viewBox="0 0 360 310" width="100%" role="img" aria-label="Mapa das áreas de risco da comunidade. Toque na área onde fica sua casa.">
      {PADROES}<rect width="360" height="310" fill="#EDEDEB" />
      <Zonas selecionada={selecionada} aoEscolher={aoEscolher} opaco />
      {c && <g transform={`translate(${c[0] - 14},${c[1] - 14})`}><circle cx="14" cy="14" r="16" fill="#141414" /><path d="M8 14l6-5 6 5v7h-12z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /></g>}
    </svg>
  );
}

const corStatus = (st: CasaPainel['status']) => (st === 'Visitado' ? '#005A8C' : st === 'Precisa Defesa Civil' ? '#9C3F00' : st === 'Não encontrado' ? '#704C00' : '#141414');

/** Mapa da liderança: áreas de risco, casas numeradas na ordem de visita e sinais recentes. */
export function MapaLideranca({ E, selecionada, aoZona, aoCasa, aoSinal }: { E: EstadoPainel; selecionada: string | null; aoZona: (id: string) => void; aoCasa: (id: string) => void; aoSinal: () => void }) {
  return (
    <svg viewBox="0 0 360 310" width="100%" role="img" aria-label={`Mapa ilustrativo com ${ZONAS.length} áreas de risco, ${E.ordem.length} casas e ${E.recentes.length} sinais`}>
      {PADROES}<rect width="360" height="310" fill="#EDEDEB" />
      <Zonas selecionada={selecionada} aoEscolher={aoZona} />
      <text x="180" y="273" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">Canal</text>
      <path d="M95 18 L92 230" stroke="#fff" strokeWidth="6" /><path d="M250 18 L252 178" stroke="#fff" strokeWidth="4" strokeDasharray="6 3" />
      <path d="M24 150 L338 140" stroke="#fff" strokeWidth="6" /><path d="M18 210 L342 202" stroke="#fff" strokeWidth="8" />
      {E.recentes.filter((r) => r.pos).map((r) => (
        <g key={r.id} {...teclado(aoSinal)} aria-label={`Sinal: ${SINAIS[r.sinal].label}, ${atras(r.criadoEm)}`}>
          <path d={`M${r.pos!.x} ${r.pos!.y - 13} l9 15 h-18z`} fill={SINAIS[r.sinal].risco ? '#8F3F00' : '#704C00'} stroke="#fff" strokeWidth="1.5" />
          <text x={r.pos!.x} y={r.pos!.y} textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">!</text>
        </g>
      ))}
      {E.ordem.filter((c) => c.pos).map((c) => (
        <g key={c.id} {...teclado(() => aoCasa(c.id))} aria-label={`Casa ${E.posicao[c.id]}: ${c.nome}, ${c.status}`}>
          <circle cx={c.pos!.x} cy={c.pos!.y} r="10" fill={corStatus(c.status)} stroke="#fff" strokeWidth="2" />
          <text x={c.pos!.x} y={c.pos!.y + 3.5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{E.posicao[c.id]}</text>
        </g>
      ))}
    </svg>
  );
}
