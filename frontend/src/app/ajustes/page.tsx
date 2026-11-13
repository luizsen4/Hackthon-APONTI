'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Icone } from '@/components/Icone';
import { falar } from '@/lib/fala';
import { NOME_LETRA, PADRAO, TAM_LETRA, usePreferencias, type Comunicacao, type Preferencias, type Tema } from '@/lib/preferencias';

type Mini = { bg: string; card: string; tx: string; mu: string; bt: string; bd: string; ac: string; bw?: string };
const TEMAS: { v: Tema; label: string; desc: string; th: Mini }[] = [
  { v: 'claro', label: 'Claro', desc: 'Para o dia', th: { bg: '#F6F6F4', card: '#FFFFFF', tx: '#141414', mu: '#5E5E5A', bt: '#141414', bd: '#E2E2DE', ac: '#C6D8FF' } },
  { v: 'escuro', label: 'Escuro', desc: 'Cansa menos à noite', th: { bg: '#0E1116', card: '#181D25', tx: '#EEF1F5', mu: '#AAB3BE', bt: '#EEF1F5', bd: '#2B323D', ac: '#24375E' } },
  { v: 'contraste', label: 'Alto contraste', desc: 'Para quem enxerga pouco', th: { bg: '#FFFFFF', card: '#FFFFFF', tx: '#000000', mu: '#000000', bt: '#000000', bd: '#000000', ac: '#FFE600', bw: '3px' } },
];
const COMS: { v: Comunicacao; label: string; desc: string; ic: string }[] = [
  { v: 'ambos', label: 'Ouvir e ler', desc: 'A tela fala sozinha e mostra o texto', ic: 'somMais' },
  { v: 'audio', label: 'Só ouvir', desc: 'A tela fala sozinha, com menos texto', ic: 'somMais' },
  { v: 'texto', label: 'Só ler', desc: 'Sem som automático. O botão Ouvir continua lá', ic: 'texto_facil' },
];
const PASSOS = [
  { k: 'com', tit: 'Como você prefere receber as informações?', sub: 'Vamos deixar o aplicativo do seu jeito. São 4 perguntas rápidas. Pode mudar depois em Ajustes.' },
  { k: 'letra', tit: 'Qual tamanho de letra fica melhor?', sub: 'Arraste a barra até ler sem esforço.' },
  { k: 'tamanho', tit: 'Qual tamanho de botão fica melhor?', sub: 'Botões maiores são mais fáceis de tocar.' },
  { k: 'tema', tit: 'Quais cores ficam melhores para você?', sub: 'Veja o exemplo embaixo e escolha.' },
] as const;

function MiniTela({ t }: { t: Mini }) {
  const bw = t.bw ?? '1px';
  const barra = (w: string, h: number, c: string, o = 0.9) => <span style={{ display: 'block', height: h, width: w, borderRadius: h / 2, background: c, opacity: o }} />;
  return (
    <span className="a-mini" style={{ background: t.bg, border: `${bw} solid ${t.bd}` }}>
      {barra('38%', 8, t.tx)}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 5, background: t.card, border: `${bw} solid ${t.bd}`, borderRadius: 8, padding: 7 }}>
        <span style={{ font: '800 13px/1 Inter, sans-serif', color: t.tx }}>Aa</span>
        {barra('90%', 5, t.mu, 0.7)}{barra('65%', 5, t.mu, 0.7)}{barra('100%', 14, t.bt, 1)}
      </span>
      <span style={{ display: 'block', height: 12, width: '55%', borderRadius: 6, background: t.ac, border: `${bw} solid ${t.bd}` }} />
    </span>
  );
}

function Previa({ p }: { p: Preferencias }) {
  const COM = { ambos: 'Ouvir e ler', audio: 'Só ouvir', texto: 'Só ler' }, TEMA = { claro: 'Claro', escuro: 'Escuro', contraste: 'Alto contraste' };
  return (
    <div id="a-prev" aria-hidden="true">
      <div className="a-prev-h"><span className="eyebrow">Assim vai ficar</span>
        <span className="small">{[COM[p.com], `Letra ${NOME_LETRA[p.letra - 1].toLowerCase()}`, `Botão ${p.tamanho === 'grande' ? 'grande' : 'médio'}`, TEMA[p.tema]].join(' · ')}</span></div>
      <div className="a-prev-card">
        <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
          <span className="ict ict--seen"><Icone nome="lona_rasgada" /></span>
          <div style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block' }}>Lona rasgada</b><span className="small">Sinal de risco · Rua da Ladeira</span></div>
        </div>
        <p>Não tire nem mexa na lona da barreira. Avise a liderança.</p>
        <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
          {p.com !== 'texto' && <span className="btn b-ghost" style={{ flex: 1 }}><Icone nome="som" />Ouvir</span>}
          <span className="btn b-blue" style={{ flex: 1.4 }}>Avisar a liderança</span>
        </div>
      </div>
    </div>
  );
}

