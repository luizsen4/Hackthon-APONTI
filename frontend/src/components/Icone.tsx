import { IC, UI } from '@/domain/icones';

/** Ícone de traço 24x24. Os desenhos são constantes do código (domain/icones), nunca texto do usuário. */
export function Icone({ nome, cor, className, style, espessura = 2 }: { nome: string; cor?: string; className?: string; style?: React.CSSProperties; espessura?: number }) {
  const d = UI[nome] ?? IC[nome] ?? '';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={cor ?? 'currentColor'} strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style} dangerouslySetInnerHTML={{ __html: d }} />
  );
}
