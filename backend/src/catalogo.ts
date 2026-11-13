// Listas fechadas. A IA só pode devolver chaves daqui; a orientação ao morador
// é sempre o texto fixo do front-end (regra), nunca texto gerado.
export const SINAIS = [
  'lona_rasgada', 'rachadura', 'agua_barrenta', 'muro_poste_inclinado',
  'agua_subindo', 'lixo_canal', 'lixo_queima_encosta',
] as const;
export type Sinal = (typeof SINAIS)[number];

export const NECESSIDADES = [
  'idoso', 'crianca', 'acamada', 'cadeira_rodas', 'nao_anda_sozinha', 'dificuldade_entender',
  'gestante', 'bebe_em_casa', 'nao_enxerga', 'nao_ouve', 'nao_le', 'sem_celular', 'mora_so', 'outro',
] as const;
export type Necessidade = (typeof NECESSIDADES)[number];

export const CANAIS = ['visita', 'audio', 'texto_facil', 'libras', 'ligacao'] as const;
export type Canal = (typeof CANAIS)[number];
