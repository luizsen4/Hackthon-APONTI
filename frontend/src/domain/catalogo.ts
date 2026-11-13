// Listas fechadas do produto. A orientação ao morador é sempre um destes textos fixos:
// a IA só escolhe a chave do sinal, nunca escreve a orientação.

export const SETORES = [
  { id: 'alto-do-maracana', nome: 'Alto do Maracanã (Dois Unidos)' },
  { id: 'alto-do-rosario', nome: 'Sítio/Alto do Rosário (Dois Unidos)' },
  { id: 'cavalcanti-petribu', nome: 'Rua Cavalcanti Petribú (Dois Unidos)' },
  { id: 'corrego-do-deodato', nome: 'Córrego do Deodato (Água Fria)' },
  { id: 'corrego-do-caru', nome: 'Córrego do Caruá (Vasco da Gama)' },
  { id: 'corrego-do-beiju', nome: 'Córrego do Beijú (Nova Descoberta)' },
  { id: 'alto-do-cruzeiro', nome: 'Alto do Cruzeiro (Nova Descoberta)' },
  { id: 'alto-do-brasil', nome: 'Alto do Brasil (Alto José Bonifácio)' },
] as const;
export const setorNome = (id: string | null | undefined) => SETORES.find((s) => s.id === id)?.nome ?? id ?? '';

export type SinalChave =
  | 'lona_rasgada' | 'rachadura' | 'agua_barrenta' | 'muro_poste_inclinado'
  | 'agua_subindo' | 'lixo_canal' | 'lixo_queima_encosta';

export const SINAIS: Record<SinalChave, { label: string; risco: boolean; orient: string }> = {
  lona_rasgada: { label: 'Lona rasgada', risco: true, orient: 'Não tire nem mexa na lona da barreira. Avise a Defesa Civil para olhar o local.' },
  rachadura: { label: 'Rachadura', risco: true, orient: 'Avise a Defesa Civil para vistoriar. Se a rachadura crescer, saia de perto e ligue 199.' },
  agua_barrenta: { label: 'Água de barro descendo', risco: true, orient: 'Água de barro descendo da barreira pode ser a terra se mexendo. Ligue para a Defesa Civil.' },
  muro_poste_inclinado: { label: 'Muro ou poste torto', risco: true, orient: 'Não fique perto do muro ou do poste. Ligue para a Defesa Civil.' },
  agua_subindo: { label: 'Água subindo', risco: true, orient: 'Não atravesse água de alagamento. Se a água entrar em casa, ligue 199.' },
  lixo_canal: { label: 'Lixo no canal', risco: false, orient: 'Lixo no canal faz a água subir mais rápido. Não jogue lixo ali. Avise a liderança para o mutirão.' },
  lixo_queima_encosta: { label: 'Lixo ou fogo na barreira', risco: false, orient: 'Queimar lixo faz mal para respirar. Lixo na barreira deixa ela mais pesada. Avise a liderança e use a coleta.' },
};
export const SINAL_CHAVES = Object.keys(SINAIS) as SinalChave[];
export const ehSinal = (k: unknown): k is SinalChave => typeof k === 'string' && k in SINAIS;

export type Necessidade =
  | 'idoso' | 'crianca' | 'acamada' | 'cadeira_rodas' | 'nao_anda_sozinha' | 'dificuldade_entender'
  | 'gestante' | 'bebe_em_casa' | 'nao_enxerga' | 'nao_ouve' | 'nao_le' | 'sem_celular' | 'mora_so' | 'outro';

/** Dificuldade prática (não doença) e peso na ordem de visita. */
export const NECESSIDADES: Record<Necessidade, { label: string; peso: number }> = {
  idoso: { label: 'Pessoa idosa', peso: 3 },
  crianca: { label: 'Criança', peso: 2 },
  acamada: { label: 'Fica na cama', peso: 5 },
  cadeira_rodas: { label: 'Cadeira de rodas', peso: 4 },
  nao_anda_sozinha: { label: 'Anda com dificuldade', peso: 4 },
  dificuldade_entender: { label: 'Dificuldade para entender', peso: 3 },
  gestante: { label: 'Gestante', peso: 3 },
  bebe_em_casa: { label: 'Bebê em casa', peso: 3 },
  nao_enxerga: { label: 'Enxerga pouco', peso: 3 },
  nao_ouve: { label: 'Não escuta', peso: 2 },
  nao_le: { label: 'Não lê', peso: 2 },
  sem_celular: { label: 'Sem celular', peso: 2 },
  mora_so: { label: 'Mora só', peso: 2 },
  outro: { label: 'Outro', peso: 1 },
};
export const ehNecessidade = (k: unknown): k is Necessidade => typeof k === 'string' && k in NECESSIDADES;

export type Canal = 'visita' | 'audio' | 'texto_facil' | 'libras' | 'ligacao';
export const CANAIS: Record<Canal, string> = {
  visita: 'Visita em casa', audio: 'Áudio no WhatsApp', texto_facil: 'Texto fácil', libras: 'Vídeo em Libras', ligacao: 'Ligação',
};

