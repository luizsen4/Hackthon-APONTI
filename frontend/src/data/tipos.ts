import type { Canal, Necessidade, SinalChave, StatusVisita, TipoAviso } from '@/domain/catalogo';

export interface Ponto { x: number; y: number }

/** Residência: agrupa quem mora na mesma casa. O status da visita é da casa. */
export interface Casa {
  id: string; setor: string; apelido?: string; endereco: string; referencia: string;
  zona: string; pos?: Ponto; status: StatusVisita; statusEm?: number | null;
  temFoto?: boolean; criadoEm: number; ficticio?: boolean;
}

export interface Pessoa {
  id: string; setor: string; casaId?: string; nome: string;
  cpf: string; semDocumento: boolean; endereco: string; referencia: string;
  necessidades: Necessidade[]; necessidadeOutro?: string; canal: Canal; contato: string;
  zona: string; pos?: Ponto; temFotos?: { pessoa?: boolean; casa?: boolean };
  consentimento: { em: number; forma: string; foto: boolean };
  revisarAte: number; criadoEm: number; ficticio?: boolean;
  /** legado: cadastros antigos sem residência guardavam o status na pessoa */
  status?: StatusVisita; statusEm?: number | null;
}

export interface Relato {
  id: string; setor: string; sinal: SinalChave; zona?: string; pos?: Ponto;
  origem: 'foto' | 'texto' | 'desenho' | 'liderança'; autor?: string; criadoEm: number; ficticio?: boolean;
}

export interface Aviso {
  id: string; setor: string; tipo: TipoAviso; titulo: string; texto: string; endereco: string; autor: string; criadoEm: number;
}

export type StatusPedido = 'pendente' | 'cadastrado' | 'recusado';
export interface Pedido {
  id: string; setor: string; mensagem: string; cpf: string; selfie: string;
  para: 'eu' | 'outro'; paraNome: string; parentesco: string;
  status: StatusPedido; statusEm?: number | null; casaNome?: string; pessoaNome?: string;
  criadoEm: number; autor?: string; consentimento: { em: number; forma: string }; ficticio?: boolean;
}

/** Identificação de quem avisou (selfie ou CPF). Só a liderança do setor lê. */
export interface Ident { id: string; setor: string; cpf: string; selfie: string; em: number }

/** Fotos ficam separadas dos cadastros. id = id da pessoa, ou "casa-<id da casa>". */
export interface Foto { id: string; setor: string; casa?: string; pessoa?: string; ilustrativa?: boolean }

export interface Lideranca { nome: string; assoc: string; setor: string; tel: string }

export interface Colecoes {
  casas: Casa; pessoas: Pessoa; relatos: Relato; avisos: Aviso; pedidos: Pedido; idents: Ident; fotos: Foto;
}
export type NomeColecao = keyof Colecoes;
