import { describe, expect, it } from 'vitest';
import type { Casa, Pessoa, Relato } from '@/data/tipos';
import { estadoPainel, montaCasas, passaFiltro, resumoVulnerabilidade } from './prioridade';
import { PROIBIDAS, cpfFicticio, cpfValido, limpa, mascaraCpf } from './texto';

const agora = 1_800_000_000_000;
const casa = (id: string, zona: string, status: Casa['status'] = 'Pendente'): Casa => ({ id, setor: 's', endereco: `Rua ${id}`, referencia: '', zona, status, criadoEm: 0 });
const pessoa = (id: string, casaId: string | undefined, necessidades: Pessoa['necessidades'], zona = 'z6'): Pessoa => ({
  id, setor: 's', casaId, nome: `Pessoa ${id}`, cpf: '', semDocumento: true, endereco: '', referencia: '', necessidades, canal: 'visita', contato: '',
  zona, consentimento: { em: 0, forma: 'teste', foto: false }, revisarAte: 0, criadoEm: 0,
});

describe('CPF', () => {
  it('valida dígitos verificadores e mascara no painel', () => {
    expect(cpfValido('529.982.247-25')).toBe(true);
    expect(cpfValido('529.982.247-24')).toBe(false);
    expect(cpfValido('111.111.111-11')).toBe(false);
    expect(mascaraCpf('52998224725')).toBe('***.982.247-**');
    expect(cpfValido(cpfFicticio())).toBe(true);
  });
  it('tira CPF de texto livre', () => {
    expect(limpa('Maria, CPF 529.982.247-25, Rua A', 100)).toBe('Maria, CPF , Rua A');
  });
});

describe('palavras proibidas', () => {
  it('bloqueia "seguro", "sem risco" e rota', () => {
    expect(PROIBIDAS.test('Pode ficar tranquila, está seguro')).toBe(true);
    expect(PROIBIDAS.test('Siga esta rota até a escola')).toBe(true);
    expect(PROIBIDAS.test('Não mexa na lona. Ligue 199.')).toBe(false);
  });
});

describe('residências', () => {
  it('agrupa moradores da mesma casa e cria casa avulsa para cadastro antigo', () => {
    const lista = montaCasas([casa('c1', 'z1')], [pessoa('a', 'c1', ['idoso']), pessoa('b', 'c1', ['crianca']), pessoa('x', undefined, [])]);
    expect(lista).toHaveLength(2);
    expect(lista[0].residentes.map((p) => p.id)).toEqual(['a', 'b']);
    expect(lista[1]).toMatchObject({ id: 'v-x', real: false });
  });
  it('resume as vulnerabilidades da casa', () => {
    expect(resumoVulnerabilidade([pessoa('a', 'c', ['idoso', 'outro']), pessoa('b', 'c', ['idoso'])]))
      .toEqual([{ k: 'idoso', label: 'Pessoa idosa', n: 2 }, { k: 'outro', label: 'Outro', n: 1 }]);
  });
});

describe('ordem de visita', () => {
  it('casa com acamado em área R4 com sinal recente vem antes; visitadas vão para o fim', () => {
    const casas = [casa('baixa', 'z6'), casa('alta', 'z1'), casa('feita', 'z1', 'Visitado')];
    const pessoas = [pessoa('1', 'baixa', ['mora_so']), pessoa('2', 'alta', ['acamada']), pessoa('3', 'feita', ['acamada', 'idoso'])];
    const relatos: Relato[] = [{ id: 'r', setor: 's', sinal: 'lona_rasgada', zona: 'z1', origem: 'foto', criadoEm: agora - 3600e3 }];
    const E = estadoPainel(casas, pessoas, relatos, false, agora);
    expect(E.ativo).toBe(true);
    expect(E.ordem.map((c) => c.id)).toEqual(['alta', 'baixa', 'feita']);
  });
  it('sinal com mais de 48 h não ativa o painel', () => {
    const relatos: Relato[] = [{ id: 'r', setor: 's', sinal: 'rachadura', origem: 'texto', criadoEm: agora - 49 * 3600e3 }];
    expect(estadoPainel([], [], relatos, false, agora).ativo).toBe(false);
  });
  it('filtra por morador e por documento', () => {
    const [c] = montaCasas([casa('c1', 'z1')], [pessoa('a', 'c1', [])]);
    expect(passaFiltro(c, 'todas', 'pessoa a')).toBe(true);
    expect(passaFiltro(c, 'semdoc', '')).toBe(true);
    expect(passaFiltro(c, 'Visitado', '')).toBe(false);
  });
});
