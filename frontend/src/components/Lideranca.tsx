'use client';
import Link from 'next/link';
import { useState } from 'react';
import { repo, type Foto, type Ident, type Pedido, type Pessoa, type Relato } from '@/data';
import { ALERTA_GERAL, CANAIS, NECESSIDADES, NIVEL, SINAIS, zona, type StatusVisita } from '@/domain/catalogo';
import { resumoVulnerabilidade, type CasaPainel, type EstadoPainel } from '@/domain/prioridade';
import { atras, iniciais, mascaraCpf } from '@/domain/texto';
import { ia } from '@/lib/api';
import { falar } from '@/lib/fala';
import { anunciar } from './Cabecalho';
import { EtiquetaRisco, EtiquetaStatus } from './Etiquetas';
import { Icone } from './Icone';

const fotoDe = (fotos: Record<string, Foto>, id: string) => fotos[id];
const rotuloNecessidade = (p: Pessoa, k: string) => (k === 'outro' ? `Outro: ${p.necessidadeOutro || 'não informado'}` : NECESSIDADES[k as keyof typeof NECESSIDADES]?.label ?? k);

function Morador({ p, fotos }: { p: Pessoa; fotos: Record<string, Foto> }) {
  const [confirmar, setConfirmar] = useState(false);
  const f = fotoDe(fotos, p.id);
  return (
    <div className="residente">
      <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {f?.pessoa ? <img className="avatar" src={f.pessoa} alt={`Foto de ${p.nome}`} /> : <span className="avatar ini" aria-hidden="true">{iniciais(p.nome)}</span>}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <b>{p.nome}</b>
          <div className="row" style={{ gap: 4 }}>
            {(p.necessidades || []).map((k) => <span key={k} className="need"><Icone nome={k} />{rotuloNecessidade(p, k)}</span>)}
            {!(p.necessidades || []).length && <span className="small">Sem dificuldades informadas</span>}
          </div>
          <span className="small">{p.semDocumento ? 'Sem documento' : p.cpf ? `CPF ${mascaraCpf(p.cpf)}` : 'CPF não informado'} · avisar por {(CANAIS[p.canal] || 'visita').toLowerCase()}{p.contato ? ` · contato: ${p.contato}` : ''}</span>
        </div>
      </div>
      {!confirmar ? <button type="button" className="b-link" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirmar(true)}>Apagar este morador</button> : (
        <div className="row"><span className="small">Apagar de vez, com a foto?</span>
          <button type="button" className="b-red" style={{ width: 'auto' }} onClick={async () => { await repo().apagar('fotos', p.id).catch(() => {}); await repo().apagar('pessoas', p.id); }}>Sim, apagar</button>
          <button type="button" className="b-ghost" style={{ width: 'auto' }} onClick={() => setConfirmar(false)}>Cancelar</button></div>
      )}
    </div>
  );
}

function definirStatus(c: CasaPainel, st: StatusVisita) {
  const patch = { status: st, statusEm: Date.now() };
  return c.real ? repo().atualizar('casas', c.id, patch) : repo().atualizar('pessoas', c.pessoaId!, patch);
}

