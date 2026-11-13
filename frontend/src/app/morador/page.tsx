'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Feed } from '@/components/Avisos';
import { BlocoIdentificacao, BotaoDitado, validarIdentificacao, type Identificacao } from '@/components/Campos';
import { Cabecalho, anunciar } from '@/components/Cabecalho';
import { Erro, EtiquetaRisco, Nota } from '@/components/Etiquetas';
import { Icone } from '@/components/Icone';
import { MapaMorador } from '@/components/Mapa';
import { repo, type Pedido } from '@/data';
import { CASA_TXT, NIVEL, SETORES, SINAIS, SINAL_CHAVES, TELEFONE_DEFESA_CIVIL, posEm, setorNome, zona, type SinalChave } from '@/domain/catalogo';
import { atras, soDigitos } from '@/domain/texto';
import { useExigePreferencias } from '@/lib/acesso';
import { ia, IaIndisponivel } from '@/lib/api';
import { falar } from '@/lib/fala';
import { useColecao, useGuardado } from '@/lib/hooks';
import { fotoParaIA } from '@/lib/imagem';
import { usePreferencias } from '@/lib/preferencias';

type Passo = 'lugar' | 'painel' | 'sinal' | 'analisando' | 'resultado' | 'incerto' | 'enviado';
type Origem = 'foto' | 'texto' | 'desenho';

function StatusPedido({ p }: { p: Pedido }) {
  const quem = p.para === 'outro' ? p.paraNome || 'a pessoa da sua casa' : 'você';
  const cfg = {
    pendente: { cls: 'stc stc--pend', ic: 'relogio', t: 'Pedido de cadastro enviado', d: `A liderança ainda vai conferir o cadastro de ${quem}. Enviado ${atras(p.criadoEm)}.` },
    cadastrado: { cls: 'stc stc--ok', ic: 'casaOk', t: `${p.para === 'outro' ? `${quem} foi cadastrada` : 'Você foi cadastrado'} pela liderança`, d: `Residência: ${p.casaNome || 'sua casa'}. Em alerta, a liderança sabe quem mora com você.` },
    recusado: { cls: 'stc stc--nao', ic: 'pontos', t: 'A liderança não concluiu o cadastro', d: 'Fale com a liderança ou mande uma nova mensagem com mais detalhes.' },
  }[p.status];
  if (!cfg) return null;
  return (
    <div className={cfg.cls} role="status">
      <span className="ict"><Icone nome={cfg.ic} /></span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span className="eyebrow">Status do cadastro</span><b>{cfg.t}</b><span className="small">{cfg.d}</span></div>
    </div>
  );
}

