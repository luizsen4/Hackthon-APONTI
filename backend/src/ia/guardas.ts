// Proteções aplicadas antes e depois de cada chamada ao modelo.

/** Palavras que a IA nunca pode usar: o app não declara lugar seguro nem indica rota. */
export const PROIBIDAS = /(est[aá] segur|sem risco|n[aã]o h[aá] risco|pode ficar tranquil|risco baixo|\brota\b|caminho seguro)/i;

const CPF = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;

/** Remove CPF do texto antes de enviar ao modelo (o documento nunca sai do sistema). */
export function semDocumento(texto: string): string {
  return texto.replace(CPF, '[documento informado]');
}

/** Cerca o conteúdo do usuário como DADOS, para reduzir injeção de instruções. */
export function cercar(texto: string, max = 1500): string {
  const limpo = String(texto).slice(0, max).replace(/<<<|>>>/g, '');
  return `<<<DADOS\n${limpo}\nDADOS>>>`;
}

/** Extrai o primeiro objeto JSON da resposta do modelo. */
export function extrairJSON(texto: string): unknown {
  const m = texto.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('resposta_sem_json');
  return JSON.parse(m[0]);
}

export function limpar(texto: unknown, max: number): string {
  return String(texto ?? '').replace(CPF, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
