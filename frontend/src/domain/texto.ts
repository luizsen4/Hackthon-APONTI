/** Palavras que o app nunca usa: não declara lugar seguro nem indica rota. */
export const PROIBIDAS = /(est[aá] segur|sem risco|n[aã]o h[aá] risco|pode ficar tranquil|risco baixo|\brota\b|caminho seguro)/i;

const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

/** Limpa texto livre: tira CPF, espaços repetidos e corta no tamanho. */
export function limpa(s: unknown, n: number): string {
  return String(s ?? '').replace(CPF_RE, '').replace(/\s+/g, ' ').trim().slice(0, n);
}

export function atras(ms: number | null | undefined, agora = Date.now()): string {
  if (!ms) return '';
  const m = Math.round((agora - ms) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} dia(s)`;
}

export function iniciais(n: string | null | undefined): string {
  return String(n || '?').split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
}

// ---- CPF: validado no aparelho, guardado só pela liderança, mascarado no painel, nunca enviado à IA ----
export const soDigitos = (x: unknown) => String(x ?? '').replace(/\D/g, '');

export function cpfValido(c: string): boolean {
  c = soDigitos(c);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}

export function formataCpf(c: string): string {
  c = soDigitos(c).slice(0, 11);
  return c.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})-?(\d{1,2})$/, '$1-$2');
}

export function mascaraCpf(c: string): string {
  c = soDigitos(c);
  return c.length === 11 ? `***.${c.slice(3, 6)}.${c.slice(6, 9)}-**` : '';
}

/** Gera CPF válido só para dados FICTÍCIOS da comunidade de exemplo. */
export function cpfFicticio(aleatorio: () => number = Math.random): string {
  const n: number[] = [];
  for (let i = 0; i < 9; i++) n.push(Math.floor(aleatorio() * 10));
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let k = 0; k < t; k++) s += n[k] * (t + 1 - k);
    n.push(((s * 10) % 11) % 10);
  }
  return n.join('');
}

export const telefoneDigitos = (t: string) => soDigitos(t).slice(-11);
