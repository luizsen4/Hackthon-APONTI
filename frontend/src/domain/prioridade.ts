import type { Casa, Pessoa, Relato } from '@/data/tipos';
import { NECESSIDADES, NIVEL, SINAIS, zona, type Necessidade, type StatusVisita } from './catalogo';

/** Casa montada para o painel: a residência com seus moradores. */
export interface CasaPainel {
  id: string; real: boolean; pessoaId?: string; nome: string;
  endereco?: string; referencia?: string; zona: string; pos?: { x: number; y: number };
  status: StatusVisita; statusEm?: number | null; residentes: Pessoa[]; ficticio?: boolean;
}

export const pesoPessoa = (p: Pessoa) => (p.necessidades || []).reduce((a, k) => a + (NECESSIDADES[k]?.peso ?? 0), 0);
export const pesoCasa = (c: CasaPainel) => c.residentes.reduce((a, p) => a + pesoPessoa(p), 0);
export const nomeCasa = (c: Pick<Casa, 'apelido' | 'endereco' | 'referencia'>) =>
  c.apelido || [c.endereco, c.referencia].filter(Boolean).join(' · ') || 'Residência sem endereço';

/** Agrupa moradores nas residências. Pessoa sem residência (cadastro antigo) vira uma casa de uma pessoa. */
export function montaCasas(casas: Casa[], pessoas: Pessoa[]): CasaPainel[] {
  const porId = new Map<string, CasaPainel>();
  const lista: CasaPainel[] = [];
  for (const c of casas) {
    const o: CasaPainel = { id: c.id, real: true, nome: nomeCasa(c), endereco: c.endereco, referencia: c.referencia, zona: c.zona, pos: c.pos, status: c.status || 'Pendente', statusEm: c.statusEm, residentes: [], ficticio: c.ficticio };
    porId.set(c.id, o); lista.push(o);
  }
  for (const p of pessoas) {
    const casa = p.casaId ? porId.get(p.casaId) : undefined;
    if (casa) { casa.residentes.push(p); continue; }
    lista.push({
      id: `v-${p.id}`, real: false, pessoaId: p.id,
      nome: [p.endereco, p.referencia].filter(Boolean).join(' · ') || `Casa de ${String(p.nome || '').split(' ')[0]}`,
      endereco: p.endereco, referencia: p.referencia, zona: p.zona, pos: p.pos,
      status: p.status || 'Pendente', statusEm: p.statusEm, residentes: [p], ficticio: p.ficticio,
    });
  }
  return lista;
}

export interface EstadoPainel {
  recentes: Relato[]; risco?: Relato; riscoPorZona: Record<string, boolean>;
  alerta: boolean; ativo: boolean; ordem: CasaPainel[]; posicao: Record<string, number>;
}

const JANELA = 48 * 3600e3;

/** Ordem de visita: casas pendentes primeiro; depois quem mora (peso), risco da área e sinal recente na área. */
export function estadoPainel(casas: Casa[], pessoas: Pessoa[], relatos: Relato[], alerta: boolean, agora = Date.now()): EstadoPainel {
  const recentes = relatos.filter((r) => agora - (r.criadoEm || 0) < JANELA && SINAIS[r.sinal]).sort((a, b) => b.criadoEm - a.criadoEm);
  const riscoPorZona: Record<string, boolean> = {};
  recentes.forEach((r) => { if (SINAIS[r.sinal].risco && r.zona) riscoPorZona[r.zona] = true; });
  const risco = recentes.find((r) => SINAIS[r.sinal].risco);
  const pontos = (c: CasaPainel) => { const z = zona(c.zona); return pesoCasa(c) + (z ? NIVEL[z.nivel].peso : 0) + (riscoPorZona[c.zona] ? 5 : 0); };
  const ordem = montaCasas(casas, pessoas).sort((a, b) => {
    const pa = a.status === 'Pendente' ? 0 : 1, pb = b.status === 'Pendente' ? 0 : 1;
    return pa - pb || pontos(b) - pontos(a);
  });
  const posicao: Record<string, number> = {};
  ordem.forEach((c, i) => { posicao[c.id] = i + 1; });
  return { recentes, risco, riscoPorZona, alerta, ativo: alerta || !!risco, ordem, posicao };
}

const GRUPOS: [Necessidade, string][] = [
  ['idoso', 'Pessoa idosa'], ['gestante', 'Gestante'], ['crianca', 'Criança'], ['bebe_em_casa', 'Bebê'],
  ['dificuldade_entender', 'Dificuldade para entender'], ['acamada', 'Fica na cama'], ['cadeira_rodas', 'Cadeira de rodas'],
  ['nao_anda_sozinha', 'Anda com dificuldade'], ['nao_ouve', 'Não escuta'], ['nao_enxerga', 'Enxerga pouco'],
  ['nao_le', 'Não lê'], ['sem_celular', 'Sem celular'], ['mora_so', 'Mora só'], ['outro', 'Outro'],
];
/** "Nesta casa há": cada dificuldade com quantas pessoas a têm. */
export function resumoVulnerabilidade(residentes: Pessoa[]) {
  const n: Partial<Record<Necessidade, number>> = {};
  residentes.forEach((p) => (p.necessidades || []).forEach((k) => { n[k] = (n[k] || 0) + 1; }));
  return GRUPOS.filter(([k]) => n[k]).map(([k, label]) => ({ k, label, n: n[k]! }));
}

export type FiltroCasas = 'todas' | StatusVisita | 'semdoc' | `zona:${string}`;
export function passaFiltro(c: CasaPainel, f: FiltroCasas, busca: string) {
  if (f === 'semdoc' && !c.residentes.some((p) => p.semDocumento || !p.cpf)) return false;
  if (f.startsWith('zona:') && c.zona !== f.slice(5)) return false;
  if (['Pendente', 'Visitado', 'Precisa Defesa Civil', 'Não encontrado'].includes(f) && c.status !== f) return false;
  const q = busca.trim().toLowerCase();
  if (q) {
    const t = `${c.nome} ${c.endereco ?? ''} ${c.referencia ?? ''} ${c.residentes.map((p) => p.nome).join(' ')}`.toLowerCase();
    if (!t.includes(q)) return false;
  }
  return true;
}
