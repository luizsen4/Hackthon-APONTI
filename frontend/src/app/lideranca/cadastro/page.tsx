'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { BotaoDitado, CampoFoto, Grade } from '@/components/Campos';
import { Cabecalho, anunciar } from '@/components/Cabecalho';
import { Carregando, Erro } from '@/components/Etiquetas';
import { Icone } from '@/components/Icone';
import { repo, type Pedido } from '@/data';
import { CANAIS, NECESSIDADES, NIVEL, SETORES, ZONAS, posEm, zona, type Canal, type Necessidade } from '@/domain/catalogo';
import { nomeCasa, resumoVulnerabilidade } from '@/domain/prioridade';
import { cpfValido, formataCpf, limpa, soDigitos } from '@/domain/texto';
import { useSessaoLideranca } from '@/lib/acesso';
import { ia } from '@/lib/api';
import { falar } from '@/lib/fala';
import { useColecao } from '@/lib/hooks';

const TERMO = 'Seu nome, documento, endereço, o que você precisa e as fotos ficam só com a liderança da comunidade, para te avisar e ajudar se tiver risco. Em emergência, podem ir para a Defesa Civil. Você pode pedir para apagar quando quiser.';
const NOVA = 'nova';
type Form = {
  casa: string; end: string; ref: string; setor: string; zona: string; fotoCasa: string | null;
  nome: string; cpf: string; semdoc: boolean; necs: Necessidade[]; outro: string; canal: Canal; contato: string; fotoPessoa: string | null;
  aceite: boolean; aceiteFoto: boolean;
};

