import type { Colecoes, Lideranca, NomeColecao } from './tipos';

export type Cancelar = () => void;

/**
 * Contrato de dados do app. Duas implementações:
 * - memória (modo demonstração, dados fictícios no navegador), usada quando o Supabase não está configurado;
 * - Supabase (banco Postgres com Row Level Security por setor).
 */
export interface Repositorio {
  modo: 'demo' | 'supabase';
  assinar<K extends NomeColecao>(col: K, setor: string, cb: (lista: Colecoes[K][]) => void): Cancelar;
  assinarDoc<K extends NomeColecao>(col: K, id: string, cb: (doc: Colecoes[K] | null) => void): Cancelar;
  inserir<K extends NomeColecao>(col: K, dados: Omit<Colecoes[K], 'id'> & { id?: string }): Promise<string>;
  atualizar<K extends NomeColecao>(col: K, id: string, patch: Partial<Colecoes[K]>): Promise<void>;
  apagar(col: NomeColecao, id: string): Promise<void>;
  alerta: {
    assinar(setor: string, cb: (ativo: boolean) => void): Cancelar;
    definir(setor: string, ativo: boolean): Promise<void>;
  };
  auth: {
    entrar(tel: string, pin: string): Promise<Lideranca>;
    criarConta(dados: Lideranca & { pin: string }): Promise<Lideranca>;
    contaExemplo(): Promise<Lideranca>;
    sair(): Promise<void>;
    /** Liderança logada, ou null. */
    sessao(): Lideranca | null;
    /** Identificador anônimo do morador (sem login), usado como autor de pedidos e avisos. */
    idMorador(): Promise<string>;
  };
}

export class ErroAuth extends Error {}
