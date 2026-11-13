'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Feed } from '@/components/Avisos';
import { Grade } from '@/components/Campos';
import { Cabecalho, anunciar } from '@/components/Cabecalho';
import { Carregando, Erro, EtiquetaRisco, Nota } from '@/components/Etiquetas';
import { Icone } from '@/components/Icone';
import { CartaoCasa, CartaoPedido, CartaoRelato } from '@/components/Lideranca';
import { MapaLideranca } from '@/components/Mapa';
import { repo, type Foto, type Ident, type Pedido } from '@/data';
import { carregarExemplo } from '@/data/exemplo';
import { AVISO_TIPOS, NIVEL, SETORES, SINAIS, SINAL_CHAVES, ZONAS, posEm, zona, type SinalChave, type TipoAviso } from '@/domain/catalogo';
import { estadoPainel, passaFiltro, type FiltroCasas } from '@/domain/prioridade';
import { PROIBIDAS, atras, limpa } from '@/domain/texto';
import { useExigePreferencias, useSessaoLideranca } from '@/lib/acesso';
import { ia } from '@/lib/api';
import { useAlerta, useColecao } from '@/lib/hooks';
import { fotoParaIA } from '@/lib/imagem';

type Aba = 'mapa' | 'casas' | 'mensagens' | 'avisos';
const FILTROS: [FiltroCasas, string][] = [['todas', 'Todas'], ['Pendente', 'A visitar'], ['Precisa Defesa Civil', 'Defesa Civil'], ['Não encontrado', 'Não encontradas'], ['Visitado', 'Visitadas'], ['semdoc', 'Sem documento']];