function Cadastro() {
  const sessao = useSessaoLideranca();
  const router = useRouter();
  const q = useSearchParams();
  const setor = sessao?.setor ?? null;
  const casas = useColecao('casas', setor), pessoas = useColecao('pessoas', setor);
  const vazio = (): Form => ({ casa: q.get('casa') || NOVA, end: '', ref: '', setor: setor || SETORES[0].id, zona: ZONAS[0].id, fotoCasa: null, nome: '', cpf: '', semdoc: false, necs: [], outro: '', canal: 'visita', contato: '', fotoPessoa: null, aceite: false, aceiteFoto: false });
  const [f, setF] = useState<Form>(vazio);
  const [passo, setPasso] = useState<'form' | 'relato' | 'ok'>('form');
  const [relato, setRelato] = useState('');
  const [org, setOrg] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [descartado, setDescartado] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [salvo, setSalvo] = useState<{ nome: string; casaId: string; casaNome: string } | null>(null);
  const muda = (d: Partial<Form>) => setF((x) => ({ ...x, ...d }));

  // Veio de um pedido de morador: copia a mensagem para a IA organizar e preenche o que já se sabe.
  useEffect(() => {
    const id = q.get('pedido');
    if (!id) return;
    return repo().assinarDoc('pedidos', id, (p) => {
      if (!p) return;
      setPedido(p);
      const outro = p.para === 'outro';
      setRelato((outro ? `Pedido para ${p.paraNome} (${p.parentesco}). ` : '') + p.mensagem);
      muda({ nome: outro ? p.paraNome : '', cpf: outro ? '' : formataCpf(p.cpf), fotoPessoa: outro ? null : p.selfie || null,
        contato: outro ? `Familiar que pediu o cadastro (a pessoa é ${p.parentesco.toLowerCase()} de quem pediu)` : '' });
      setPasso('relato');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const casaSel = casas.find((c) => c.id === f.casa);
  const moradoresDaCasa = useMemo(() => pessoas.filter((p) => p.casaId === f.casa), [pessoas, f.casa]);

  async function organizar() {
    if (!relato.trim()) return;
    setOrg(true); setErro(null);
    try {
      const j = await ia.organizarCadastro(relato);
      const cpfLocal = relato.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/)?.[0];
      muda({ nome: j.nome || f.nome, end: j.endereco, ref: j.referencia, necs: j.necessidades, outro: j.necessidadeOutro, canal: j.canal, contato: j.contato || f.contato, cpf: cpfLocal ? formataCpf(cpfLocal) : f.cpf });
      setDescartado(j.descartado); setPasso('form');
    } catch { setErro('Não consegui organizar agora. Tente de novo ou volte e preencha os campos.'); }
    setOrg(false);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setErro(null);
    const nome = limpa(f.nome, 80), cpf = soDigitos(f.cpf), outro = f.necs.includes('outro') ? limpa(f.outro, 80) : '';
    if (!nome) return setErro('Escreva o nome.');
    if (!f.semdoc && cpf && !cpfValido(cpf)) return setErro('CPF com número errado. Confira ou deixe em branco.');
    if (f.necs.includes('outro') && !outro) return setErro('Escreva qual é a outra dificuldade.');
    if (!casaSel && !limpa(f.end, 120) && !limpa(f.ref, 120)) return setErro('Da residência nova, escreva a rua ou um ponto de referência.');
    if (!f.aceite) return setErro('Só dá para salvar se a pessoa concordar com o cadastro.');
    if (f.fotoPessoa && !f.aceiteFoto) return setErro('A foto da pessoa precisa do “sim” dela. Marque ou tire a foto.');
    const r = repo(), a = Date.now();
    try {
      let casaId = casaSel?.id, casaNomeV = casaSel ? nomeCasa(casaSel) : '';
      const base = casaSel ?? { setor: f.setor, endereco: limpa(f.end, 120), referencia: limpa(f.ref, 120), zona: f.zona, pos: posEm(f.zona) };
      if (!casaSel) {
        const nova = { setor: f.setor, apelido: '', endereco: base.endereco, referencia: base.referencia, zona: f.zona, pos: base.pos, status: 'Pendente' as const, statusEm: null, temFoto: !!f.fotoCasa, criadoEm: a };
        casaId = await r.inserir('casas', nova); casaNomeV = nomeCasa(nova);
        if (f.fotoCasa) await r.inserir('fotos', { id: `casa-${casaId}`, setor: f.setor, casa: f.fotoCasa });
      }
      const pid = await r.inserir('pessoas', {
        setor: base.setor, casaId, nome, cpf: f.semdoc ? '' : cpf, semDocumento: f.semdoc, endereco: base.endereco, referencia: base.referencia,
        necessidades: f.necs, necessidadeOutro: outro, canal: f.canal, contato: limpa(f.contato, 80), zona: base.zona, pos: base.pos,
        temFotos: { pessoa: !!f.fotoPessoa }, consentimento: { em: a, forma: 'verbal, registrado pela liderança', foto: !!f.fotoPessoa }, revisarAte: a + 182 * 864e5, criadoEm: a,
      });
      if (f.fotoPessoa) await r.inserir('fotos', { id: pid, setor: base.setor, pessoa: f.fotoPessoa });
      if (pedido) await r.atualizar('pedidos', pedido.id, { status: 'cadastrado', statusEm: Date.now(), casaNome: casaNomeV, pessoaNome: nome }).catch(() => {});
      setSalvo({ nome, casaId: casaId!, casaNome: casaNomeV }); setPedido(null); setPasso('ok'); anunciar(`${nome} foi cadastrada na residência ${casaNomeV}.`);
    } catch { setErro('Não foi possível salvar agora.'); }
  }

  if (!sessao) return <Cabecalho vista="cadastro" titulo="Cadastrar" />;
  const vul = resumoVulnerabilidade(moradoresDaCasa);

  return (
    <>
      <Cabecalho vista="cadastro" titulo="Cadastrar" voltar={passo === 'relato' ? () => setPasso('form') : '/lideranca'} />
      <main id="v-cadastro">
        {passo === 'relato' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1>Conte quem é a pessoa</h1>
            <p className="muted">Nome, documento (se tiver), endereço, dificuldades e como prefere ser avisada. A IA organiza; você confere e completa.</p>
            <BotaoDitado valor={relato} aoMudar={setRelato} />
            <label className="f" htmlFor="c-relato">Ou escreva aqui</label>
            <textarea id="c-relato" value={relato} onChange={(e) => setRelato(e.target.value)} placeholder="Ex.: Maria do Socorro, Rua da Ladeira 40, casa azul perto da mercearia. Usa andador, mora só, às vezes não entende os avisos. A filha Ana é o contato. Prefere visita." />
            <p className="small">O CPF que estiver no texto fica no aparelho: ele é retirado antes de ir para a IA.</p>
            <button type="button" className="b-blue" disabled={org} onClick={organizar}>Organizar com IA</button>
            {org && <Carregando texto="Organizando…" />}
            <Erro texto={erro} />
            <button type="button" className="b-link" onClick={() => setPasso('form')}>Voltar aos campos</button>
          </section>
        )}

        {passo === 'form' && (
          <form noValidate onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1><span className="tone">Cadastrar</span> residência e moradores</h1>
            <button type="button" className="linha card-linha" onClick={() => setPasso('relato')}><span className="ict"><Icone nome="mic" /></span><span className="lt"><b>Tem uma mensagem ou áudio?</b><span>A IA preenche os campos para você conferir</span></span><Icone nome="chev" className="chev" espessura={2.4} /></button>

            <div className="card">
              <div className="secao"><span className="ict"><Icone nome="casa" /></span><div><h2>1. Residência</h2><p className="small">Todos que moram na mesma casa ficam juntos</p></div></div>
              <div><label className="f" htmlFor="c-casa">Esta pessoa mora em</label>
                <select id="c-casa" value={f.casa} onChange={(e) => muda({ casa: e.target.value })}>
                  <option value={NOVA}>+ Nova residência (ainda não cadastrada)</option>
                  {[...casas].sort((a, b) => nomeCasa(a).localeCompare(nomeCasa(b))).map((c) => { const n = pessoas.filter((p) => p.casaId === c.id).length; return <option key={c.id} value={c.id}>{nomeCasa(c)} · {n} {n === 1 ? 'morador' : 'moradores'}</option>; })}
                </select></div>
              {casaSel ? (
                <div id="c-casa-resumo" className="small">
                  <p>{zona(casaSel.zona) ? `${zona(casaSel.zona)!.nome} · ${zona(casaSel.zona)!.nivel} ${NIVEL[zona(casaSel.zona)!.nivel].txt}. ` : ''}Já moram aqui: {moradoresDaCasa.map((p) => p.nome).join(', ') || 'ninguém cadastrado ainda'}.</p>
                  {vul.length > 0 && <p>Nesta casa há: {vul.map((v) => v.label.toLowerCase() + (v.n > 1 ? ` (${v.n})` : '')).join(', ')}.</p>}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  <div><label className="f" htmlFor="c-end">Rua e número</label><input id="c-end" maxLength={120} value={f.end} onChange={(e) => muda({ end: e.target.value })} /></div>
                  <div><label className="f" htmlFor="c-ref">Ponto de referência</label><input id="c-ref" maxLength={120} placeholder="Ex.: casa azul, ao lado da mercearia" value={f.ref} onChange={(e) => muda({ ref: e.target.value })} /></div>
                  <div><label className="f" htmlFor="c-zona">Área no mapa</label><select id="c-zona" value={f.zona} onChange={(e) => muda({ zona: e.target.value })}>{ZONAS.map((z) => <option key={z.id} value={z.id}>{z.nome} ({z.nivel} · {NIVEL[z.nivel].txt})</option>)}</select></div>
                  <CampoFoto id="c-foto-casa" rotulo="Foto da casa (fachada, opcional)" captura="environment" icone="casa" valor={f.fotoCasa} aoMudar={(v) => muda({ fotoCasa: v })} />
                </div>
              )}
            </div>

            <div className="card">
              <div className="secao"><span className="ict"><Icone nome="pessoa" /></span><div><h2>2. Morador</h2><p className="small">Cadastre uma pessoa por vez</p></div></div>
              <div><label className="f" htmlFor="c-nome">Nome completo (ou como é conhecida)</label><input id="c-nome" maxLength={80} autoComplete="off" value={f.nome} onChange={(e) => muda({ nome: e.target.value })} /></div>
              <div><label className="f" htmlFor="c-cpf">CPF (se tiver)</label><input id="c-cpf" inputMode="numeric" maxLength={14} placeholder="000.000.000-00" autoComplete="off" disabled={f.semdoc} value={f.cpf} onChange={(e) => muda({ cpf: formataCpf(e.target.value) })} />
                <p className="small">Fica protegido e aparece mascarado no painel. Não é enviado à IA.</p></div>
              <label className={`chk${f.semdoc ? ' on' : ''}`}><input type="checkbox" checked={f.semdoc} onChange={(e) => muda({ semdoc: e.target.checked, cpf: '' })} /> Não tem documento</label>
              {f.semdoc && <p className="small">Sem documento: registre a foto da casa e, se a pessoa aceitar, uma foto dela para identificação.</p>}
            </div>

            <fieldset className="card" style={{ margin: 0 }}><legend className="sr">Dificuldades</legend><h2 aria-hidden="true">Dificuldades (locomoção, comunicação, compreensão)</h2>
              <Grade nome="nec" multiplo valor={f.necs} aoMudar={(v) => muda({ necs: v })} opcoes={Object.entries(NECESSIDADES).map(([k, n]) => [k as Necessidade, n.label])} icones={Object.fromEntries(Object.keys(NECESSIDADES).map((k) => [k, k]))} />
              {f.necs.includes('outro') && <div style={{ marginTop: 10 }}><label className="f" htmlFor="c-outro">Qual outra dificuldade?</label><input id="c-outro" maxLength={80} placeholder="Ex.: depende de aparelho ligado na tomada" value={f.outro} onChange={(e) => muda({ outro: e.target.value })} /></div>}
              <p className="small">Registre o que a pessoa não consegue fazer, não a doença.</p>
            </fieldset>
            <fieldset className="card" style={{ margin: 0 }}><legend className="sr">Como avisar</legend><h2 aria-hidden="true">Como avisar</h2>
              <Grade nome="canal" multiplo={false} valor={[f.canal]} aoMudar={(v) => muda({ canal: v[0] })} opcoes={Object.entries(CANAIS) as [Canal, string][]} icones={Object.fromEntries(Object.keys(CANAIS).map((k) => [k, k]))} />
            </fieldset>
            <div className="card"><label className="f" htmlFor="c-contato">Contato de alguém próximo</label><input id="c-contato" maxLength={80} value={f.contato} onChange={(e) => muda({ contato: e.target.value })} /></div>
            <div className="card">
              <h2>Foto da pessoa (opcional)</h2>
              <CampoFoto id="c-foto-pessoa" rotulo="Foto da pessoa" captura="user" icone="pessoa" valor={f.fotoPessoa} aoMudar={(v) => muda({ fotoPessoa: v, aceiteFoto: false })} />
              <p className="small">Use a foto da pessoa só se ela não tiver documento ou pedir. Foto de rosto para identificar é dado sensível: precisa de um “sim” só para ela.</p>
            </div>
            {descartado && <p className="small">Doença ou remédio citados no relato não foram guardados: ficou só a dificuldade prática.</p>}
            <div className="warn">
              <p>Leia para a pessoa: “{TERMO}”</p>
              <button type="button" className="b-ghost" onClick={() => falar(`${TERMO} Você concorda?`)}>Ouvir este texto</button>
              <label className={`chk${f.aceite ? ' on' : ''}`}><input type="checkbox" checked={f.aceite} onChange={(e) => muda({ aceite: e.target.checked })} /> <span>A pessoa concordou com o cadastro</span></label>
              {f.fotoPessoa && <label className={`chk${f.aceiteFoto ? ' on' : ''}`}><input type="checkbox" checked={f.aceiteFoto} onChange={(e) => muda({ aceiteFoto: e.target.checked })} /> <span>A pessoa concordou com a foto dela</span></label>}
            </div>
            <Erro texto={erro} />
            <button type="submit" className="b-blue" disabled={!f.aceite || (!!f.fotoPessoa && !f.aceiteFoto)}>Salvar morador</button>
          </form>
        )}

        {passo === 'ok' && salvo && (
          <section className="ok">
            <h1>{salvo.nome} foi cadastrada</h1>
            <p className="small">Residência: {salvo.casaNome}. Revisar o cadastro em 6 meses.</p>
            <Link className="btn b-dark" href="/lideranca">Ver no painel</Link>
            <button type="button" className="b-green" onClick={() => { setF({ ...vazio(), casa: salvo.casaId }); setRelato(''); setPasso('form'); }}>+ Adicionar outro morador nesta casa</button>
            <button type="button" className="b-link" onClick={() => { setF({ ...vazio(), casa: NOVA }); setRelato(''); router.replace('/lideranca/cadastro'); setPasso('form'); }}>Cadastrar outra residência</button>
          </section>
        )}
      </main>
    </>
  );
}

export default function PaginaCadastro() {
  return <Suspense fallback={null}><Cadastro /></Suspense>;
}