/** Cartão da residência: quem mora, do que precisam, mensagem no canal certo e status da visita. */
export function CartaoCasa({ c, E, fotos, aberto, destaque, aoAlternar }: { c: CasaPainel; E: EstadoPainel; fotos: Record<string, Foto>; aberto: boolean; destaque: boolean; aoAlternar: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const z = zona(c.zona);
  const vul = resumoVulnerabilidade(c.residentes);
  const fotoCasa = c.real ? fotos[`casa-${c.id}`]?.casa : fotos[c.pessoaId!]?.casa;
  const base = E.alerta || !E.risco ? ALERTA_GERAL : `${SINAIS[E.risco.sinal].label}. ${SINAIS[E.risco.sinal].orient}`;

  async function gerar() {
    setGerando(true);
    const alvo = { nome: c.residentes.map((p) => p.nome.split(' ')[0]).join(' e '), necessidades: c.residentes.flatMap((p) => p.necessidades || []), canal: c.residentes[0]?.canal ?? 'visita' };
    try { setMsg((await ia.adaptarMensagem(base, alvo)).mensagem); } catch { setMsg(base); }
    setGerando(false);
  }

  return (
    <article className={`card pessoa${aberto ? ' aberto' : ''}${destaque ? ' hl' : ''}`} id={`p-${c.id}`} tabIndex={-1}>
      <button type="button" className="cab" aria-expanded={aberto} onClick={aoAlternar}>
        <span className="ordem">{E.posicao[c.id]}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {fotoCasa ? <img className="avatar" src={fotoCasa} alt="" /> : <span className="avatar ini" aria-hidden="true"><Icone nome="casa" /></span>}
        <span className="nm"><b>{c.nome}</b>
          <span className="small">{c.residentes.length} {c.residentes.length === 1 ? 'morador' : 'moradores'}{vul.length ? ` · ${vul.slice(0, 3).map((v) => v.label.toLowerCase()).join(', ')}` : ''}</span>
          <span className="mini"><EtiquetaStatus status={c.status} />{z && <EtiquetaRisco nivel={z.nivel} />}</span></span>
        <Icone nome="chev" className="chev" espessura={2.4} />
      </button>
      {aberto && (
        <div className="corpo">
          {vul.length > 0 && <><p className="eyebrow">Nesta casa há</p><div className="vuln">{vul.map((v) => <span key={v.k} className="need"><Icone nome={v.k} />{v.label}{v.n > 1 ? ` ×${v.n}` : ''}</span>)}</div></>}
          <div className="meta">
            <div><span><Icone nome="pin" /></span><span>{[c.endereco, c.referencia].filter(Boolean).join(' · ') || 'Endereço não informado'}</span></div>
            {z && <div><span><Icone nome="casa" /></span><span>{z.nome} · {z.nivel} {NIVEL[z.nivel].txt}{E.riscoPorZona[z.id] ? ' · sinal recente nesta área' : ''}</span></div>}
            {c.statusEm && <div><span><Icone nome="relogio" /></span><span>Atualizado {atras(c.statusEm)}</span></div>}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {fotoCasa && <details><summary>Ver foto da casa</summary><img className="preview" src={fotoCasa} alt="Fachada da casa" /></details>}
          <p className="eyebrow">Moradores ({c.residentes.length})</p>
          <div className="residentes">{c.residentes.map((p) => <Morador key={p.id} p={p} fotos={fotos} />)}</div>
          {c.real && <Link className="btn b-out" href={`/lideranca/cadastro?casa=${encodeURIComponent(c.id)}`}>+ Adicionar morador nesta casa</Link>}
          {c.ficticio && <p className="small">Dado fictício · imagens ilustrativas</p>}
          {E.ativo && (
            <>
              <button type="button" className="b-out" disabled={gerando} onClick={gerar}><Icone nome={c.residentes[0]?.canal ?? 'visita'} /><span>{gerando ? 'Preparando…' : msg ? 'Fazer outra mensagem' : 'Preparar mensagem para esta casa (IA)'}</span></button>
              {msg && (
                <div className="info">
                  <p className="small" style={{ fontWeight: 800 }}>Mensagem pronta · feita a partir do aviso oficial · confira antes de usar</p>
                  <p style={{ fontSize: '1.05rem' }}>{msg}</p>
                  <button type="button" className="b-dark" onClick={() => falar(msg)}>Ouvir mensagem</button>
                  <button type="button" className="b-ghost" onClick={() => navigator.clipboard?.writeText(msg)}>Copiar para o WhatsApp</button>
                </div>
              )}
            </>
          )}
          <p className="eyebrow">Depois da visita à casa</p>
          <div className="acoes">
            {([['Visitado', 'b-green'], ['Precisa Defesa Civil', 'b-red'], ['Não encontrado', 'b-ghost']] as const).map(([st, cls]) => (
              <button key={st} type="button" className={cls} disabled={c.status === st} onClick={async () => { await definirStatus(c, st); anunciar(`${c.nome}: ${st}`); }}>{st}</button>
            ))}
          </div>
          {c.status !== 'Pendente' && <button type="button" className="b-link" style={{ alignSelf: 'flex-start' }} onClick={() => definirStatus(c, 'Pendente')}>Voltar para “a visitar”</button>}
          {c.real && c.residentes.length === 0 && <button type="button" className="b-link" style={{ alignSelf: 'flex-start' }} onClick={async () => { await repo().apagar('fotos', `casa-${c.id}`).catch(() => {}); await repo().apagar('casas', c.id); }}>Apagar residência</button>}
        </div>
      )}
    </article>
  );
}

const ST_PEDIDO = { pendente: ['Aguardando você', 'st-pendente'], cadastrado: ['Cadastrado', 'st-visitado'], recusado: ['Recusado', 'st-nao'] } as const;

export function CartaoPedido({ q, pessoas, aoCadastrar }: { q: Pedido; pessoas: Pessoa[]; aoCadastrar: (q: Pedido) => void }) {
  const st = ST_PEDIDO[q.status] ?? ST_PEDIDO.pendente;
  const outro = q.para === 'outro';
  const conhecido = q.cpf ? pessoas.find((p) => p.cpf === q.cpf) : undefined;
  return (
    <article className={`msg msg--ped${q.status === 'pendente' ? ' novo' : ''}`}>
      <div className="msg-top"><span className="msg-tipo"><Icone nome="pessoaMais" />Pedido de cadastro</span><span className="small">{atras(q.criadoEm)}</span><span className={`pill ${st[1]}`}>{st[0]}</span></div>
      <p className="msg-para">{outro ? <>Para <b>{q.paraNome || 'outra pessoa'}</b> · {(q.parentesco || 'familiar').toLowerCase()} de quem enviou</> : <>Para <b>a própria pessoa</b> que enviou</>}</p>
      <div className="row" style={{ flexWrap: 'nowrap', gap: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {q.selfie ? <img className="avatar" src={q.selfie} alt="Selfie de quem enviou" /> : <span className="avatar ini" aria-hidden="true">?</span>}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <b>{conhecido ? conhecido.nome : q.cpf ? `Morador · CPF ${mascaraCpf(q.cpf)}` : 'Morador identificado por selfie'}</b>
          <span className="small">{conhecido ? 'Já cadastrado · ' : ''}{q.cpf && q.selfie ? 'enviou selfie e CPF' : q.cpf ? 'identificado pelo CPF' : 'identificado pela selfie'}</span>
        </div>
      </div>
      {q.mensagem && <blockquote className="msg-txt">“{q.mensagem}”</blockquote>}
      {q.status === 'cadastrado' && <p className="small">Cadastrado{q.casaNome ? ` na residência: ${q.casaNome}` : ''}{q.statusEm ? ` · ${atras(q.statusEm)}` : ''}</p>}
      {q.status === 'pendente' && (
        <div className="acoes" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
          <button type="button" className="b-green" onClick={() => aoCadastrar(q)}>{outro ? `Cadastrar ${(q.paraNome || 'a pessoa').split(' ')[0]}` : 'Cadastrar esta pessoa'}</button>
          <button type="button" className="b-ghost" onClick={() => repo().atualizar('pedidos', q.id, { status: 'recusado', statusEm: Date.now() })}>Recusar</button>
        </div>
      )}
    </article>
  );
}

export function CartaoRelato({ r, pessoas, idents, aoMapa }: { r: Relato; pessoas: Pessoa[]; idents: Record<string, Ident>; aoMapa: () => void }) {
  const s = SINAIS[r.sinal], z = zona(r.zona), velho = Date.now() - r.criadoEm > 48 * 3600e3;
  const id = r.autor ? idents[r.autor] : undefined;
  const p = id?.cpf ? pessoas.find((x) => x.cpf === id.cpf) : undefined;
  return (
    <article className={`msg msg--sinal${s.risco && !velho ? ' risco' : ''}${velho ? ' velho' : ''}`}>
      <div className="msg-top"><span className="msg-tipo"><Icone nome="alerta" />{r.origem === 'liderança' ? 'Sinal registrado por você' : 'Sinal de risco'}</span><span className="small">{atras(r.criadoEm)}</span><span className={`pill${velho ? '' : ' st-civil'}`}>{velho ? 'Mais de 48 h' : 'Recente'}</span></div>
      <div className="row" style={{ flexWrap: 'nowrap', gap: 10 }}>
        <Icone nome={r.sinal} cor="#B3400B" className="sig" style={{ width: 40, height: 40, flex: 'none' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><b>{s.label}</b><span className="small">{z ? `${z.nome} · ${z.nivel} ${NIVEL[z.nivel].txt}` : 'Local não informado'}</span></div>
      </div>
      {r.origem === 'liderança' ? <span className="small">Registrado pela liderança</span> : id ? (
        <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {id.selfie && <img className="avatar" src={id.selfie} alt="Selfie de quem avisou" style={{ width: 32, height: 32, borderRadius: 10 }} />}
          <span className="small">Enviado por {p ? p.nome : 'morador'}{id.cpf ? ` · CPF ${mascaraCpf(id.cpf)}` : ' · identificado por selfie'}</span>
        </span>
      ) : <span className="small">Morador ({r.origem})</span>}
      {r.zona && <button type="button" className="b-link" style={{ alignSelf: 'flex-start' }} onClick={aoMapa}>Ver no mapa</button>}
    </article>
  );
}
