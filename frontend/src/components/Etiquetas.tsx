import { NIVEL, STATUS_VISITA, type Nivel, type StatusVisita } from '@/domain/catalogo';
import { Icone } from './Icone';

export function EtiquetaRisco({ nivel, comNome = false }: { nivel: Nivel; comNome?: boolean }) {
  return <span className={`pill rk rk-${nivel.slice(1)}`}><i aria-hidden="true" /><b>{nivel}</b>{comNome ? ` ${NIVEL[nivel].txt}` : ''}</span>;
}

export function EtiquetaStatus({ status }: { status: StatusVisita }) {
  const s = STATUS_VISITA[status] ?? STATUS_VISITA.Pendente;
  return <span className={`pill ${s.cls}`}><Icone nome={s.icone} espessura={2.2} /><span>{status}</span></span>;
}

export function Nota({ children }: { children: React.ReactNode }) {
  return <p className="nota"><Icone nome="info" style={{ width: 16, height: 16, flex: 'none', marginTop: 2 }} /><span>{children}</span></p>;
}

export function Erro({ texto }: { texto: string | null }) {
  return texto ? <div className="err" role="alert">{texto}</div> : null;
}

export function Carregando({ texto }: { texto: string }) {
  return <div className="row"><div className="spinner" aria-hidden="true" /><b>{texto}</b></div>;
}
