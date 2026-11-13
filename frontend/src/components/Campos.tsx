'use client';
import { useEffect, useRef, useState } from 'react';
import { cpfValido, formataCpf, soDigitos } from '@/domain/texto';
import { criarDitado } from '@/lib/fala';
import { fotoParaGuardar } from '@/lib/imagem';
import { Icone } from './Icone';

/** Grade de caixas de marcar (dificuldades, canais, tipo de aviso). */
export function Grade<T extends string>({ opcoes, valor, multiplo, nome, aoMudar, icones }: {
  opcoes: [T, string][]; valor: T[]; multiplo: boolean; nome: string; aoMudar: (v: T[]) => void; icones?: Partial<Record<T, string>>;
}) {
  return (
    <div className="needs-grid">
      {opcoes.map(([k, label]) => {
        const on = valor.includes(k);
        return (
          <label key={k} className={`chk${on ? ' on' : ''}`}>
            <input type={multiplo ? 'checkbox' : 'radio'} name={nome} value={k} checked={on}
              onChange={() => aoMudar(multiplo ? (on ? valor.filter((x) => x !== k) : [...valor, k]) : [k])} />
            {icones?.[k] && <Icone nome={icones[k]!} />}
            <span>{label}</span>
          </label>
        );
      })}
    </div>
  );
}

/** Botão "Apertar e falar" que escreve o que a pessoa diz no campo. Some quando o navegador não tem ditado. */
export function BotaoDitado({ valor, aoMudar }: { valor: string; aoMudar: (t: string) => void }) {
  const [ouvindo, setOuvindo] = useState(false);
  const [suporte, setSuporte] = useState(false);
  const rec = useRef<ReturnType<typeof criarDitado>>(null);
  const base = useRef('');
  useEffect(() => { setSuporte(!!criarDitado(() => {}, () => {})); }, []);
  if (!suporte) return null;
  const alternar = () => {
    if (ouvindo) { rec.current?.stop(); return; }
    base.current = valor;
    rec.current = criarDitado((t) => aoMudar((base.current ? `${base.current} ` : '') + t), () => setOuvindo(false));
    try { rec.current?.start(); setOuvindo(true); } catch { setOuvindo(false); }
  };
  return (
    <button type="button" className="b-dark" onClick={alternar}><Icone nome="mic" /><span>{ouvindo ? 'Ouvindo… toque para parar' : 'Apertar e falar'}</span></button>
  );
}

/** Seletor de foto (câmera do celular) com prévia e opção de remover. */
export function CampoFoto({ id, rotulo, captura, valor, aoMudar, icone = 'camera' }: {
  id: string; rotulo: string; captura: 'user' | 'environment'; valor: string | null; aoMudar: (v: string | null) => void; icone?: string;
}) {
  return (
    <>
      <label className="btn b-ghost" htmlFor={id}><Icone nome={icone} />{rotulo}</label>
      <input type="file" id={id} accept="image/*" capture={captura} className="sr" tabIndex={-1}
        onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { aoMudar(await fotoParaGuardar(f)); } catch { aoMudar(null); } }} />
      {valor && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="preview" src={valor} alt={`Prévia: ${rotulo}`} />
          <button type="button" className="b-link" onClick={() => aoMudar(null)}>Tirar foto</button>
        </div>
      )}
    </>
  );
}

export interface Identificacao { cpf: string; selfie: string }
export function validarIdentificacao(i: Identificacao) {
  const c = soDigitos(i.cpf);
  if (!i.selfie && !c) return 'Tire uma selfie ou digite seu CPF.';
  if (c && !cpfValido(c)) return 'CPF com número errado. Confira.';
  return '';
}

/** "Quem está avisando?": selfie OU CPF. Só a liderança vê. */
export function BlocoIdentificacao({ prefixo, valor, aoMudar }: { prefixo: string; valor: Identificacao; aoMudar: (v: Identificacao) => void }) {
  return (
    <div className="card">
      <div><h2>Quem está avisando?</h2><p className="small">Para a liderança saber quem mandou. Escolha um: selfie ou CPF.</p></div>
      {valor.selfie ? (
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="avatar" src={valor.selfie} alt="Sua selfie" />
          <span className="small" style={{ flex: 1 }}>Selfie pronta</span>
          <button type="button" className="b-link" onClick={() => aoMudar({ ...valor, selfie: '' })}>Tirar outra / remover</button>
        </div>
      ) : (
        <>
          <label className="btn b-out" htmlFor={`${prefixo}-selfie`}><Icone nome="camera" /><span>Tirar selfie</span></label>
          <input type="file" id={`${prefixo}-selfie`} accept="image/*" capture="user" className="sr" tabIndex={-1}
            onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) aoMudar({ ...valor, selfie: await fotoParaGuardar(f) }); }} />
        </>
      )}
      <div>
        <label className="f" htmlFor={`${prefixo}-cpf`}>Ou digite seu CPF</label>
        <input type="text" id={`${prefixo}-cpf`} inputMode="numeric" maxLength={14} placeholder="000.000.000-00" autoComplete="off"
          value={valor.cpf} onChange={(e) => aoMudar({ ...valor, cpf: formataCpf(e.target.value) })} />
      </div>
    </div>
  );
}