export type Nivel = 'R4' | 'R3' | 'R2' | 'R1';
export const NIVEL: Record<Nivel, { cor: string; txt: string; peso: number; pat: string }> = {
  R4: { cor: '#A50F15', txt: 'Muito alto', peso: 6, pat: 'hx' },
  R3: { cor: '#D55E00', txt: 'Alto', peso: 4, pat: 'hd' },
  R2: { cor: '#F0E442', txt: 'Médio', peso: 2, pat: 'pt' },
  R1: { cor: '#009E73', txt: 'Nível 1', peso: 0, pat: '' },
};

export interface Zona { id: string; nome: string; nivel: Nivel; poly: [number, number][]; desc: string }
/** Mapa ILUSTRATIVO. No produto, as áreas vêm do mapeamento oficial da Defesa Civil (dados abertos do Recife). */
export const ZONAS: Zona[] = [
  { id: 'z1', nome: 'Encosta da Ladeira', nivel: 'R4', poly: [[18, 18], [172, 18], [162, 112], [28, 122]], desc: 'Barreira alta com lona. Histórico de deslizamento.' },
  { id: 'z2', nome: 'Beco do Cruzeiro', nivel: 'R3', poly: [[172, 18], [342, 18], [332, 104], [162, 112]], desc: 'Escadaria estreita; carro e ambulância não entram.' },
  { id: 'z4', nome: 'Meio da Ladeira', nivel: 'R2', poly: [[28, 122], [162, 112], [166, 182], [24, 188]], desc: 'Casas em degraus, algumas com rachaduras antigas.' },
  { id: 'z5', nome: 'Rua Nova e Travessa Alta', nivel: 'R2', poly: [[162, 112], [332, 104], [338, 176], [166, 182]], desc: 'Ruas calçadas, escoamento ruim na chuva.' },
  { id: 'z6', nome: 'Parte baixa', nivel: 'R1', poly: [[24, 188], [338, 176], [342, 226], [18, 230]], desc: 'Terreno plano perto da avenida.' },
  { id: 'z3', nome: 'Margem do canal', nivel: 'R3', poly: [[18, 230], [342, 226], [342, 292], [18, 292]], desc: 'Alaga quando o canal enche de lixo.' },
];
export const zona = (id: string | null | undefined) => ZONAS.find((z) => z.id === id);
export function centro(z: Zona): [number, number] {
  const n = z.poly.length;
  return [z.poly.reduce((a, p) => a + p[0], 0) / n, z.poly.reduce((a, p) => a + p[1], 0) / n];
}
export function posEm(zid: string, aleatorio: () => number = Math.random) {
  const [cx, cy] = centro(zona(zid) ?? ZONAS[4]);
  return { x: Math.round(cx + (aleatorio() * 60 - 30)), y: Math.round(cy + (aleatorio() * 30 - 15)) };
}

export const CASA_TXT: Record<Nivel, string> = {
  R4: 'Sua casa fica em área de risco muito alto. Em chuva forte, observe rachaduras, água de barro e estalos. Se a Defesa Civil pedir para sair, saia.',
  R3: 'Sua casa fica em área de risco alto. Quando chover, observe a barreira e o canal. Avise qualquer sinal.',
  R2: 'Sua casa fica em área de risco médio. Em dias de chuva, fique atento e avise sinais.',
  R1: 'Sua casa fica no Nível 1. Também pede atenção: avise sinais e ajude os vizinhos.',
};

export const ALERTA_GERAL =
  'Tem risco na sua comunidade. Fique atento a rachadura, lona rasgada ou água de barro. Se a Defesa Civil pedir para sair, siga a orientação. Telefones: 199 ou 0800 081 3400.';

export type TipoAviso = 'urgente' | 'abrigo' | 'aviso' | 'campanha';
export const AVISO_TIPOS: Record<TipoAviso, { label: string; cls: string; icone: string }> = {
  urgente: { label: 'Urgente', cls: 'av-urg', icone: 'alerta' },
  abrigo: { label: 'Abrigo aberto', cls: 'av-abr', icone: 'casa' },
  aviso: { label: 'Aviso', cls: 'av-avi', icone: 'megafone' },
  campanha: { label: 'Campanha', cls: 'av-cam', icone: 'folha' },
};

export type StatusVisita = 'Pendente' | 'Visitado' | 'Precisa Defesa Civil' | 'Não encontrado';
export const STATUS_VISITA: Record<StatusVisita, { cls: string; icone: string }> = {
  Pendente: { cls: 'st-pendente', icone: 'relogio' },
  Visitado: { cls: 'st-visitado', icone: 'ok' },
  'Precisa Defesa Civil': { cls: 'st-civil', icone: 'alerta' },
  'Não encontrado': { cls: 'st-nao', icone: 'duvida' },
};

export const TELEFONE_DEFESA_CIVIL = '0800 081 3400';