export default function Morador() {
  useExigePreferencias('/morador');
  const { prefs } = usePreferencias();
  const [setor, setSetor] = useGuardado('raiz-setor');
  const [minhaZona, setMinhaZona] = useGuardado('raiz-minha-zona');
  const [passo, setPasso] = useState<Passo>('lugar');
  const [escolhaSetor, setEscolhaSetor] = useState<string>(SETORES[0].id);
  const [sinal, setSinal] = useState<SinalChave | null>(null);
  const [origem, setOrigem] = useState<Origem>('desenho');
  const [visto, setVisto] = useState('');
  const [incertoTxt, setIncertoTxt] = useState('');
  const [texto, setTexto] = useState('');
  const [mostrarTexto, setMostrarTexto] = useState(false);
  const [previa, setPrevia] = useState<string | null>(null);
  const [lento, setLento] = useState(false);
  const [pedirId, setPedirId] = useState(false);
  const [ident, setIdent] = useState<Identificacao>({ cpf: '', selfie: '' });
  const [erro, setErro] = useState<string | null>(null);
  const [meuPedido, setMeuPedido] = useState<Pedido | null>(null);
  const avisos = useColecao('avisos', setor);
  const lentoT = useRef<ReturnType<typeof setTimeout>>();
  const falarSe = (t: string) => { if (prefs.com !== 'texto') void falar(t); };

  useEffect(() => { if (setor) setPasso((p) => (p === 'lugar' ? 'painel' : p)); }, [setor]);
  useEffect(() => {
    const id = localStorage.getItem('raiz-meu-pedido');
    if (!id) return;
    return repo().assinarDoc('pedidos', id, setMeuPedido);
  }, []);
  useEffect(() => {
    clearTimeout(lentoT.current); setLento(false);
    if (passo === 'analisando') lentoT.current = setTimeout(() => { setLento(true); anunciar('Está demorando. Se for urgente, ligue 199.'); falarSe('Está demorando. Se for urgente, ligue 199 no botão vermelho.'); }, 5000);
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo]);

  function resultado(k: SinalChave, o: Origem, v: string) {
    setSinal(k); setOrigem(o); setVisto(v); setPedirId(false); setErro(null); setPasso('resultado');
    anunciar(`${SINAIS[k].label}. ${SINAIS[k].orient}`);
    falarSe(`Você viu: ${SINAIS[k].label}. O que fazer: ${SINAIS[k].orient}`);
  }
  function incerto(t: string) { setIncertoTxt(t); setPasso('incerto'); falarSe('Não deu para ter certeza. Toque no desenho mais parecido.'); }

  async function porFoto(f: File) {
    setPrevia(URL.createObjectURL(f)); setPasso('analisando');
    try { const r = await ia.sinalPorFoto(await fotoParaIA(f)); if (r.ok) resultado(r.sinal, 'foto', r.visto); else incerto(r.visto ? `A IA viu: ${r.visto}` : ''); }
    catch (e) { incerto(e instanceof IaIndisponivel ? 'A análise de foto não está disponível agora.' : 'Não consegui olhar a foto agora.'); }
  }
  async function porTexto() {
    if (!texto.trim()) return;
    setPrevia(null); setPasso('analisando');
    try { const r = await ia.sinalPorTexto(texto); if (r.ok) resultado(r.sinal, 'texto', r.visto); else incerto(r.visto ? `A IA entendeu: ${r.visto}` : ''); }
    catch { incerto('Não consegui entender agora.'); }
  }
  async function avisarLideranca() {
    setErro(null);
    if (!pedirId) { setPedirId(true); anunciar('Para enviar, tire uma selfie ou digite seu CPF.'); falarSe('Para enviar, tire uma selfie ou digite seu CPF.'); return; }
    const v = validarIdentificacao(ident); if (v) return setErro(v);
    if (!sinal || !setor) return;
    try {
      const r = repo();
      const autor = await r.auth.idMorador();
      await r.inserir('idents', { id: autor, setor, cpf: soDigitos(ident.cpf), selfie: ident.selfie, em: Date.now() }).catch(() => r.atualizar('idents', autor, { setor, cpf: soDigitos(ident.cpf), selfie: ident.selfie, em: Date.now() }));
      await r.inserir('relatos', { setor, sinal, origem, autor, zona: minhaZona ?? undefined, pos: minhaZona ? posEm(minhaZona) : undefined, criadoEm: Date.now() });
      setIdent({ cpf: '', selfie: '' }); setPasso('enviado'); anunciar('Aviso enviado.');
    } catch { setErro(`Não foi possível enviar agora. Ligue ${TELEFONE_DEFESA_CIVIL}.`); }
  }

  const voltar = () => {
    if (['resultado', 'analisando', 'incerto', 'enviado'].includes(passo)) return setPasso('sinal');
    if (passo === 'sinal' || (passo === 'lugar' && setor)) return setPasso('painel');
    window.location.href = '/';
  };
  const z = zona(minhaZona);

  return (
    <>
      <Cabecalho vista="morador" titulo="Morador" voltar={voltar} />
      <main id="v-morador">
        {passo === 'lugar' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1><span className="tone">Primeiro,</span> onde você mora?</h1>
            <div className="card"><label className="f" htmlFor="m-setor">Sua comunidade</label>
              <select id="m-setor" value={escolhaSetor} onChange={(e) => setEscolhaSetor(e.target.value)}>{SETORES.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>
            <button type="button" className="b-blue" onClick={() => { setSetor(escolhaSetor); setPasso('painel'); }}>Continuar</button>
          </section>
        )}

        {passo === 'painel' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <button type="button" className="lugar" onClick={() => { setEscolhaSetor(setor || SETORES[0].id); setPasso('lugar'); }}><Icone nome="pin" /><span>{setorNome(setor)} · trocar</span></button>
            <h1><span className="tone">Olá!</span> Como está a sua rua hoje?</h1>
            <button type="button" className="tile foto" onClick={() => setPasso('sinal')}><span className="ict"><Icone nome="alerta" /></span><span>Vi um sinal de risco<small>Foto, fala ou desenho</small></span></button>
            {meuPedido && <StatusPedido p={meuPedido} />}
            <div className="card">
              <div className="secao"><span className="ict"><Icone nome="casa" /></span><div style={{ flex: 1 }}><h2>Sua casa</h2><p className="small">{z ? 'Toque em outra área para trocar' : 'Toque no mapa onde fica a sua casa'}</p></div></div>
              <div className="mapa-mini"><MapaMorador selecionada={minhaZona} aoEscolher={(id) => { setMinhaZona(id); const zz = zona(id)!; anunciar(`Sua casa: ${zz.nome}, ${NIVEL[zz.nivel].txt}`); falarSe(`${zz.nome}. ${CASA_TXT[zz.nivel]}`); }} /></div>
              {z && (
                <div>
                  <div className="row"><EtiquetaRisco nivel={z.nivel} comNome /><b>{z.nome}</b></div>
                  <p style={{ fontSize: 'var(--fs-small)', marginTop: 8 }}>{CASA_TXT[z.nivel]}</p>
                  <p className="nota" style={{ marginTop: 6 }}>Mapa ilustrativo. No produto, vem do mapeamento oficial da Defesa Civil.</p>
                </div>
              )}
            </div>
            <div className="card">
              <div className="secao"><span className="ict"><Icone nome="chuva" /></span><div style={{ flex: 1 }}><h2>Tempo hoje</h2><p className="small">Previsão da APAC para o Grande Recife</p></div></div>
              <div className="tempo-grade"><div><span className="small">Agora</span><b>Nublado</b></div><div><span className="small">Máx · Mín</span><b>31° · 23°</b></div><div><span className="small">Chuva</span><b>Fraca à noite</b></div></div>
              <Nota>Dados de exemplo. No produto, vêm do boletim da APAC. <a href="https://www.apac.pe.gov.br/" target="_blank" rel="noopener noreferrer">Ver boletim oficial da APAC</a></Nota>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              <p className="eyebrow">Avisos da liderança</p>
              <Feed avisos={avisos} vazio="Nenhum aviso da liderança por enquanto." />
            </div>
            <Link className="linha card-linha" href="/pedido"><span className="ict"><Icone nome="pessoaMais" /></span><span className="lt"><b>Pedir cadastro à liderança</b><span>Para você ou para alguém da sua casa</span></span><Icone nome="chev" className="chev" espessura={2.4} /></Link>
          </section>
        )}

        {(passo === 'sinal' || passo === 'incerto') && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {passo === 'incerto' && <div className="warn"><h2>Não deu para ter certeza.</h2>{incertoTxt && <p className="small">{incertoTxt}</p>}<p>Toque no desenho mais parecido.</p></div>}
            <h1><span className="tone">O que você viu?</span> Mostre para a gente.</h1>
            <div className="tiles">
              <label className="btn tile foto" htmlFor="m-foto"><span className="ict"><Icone nome="camera" /></span><span>Tirar foto<small>A IA reconhece o sinal</small></span></label>
              <button type="button" className="tile voz" onClick={() => setMostrarTexto(!mostrarTexto)}><span className="ict"><Icone nome="mic" /></span><span>Falar ou escrever</span></button>
            </div>
            <input id="m-foto" type="file" accept="image/*" capture="environment" className="sr" tabIndex={-1} aria-hidden="true" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void porFoto(f); }} />
            {mostrarTexto && (
              <div className="card">
                <BotaoDitado valor={texto} aoMudar={setTexto} />
                <label className="f" htmlFor="m-texto">O que você viu?</label>
                <textarea id="m-texto" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: a lona da barreira rasgou com a chuva" />
                <button type="button" className="b-blue" onClick={porTexto}>Pronto</button>
              </div>
            )}
            <p className="eyebrow">Ou toque no desenho parecido</p>
            <div className="tiles">
              {SINAL_CHAVES.map((k) => (
                <button key={k} type="button" className="tile" onClick={() => resultado(k, 'desenho', '')}><span className="ict ict--seen"><Icone nome={k} cor="#B3400B" /></span><span>{SINAIS[k].label}</span></button>
              ))}
            </div>
          </section>
        )}

        {passo === 'analisando' && (
          <section className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {previa && <img className="preview" src={previa} alt="Sua foto" />}
            <div className="spinner" aria-hidden="true" />
            <h2>Olhando…</h2>
            <p className="muted extra">Leva alguns segundos.</p>
            {lento && <div className="warn" style={{ textAlign: 'left' }}><b>Está demorando.</b> Se for urgente, ligue no botão vermelho embaixo.</div>}
          </section>
        )}

        {passo === 'resultado' && sinal && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="resultado">
              <span className="ict ict--seen ict--xl"><Icone nome={sinal} cor="#B3400B" /></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <p className="eyebrow">Sinal visto</p>
                <h1 style={{ fontSize: 'calc(var(--font-base) * 1.5)' }}>{SINAIS[sinal].label}</h1>
                {visto && <div className="small">A IA viu: {visto}</div>}
              </div>
            </div>
            <div className="card">
              <p className="eyebrow">O que fazer</p>
              <p className="orient">{SINAIS[sinal].orient}</p>
              <button type="button" className="listen" onClick={() => falar(`${SINAIS[sinal].label}. O que fazer: ${SINAIS[sinal].orient}`)}><Icone nome="som" /><span>Ouvir de novo</span></button>
              <Nota>O aplicativo orienta. Quem decide é você, com a Defesa Civil.</Nota>
              <p className="small extra">Texto de exemplo. No produto: orientação da cartilha da Defesa Civil.</p>
            </div>
            {pedirId && <BlocoIdentificacao prefixo="mi" valor={ident} aoMudar={setIdent} />}
            <Erro texto={erro} />
            <button type="button" className="b-green" onClick={avisarLideranca}><Icone nome="enviar" />{pedirId ? 'Enviar aviso' : 'Avisar a liderança'}</button>
            <a className="btn b-org" href="tel:08000813400"><Icone nome="telefone" />Defesa Civil · {TELEFONE_DEFESA_CIVIL}</a>
            <button type="button" className="b-link" onClick={() => setPasso('sinal')}>Não é isso — voltar</button>
          </section>
        )}

        {passo === 'enviado' && sinal && (
          <section className="ok">
            <h1>Aviso enviado</h1>
            <p>A liderança de {setorNome(setor)} recebeu: {SINAIS[sinal].label}.</p>
            <p className="small">Só a liderança vê quem mandou. Se piorar, ligue no botão vermelho.</p>
            <Link className="btn b-out" href="/pedido">Pedir cadastro à liderança</Link>
            <button type="button" className="b-link" onClick={() => { setTexto(''); setMostrarTexto(false); setPasso('sinal'); }}>Mostrar outro sinal</button>
          </section>
        )}
      </main>
    </>
  );
}