function Ajustes() {
  const { prefs, definidas, mudar, salvar } = usePreferencias();
  const router = useRouter();
  const volta = useSearchParams().get('volta') || '/';
  const destino = volta.startsWith('/') && !volta.startsWith('//') ? volta : '/';
  const [passo, setPasso] = useState(0);
  const tit = useRef<HTMLHeadingElement>(null);
  const st = PASSOS[passo];
  useEffect(() => { document.body.setAttribute('data-vista', 'ajustes'); }, []);
  useEffect(() => {
    tit.current?.focus({ preventScroll: true });
    if (passo > 0 && prefs.com !== 'texto') void falar(`${st.tit} ${st.sub}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo]);

  const escolher = (d: Partial<Preferencias>, nome: string) => { mudar(d); if (prefs.com !== 'texto' || d.com && d.com !== 'texto') void falar(`${nome} escolhido.`); };
  const concluir = (p?: Preferencias) => { salvar(p); router.replace(destino); };

  return (
    <main id="v-ajustes" role="dialog" aria-modal="true" aria-labelledby="a-tit">
      <div className="in">
        <div className="top">
          <button type="button" className="hbtn" aria-label="Voltar" style={{ visibility: passo > 0 || definidas ? 'visible' : 'hidden' }}
            onClick={() => (passo > 0 ? setPasso(passo - 1) : router.replace(destino))}><Icone nome="voltar" espessura={2.5} /></button>
          <div className="dots" aria-hidden="true">{PASSOS.map((_, i) => <i key={i} className={i === passo ? 'on' : ''} />)}</div>
          <button type="button" className="hbtn" aria-label="Ouvir a pergunta" onClick={() => falar(`${st.tit} ${st.sub}`)}><Icone nome="som" espessura={2.2} /><span>Ouvir</span></button>
        </div>
        {passo === 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <div id="a-logo"><div className="selo" style={{ width: 140 }}><img className="simbolo-p" src="/marca/simbolo-raiz-preto.svg" alt="Símbolo do RAIZ" /><img className="simbolo-b" src="/marca/simbolo-raiz-branco.svg" alt="Símbolo do RAIZ" /></div></div>
        )}
        <h1 id="a-tit" ref={tit} tabIndex={-1}>{st.tit}</h1>
        <p className="muted">{st.sub}</p>

        <div role="radiogroup" aria-labelledby="a-tit" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {st.k === 'com' && COMS.map((o) => (
            <button key={o.v} type="button" className="opt" role="radio" aria-checked={prefs.com === o.v} onClick={() => escolher({ com: o.v }, o.label)}>
              <span className="ict"><Icone nome={o.ic} style={{ width: 32, height: 32 }} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: '1.05rem' }}>{o.label}</span><span className="small" style={{ fontWeight: 600 }}>{o.desc}</span></span>
              <span className="ck" aria-hidden="true" />
            </button>
          ))}
          {st.k === 'letra' && (
            <>
              <p style={{ fontWeight: 800, fontSize: '1.2rem', textAlign: 'center' }}>Letra {NOME_LETRA[prefs.letra - 1]} ({prefs.letra} de 5)</p>
              <input type="range" min={1} max={5} step={1} value={prefs.letra} aria-label="Tamanho da letra" aria-valuetext={NOME_LETRA[prefs.letra - 1]}
                onChange={(e) => mudar({ letra: Number(e.target.value) })} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 4px' }} aria-hidden="true">
                {TAM_LETRA.map((px, i) => <button key={px} type="button" tabIndex={-1} onClick={() => mudar({ letra: i + 1 })} style={{ width: 'auto', minHeight: 44, background: 'transparent', color: 'var(--text-strong)', padding: '0 6px', fontSize: px }}>A</button>)}
              </div>
            </>
          )}
          {st.k === 'tamanho' && (
            <div className="a-temas a-temas--2">
              {([['normal', 'Médio', 'Padrão · dois desenhos por linha', 44], ['grande', 'Grande', 'Um desenho por linha', 58]] as const).map(([v, label, desc, bx]) => (
                <button key={v} type="button" className="a-tema" role="radio" aria-checked={prefs.tamanho === v} aria-label={`${label}. ${desc}`} onClick={() => escolher({ tamanho: v }, label)}>
                  <span className="a-mini a-mini--tam"><span className="a-bt" style={{ height: bx * 0.62 }}>Avisar</span>{v === 'normal' ? <span className="a-tl2"><i /><i /></span> : <span className="a-tl1"><i /></span>}</span>
                  <span className="a-tema-t">{label}</span><span className="small">{desc}</span><span className="ck" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          {st.k === 'tema' && (
            <div className="a-temas">
              {TEMAS.map((o) => (
                <button key={o.v} type="button" className="a-tema" role="radio" aria-checked={prefs.tema === o.v} aria-label={`${o.label}. ${o.desc}`} onClick={() => escolher({ tema: o.v }, o.label)}>
                  <MiniTela t={o.th} /><span className="a-tema-t">{o.label}</span><span className="small">{o.desc}</span><span className="ck" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="a-foot">
          <Previa p={prefs} />
          <button type="button" className="b-blue" onClick={() => (passo < PASSOS.length - 1 ? setPasso(passo + 1) : concluir())}>
            {passo === PASSOS.length - 1 ? 'Pronto, começar' : 'Próximo'}
          </button>
          {!definidas && <button type="button" className="b-link" onClick={() => concluir(PADRAO)}>Pular e usar o padrão</button>}
        </div>
      </div>
    </main>
  );
}

export default function PaginaAjustes() {
  return <Suspense fallback={null}><Ajustes /></Suspense>;
}