export default function PainelLideranca() {
  useExigePreferencias('/lideranca');
  const sessao = useSessaoLideranca();
  const router = useRouter();
  const [setor, setSetor] = useState<string | null>(null);
  useEffect(() => { if (sessao) setSetor(sessao.setor || SETORES[0].id); }, [sessao]);

  const casas = useColecao('casas', setor), pessoas = useColecao('pessoas', setor), relatos = useColecao('relatos', setor);
  const pedidos = useColecao('pedidos', setor), avisos = useColecao('avisos', setor), fotosL = useColecao('fotos', setor), identsL = useColecao('idents', setor);
  const alerta = useAlerta(setor);
  const fotos = useMemo(() => Object.fromEntries(fotosL.map((f) => [f.id, f])) as Record<string, Foto>, [fotosL]);
  const idents = useMemo(() => Object.fromEntries(identsL.map((i) => [i.id, i])) as Record<string, Ident>, [identsL]);
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 30000); return () => clearInterval(t); }, []);
  const E = useMemo(() => estadoPainel(casas, pessoas, relatos, alerta, agora), [casas, pessoas, relatos, alerta, agora]);

  const [aba, setAba] = useState<Aba>('mapa');
  const [filtro, setFiltro] = useState<FiltroCasas>('todas');
  const [busca, setBusca] = useState('');
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});
  const [destaque, setDestaque] = useState<string | null>(null);
  const [zonaSel, setZonaSel] = useState<string | null>(null);
  const [filtroMsg, setFiltroMsg] = useState<'todas' | 'ped' | 'sin'>('todas');
  const [semeando, setSemeando] = useState(false);

  const pendentes = E.ordem.filter((c) => c.status === 'Pendente');
  const pedidosPend = pedidos.filter((q) => q.status === 'pendente');
  const irCasa = (id: string) => {
    setFiltro('todas'); setBusca(''); setZonaSel(null); setDestaque(id); setAbertos((a) => ({ ...a, [id]: true })); setAba('casas');
    setTimeout(() => document.getElementById(`p-${id}`)?.scrollIntoView({ block: 'center' }), 60);
  };
  const cadastrarPedido = (q: Pedido) => router.push(`/lideranca/cadastro?pedido=${encodeURIComponent(q.id)}`);

  if (!sessao || !setor) return <Cabecalho vista="lideranca" titulo="Liderança" />;

  const listaCasas = E.ordem.filter((c) => passaFiltro(c, filtro, busca));
  const mensagens = [
    ...pedidos.map((q) => ({ t: 'ped' as const, em: q.criadoEm, pend: q.status === 'pendente', q })),
    ...relatos.filter((r) => SINAIS[r.sinal]).map((r) => ({ t: 'sin' as const, em: r.criadoEm, pend: false, r })),
  ].filter((m) => filtroMsg === 'todas' || m.t === filtroMsg).sort((a, b) => Number(b.pend) - Number(a.pend) || b.em - a.em).slice(0, 30);

  return (
    <>
      <Cabecalho vista="lideranca" titulo="Liderança" voltar="/" />
      <main id="v-lideranca">
        <div className="col-a">
          <div className="sessao">
            <span className="ict ict--lid"><Icone nome="pessoa" /></span>
            <b>Olá, {sessao.nome.split(' ')[0]}{sessao.assoc ? ` · ${sessao.assoc}` : ''}</b>
            <button type="button" className="b-link" style={{ alignSelf: 'auto' }} onClick={async () => { await repo().auth.sair(); router.push('/'); }}>Sair</button>
          </div>
          <div className="lid-head">
            <label className="sr" htmlFor="l-setor">Comunidade que você acompanha</label>
            <select id="l-setor" value={setor} onChange={(e) => setSetor(e.target.value)}>{SETORES.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
          </div>

          <div className={!pessoas.length && !casas.length ? 'agora agora--vazio' : E.ativo ? 'agora agora--ativo' : 'agora agora--calmo'} id="l-agora">
            {!pessoas.length && !casas.length ? (
              <>
                <p className="eyebrow">Primeiro passo</p>
                <h2>Comece cadastrando as residências</h2>
                <p>Cada casa reúne seus moradores: idosos, gestantes, crianças, quem tem dificuldade para entender, quem fica na cama…</p>
                {repo().modo === 'demo' && <button type="button" className="b-ghost" disabled={semeando} onClick={async () => { setSemeando(true); try { await carregarExemplo(repo(), setor); } finally { setSemeando(false); } }}>{semeando ? 'Carregando…' : 'Carregar comunidade de exemplo (10 casas fictícias)'}</button>}
              </>
            ) : E.ativo ? (
              <>
                <p className="eyebrow">Agora</p>
                <div className="row" style={{ alignItems: 'baseline', gap: 12 }}><span className="big">{pendentes.length}</span><h2>{pendentes.length ? (pendentes.length > 1 ? 'casas para visitar' : 'casa para visitar') : 'Todas as casas já têm status'}</h2></div>
                <p>{E.alerta || !E.risco ? 'Motivo: alerta ativo na comunidade.' : `Motivo: ${SINAIS[E.risco.sinal].label.toLowerCase()}${E.risco.zona ? ` em ${zona(E.risco.zona)?.nome}` : ''}, ${atras(E.risco.criadoEm)}.`}</p>
                {pendentes[0] && <button type="button" className="b-dark" onClick={() => irCasa(pendentes[0].id)}>Começar por: {pendentes[0].nome}</button>}
              </>
            ) : (
              <>
                <p className="eyebrow">Agora</p>
                <h2>Nenhum sinal de risco nas últimas 48 h</h2>
                <p>Quando chegar um sinal ou você marcar alerta, a ordem de visita das casas aparece aqui.</p>
              </>
            )}
          </div>

          <div className="stat">
            <div><b>{E.recentes.length}</b><span>sinais (48 h)</span></div>
            <div><b>{pendentes.length}</b><span>a visitar</span></div>
            <div><b>{E.ordem.filter((c) => c.status === 'Precisa Defesa Civil').length}</b><span>precisam Defesa Civil</span></div>
          </div>
          <button type="button" id="l-alerta" className={alerta ? 'b-red' : 'b-ghost'} onClick={() => repo().alerta.definir(setor, !alerta)}>
            <Icone nome="alerta" />{alerta ? 'Encerrar alerta da comunidade' : 'Marcar alerta na comunidade'}
          </button>

          {aba === 'mapa' && (
            <section id="t-mapa" role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card mapa-card"><MapaLideranca E={E} selecionada={zonaSel} aoZona={(id) => setZonaSel(zonaSel === id ? null : id)} aoCasa={irCasa} aoSinal={() => setAba('mensagens')} /></div>
              <div className="legend" role="list" aria-label="Legenda do mapa">
                {(['R4', 'R3', 'R2', 'R1'] as const).map((n) => <span key={n} role="listitem"><EtiquetaRisco nivel={n} comNome /></span>)}
                <span role="listitem"><b className="pin-d">1</b>Casa (ordem de visita)</span><span role="listitem"><b className="pin-s">!</b>Sinal</span>
              </div>
              <p className="small">Mapa ilustrativo. No produto, as áreas vêm do mapeamento oficial da Defesa Civil (dados abertos do Recife).</p>
              {zonaSel && (() => { const z = zona(zonaSel)!; const nas = E.ordem.filter((c) => c.zona === z.id); return (
                <div className="card">
                  <div className="row"><EtiquetaRisco nivel={z.nivel} comNome /><h3>{z.nome}</h3></div>
                  <p className="small">{z.desc}</p>
                  <p>{nas.length} {nas.length === 1 ? 'casa' : 'casas'} · {nas.filter((c) => c.status === 'Pendente').length} a visitar{E.riscoPorZona[z.id] ? ' · sinal recente' : ''}</p>
                  <button type="button" className="b-out" onClick={() => { setFiltro(`zona:${z.id}`); setAba('casas'); }}>Ver casas desta área</button>
                </div>); })()}
            </section>
          )}
        </div>

        <div className="col-b">
          <div className="tabs" role="tablist" aria-label="Painel">
            {([['mapa', 'Mapa', 0], ['casas', 'Casas', E.ordem.length], ['mensagens', 'Mensagens', E.recentes.length + pedidosPend.length], ['avisos', 'Avisos', avisos.length]] as const).map(([k, nome, n]) => (
              <button key={k} type="button" role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>{nome} {n ? <span className="cnt">({n})</span> : null}</button>
            ))}
          </div>

          {aba === 'casas' && (
            <section role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2>{E.ativo ? 'Visitar primeiro' : 'Casas cadastradas'}</h2>
              <div><label className="f" htmlFor="l-busca">Buscar por morador ou rua</label><input id="l-busca" placeholder="Ex.: Socorro, Ladeira" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
              <div className="filtros" role="group" aria-label="Filtrar casas">
                {FILTROS.map(([f, nome]) => <button key={f} type="button" className="fchip" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>{nome} ({E.ordem.filter((c) => passaFiltro(c, f, '')).length})</button>)}
                {filtro.startsWith('zona:') && <button type="button" className="fchip" aria-pressed="true" onClick={() => setFiltro('todas')}>Área: {zona(filtro.slice(5))?.nome} ✕</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {!listaCasas.length && E.ordem.length > 0 && <p className="small">Nenhuma casa neste filtro.</p>}
                {listaCasas.map((c) => <CartaoCasa key={c.id} c={c} E={E} fotos={fotos} aberto={!!abertos[c.id]} destaque={destaque === c.id}
                  aoAlternar={() => { setAbertos((a) => ({ ...a, [c.id]: !a[c.id] })); if (destaque === c.id) setDestaque(null); }} />)}
              </div>
              <p className="small">Esta lista não é completa: quem não está nela também pode precisar. Nenhum status garante que a pessoa está fora de perigo.</p>
              <button type="button" className="b-blue" onClick={() => router.push('/lideranca/cadastro')}><Icone nome="mais" espessura={2.4} />Cadastrar residência ou morador</button>
            </section>
          )}

          {aba === 'mensagens' && (
            <section role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><h2>Mensagens dos moradores</h2><p className="small">Pedidos de cadastro e sinais de risco. Os que esperam resposta ficam em cima.</p></div>
              <div className="row" role="group" aria-label="Filtrar mensagens" style={{ gap: 6, flexWrap: 'wrap' }}>
                {([['todas', 'Todas'], ['ped', `Pedidos de cadastro${pedidosPend.length ? ` · ${pedidosPend.length} novo${pedidosPend.length > 1 ? 's' : ''}` : ''}`], ['sin', 'Sinais de risco']] as const).map(([k, nome]) => (
                  <button key={k} type="button" className="fchip" aria-pressed={filtroMsg === k} onClick={() => setFiltroMsg(k)}>{nome}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!mensagens.length && <p className="small">Nenhuma mensagem ainda.</p>}
                {mensagens.map((m) => m.t === 'ped'
                  ? <CartaoPedido key={`p-${m.q.id}`} q={m.q} pessoas={pessoas} aoCadastrar={cadastrarPedido} />
                  : <CartaoRelato key={`r-${m.r.id}`} r={m.r} pessoas={pessoas} idents={idents} aoMapa={() => { setZonaSel(m.r.zona ?? null); setAba('mapa'); }} />)}
              </div>
              <IdentificarSinal setor={setor} aoSalvar={(z) => { setZonaSel(z); setAba('mapa'); }} />
            </section>
          )}

          {aba === 'avisos' && <PublicarAvisos setor={setor} autor={`${sessao.nome}${sessao.assoc ? ` · ${sessao.assoc}` : ''}`} avisos={avisos} />}
        </div>
      </main>
    </>
  );
}

/** A liderança identifica um sinal pela pessoa que não consegue usar o celular. */
function IdentificarSinal({ setor, aoSalvar }: { setor: string; aoSalvar: (zona: string) => void }) {
  const [zid, setZid] = useState(ZONAS[0].id);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [achado, setAchado] = useState<{ k: SinalChave; visto: string } | null>(null);
  const tratar = (r: { ok: boolean; sinal?: SinalChave; visto: string }) => (r.ok && r.sinal ? setAchado({ k: r.sinal, visto: r.visto }) : setErro(`A IA não teve certeza${r.visto ? ` (viu: ${r.visto})` : ''}. Escolha pelo desenho.`));
  const rodar = async (fn: () => Promise<{ ok: boolean; sinal?: SinalChave; visto: string }>) => {
    setErro(null); setAchado(null); setCarregando(true);
    try { tratar(await fn()); } catch { setErro('Não consegui analisar agora. Escolha pelo desenho.'); } finally { setCarregando(false); }
  };
  return (
    <div className="card">
      <h2>Identificar um sinal com IA</h2>
      <p className="small">Para quando o morador não consegue usar o celular ou não sabe explicar. Você registra pela pessoa.</p>
      <div><label className="f" htmlFor="li-zona">Onde está (área do mapa)</label><select id="li-zona" value={zid} onChange={(e) => setZid(e.target.value)}>{ZONAS.map((z) => <option key={z.id} value={z.id}>{z.nome} ({z.nivel} · {NIVEL[z.nivel].txt})</option>)}</select></div>
      <label className="btn b-blue" htmlFor="li-foto"><Icone nome="camera" />Tirar foto do sinal</label>
      <input type="file" id="li-foto" accept="image/*" capture="environment" className="sr" tabIndex={-1} aria-hidden="true" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void rodar(async () => ia.sinalPorFoto(await fotoParaIA(f))); }} />
      <label className="f" htmlFor="li-texto">Ou descreva o que viu ou ouviu do morador</label>
      <textarea id="li-texto" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: Dona Severina disse que a parede do quarto abriu uma rachada depois da chuva" />
      <button type="button" className="b-dark" onClick={() => texto.trim() && rodar(() => ia.sinalPorTexto(texto))}>Identificar pela descrição</button>
      <details><summary>Ou escolher pelo desenho</summary><div className="tiles" style={{ marginTop: 8 }}>
        {SINAL_CHAVES.map((k) => <button key={k} type="button" className="tile" onClick={() => setAchado({ k, visto: '' })}><span className="ict ict--seen"><Icone nome={k} cor="#B3400B" /></span><span>{SINAIS[k].label}</span></button>)}
      </div></details>
      {carregando && <Carregando texto="A IA está analisando…" />}
      <Erro texto={erro} />
      {achado && (
        <div className="warn">
          <span className="small" style={{ fontWeight: 800 }}>Sinal identificado</span>
          <div className="row" style={{ flexWrap: 'nowrap' }}><Icone nome={achado.k} cor="#B3400B" className="sig" style={{ width: 48, height: 48, flex: 'none' }} /><h2>{SINAIS[achado.k].label}</h2></div>
          {achado.visto && <p className="small">A IA viu: {achado.visto}</p>}
          <p style={{ fontWeight: 700 }}>Orientação: {SINAIS[achado.k].orient}</p>
          <Nota>O aplicativo orienta. Quem decide é a pessoa, com a Defesa Civil.</Nota>
          <button type="button" className="b-green" onClick={async () => {
            await repo().inserir('relatos', { setor, sinal: achado.k, origem: 'liderança', zona: zid, pos: posEm(zid), criadoEm: Date.now() });
            setAchado(null); setTexto(''); anunciar('Sinal registrado no mapa.'); aoSalvar(zid);
          }}>Registrar no mapa da comunidade</button>
          <button type="button" className="b-link" onClick={() => setAchado(null)}>Descartar</button>
        </div>
      )}
    </div>
  );
}

function PublicarAvisos({ setor, autor, avisos }: { setor: string; autor: string; avisos: import('@/data').Aviso[] }) {
  const [tipo, setTipo] = useState<TipoAviso>('aviso');
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [endereco, setEndereco] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [simplificando, setSimplificando] = useState(false);

  async function publicar(e: React.FormEvent) {
    e.preventDefault(); setErro(null);
    const tit = limpa(titulo, 80), txt = texto.trim().slice(0, 800), end = limpa(endereco, 120);
    if (!tit) return setErro('Escreva um título.');
    if (PROIBIDAS.test(`${tit} ${txt}`)) return setErro('Evite palavras como “seguro” ou “sem risco”. Diga o que a pessoa deve fazer.');
    if (tipo === 'abrigo' && !end) return setErro('Coloque o endereço do abrigo.');
    await repo().inserir('avisos', { setor, tipo, titulo: tit, texto: txt, endereco: tipo === 'abrigo' ? end : '', autor, criadoEm: Date.now() });
    setTitulo(''); setTexto(''); setEndereco(''); anunciar('Aviso publicado.');
  }
  async function simplificar() {
    if (!texto.trim()) return;
    setSimplificando(true); setErro(null);
    try { const r = await ia.simplificarAviso(texto); if (r.ok) setTexto(r.texto); else setErro('A IA não conseguiu reescrever sem mudar o sentido. Mantive o seu texto.'); }
    catch { setErro('Não foi possível usar a IA agora.'); }
    setSimplificando(false);
  }
  return (
    <section role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <form className="card" noValidate onSubmit={publicar}>
        <h2>Publicar aviso para a comunidade</h2>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="f">Tipo</legend>
          <Grade nome="avtipo" multiplo={false} valor={[tipo]} aoMudar={(v) => setTipo(v[0])} opcoes={Object.entries(AVISO_TIPOS).map(([k, t]) => [k as TipoAviso, t.label])}
            icones={Object.fromEntries(Object.entries(AVISO_TIPOS).map(([k, t]) => [k, t.icone]))} /></fieldset>
        <div><label className="f" htmlFor="av-tit">Título</label><input id="av-tit" maxLength={80} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Mutirão de limpeza do canal no sábado" /></div>
        <div><label className="f" htmlFor="av-txt">Mensagem</label><textarea id="av-txt" maxLength={800} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva do seu jeito. A IA pode deixar em linguagem simples." /></div>
        <button type="button" className="b-out" disabled={simplificando} onClick={simplificar}><Icone nome="brilho" /><span>{simplificando ? 'Reescrevendo…' : 'Deixar em linguagem simples (IA)'}</span></button>
        {tipo === 'abrigo' && <div><label className="f" htmlFor="av-end">Endereço do abrigo (da lista oficial)</label><input id="av-end" maxLength={120} value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Ex.: Escola Municipal …, Rua …" /></div>}
        <Erro texto={erro} />
        <button type="submit" className="b-dark">Publicar</button>
        <p className="small">Abrigos: publique só os da lista oficial da Defesa Civil. O aviso diz automaticamente “confirme no 0800 081 3400”.</p>
      </form>
      <p className="eyebrow">Publicados nesta comunidade</p>
      <Feed avisos={avisos} vazio="Nenhum aviso publicado ainda." aoApagar={(a) => repo().apagar('avisos', a.id)} />
    </section>
  );
}
