'use client';
import { posEm, type Canal, type Necessidade, type StatusVisita } from '@/domain/catalogo';
import { cpfFicticio } from '@/domain/texto';
import type { Repositorio } from './repositorio';

// COMUNIDADE DE EXEMPLO — todos os dados são FICTÍCIOS e as imagens são ilustrativas.

function avatarSVG(pele: string, cabelo: string, roupa: string, tipo: 'curto' | 'longo' | 'coque') {
  const h = tipo === 'curto' ? `<path d="M28 34 Q50 10 72 34 L72 30 Q50 4 28 30z" fill="${cabelo}"/>`
    : tipo === 'longo' ? `<path d="M24 60 Q22 14 50 14 Q78 14 76 60 L70 60 Q70 26 50 26 Q30 26 30 60z" fill="${cabelo}"/>`
      : `<path d="M30 30 Q50 8 70 30 Q66 20 50 20 Q34 20 30 30z" fill="${cabelo}"/><circle cx="50" cy="16" r="9" fill="${cabelo}"/>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#DDE6EE"/><path d="M14 100 Q14 70 50 68 Q86 70 86 100z" fill="${roupa}"/><rect x="43" y="56" width="14" height="14" fill="${pele}"/><circle cx="50" cy="42" r="20" fill="${pele}"/>${h}<circle cx="43" cy="42" r="2" fill="#222"/><circle cx="57" cy="42" r="2" fill="#222"/><path d="M44 51 Q50 55 56 51" stroke="#222" stroke-width="2" fill="none"/></svg>`);
}
function casaSVG(parede: string, porta: string, lona: boolean) {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="#CFE3F2"/><path d="M0 200 L0 150 Q120 120 320 140 L320 200z" fill="#8D6E4C"/>${lona ? '<path d="M200 150 L320 120 L320 200 L230 200z" fill="#2B6CB0" opacity=".9"/><path d="M262 140 l10 22 l-14 6" stroke="#CFE3F2" stroke-width="4" fill="none"/>' : ''}<rect x="60" y="80" width="140" height="90" fill="${parede}"/><path d="M50 82 L130 40 L210 82z" fill="#8B3A2B"/><rect x="118" y="118" width="28" height="52" fill="${porta}"/><rect x="76" y="100" width="28" height="24" fill="#E8F4FF" stroke="#555"/><rect x="162" y="100" width="28" height="24" fill="#E8F4FF" stroke="#555"/><text x="8" y="16" font-family="sans-serif" font-size="11" fill="#333">imagem ilustrativa</text></svg>`);
}

type Morador = { k: string; nome: string; cpf?: boolean; semdoc?: boolean; nec: Necessidade[]; outro?: string; canal: Canal; cont: string; av?: [string, string, string, 'curto' | 'longo' | 'coque'] };
type CasaEx = { k: string; end: string; ref: string; z: string; st: StatusVisita; stAt?: number; foto?: [string, string, boolean]; M: Morador[] };

const CASAS: CasaEx[] = [
  { k: 'c1', end: 'Rua da Ladeira, 40', ref: 'Casa azul ao lado da mercearia', z: 'z1', st: 'Pendente', foto: ['#7EB6E0', '#5A3B22', true], M: [
    { k: 'socorro', nome: 'Maria do Socorro Silva', cpf: true, nec: ['idoso', 'nao_anda_sozinha'], canal: 'visita', cont: 'Ana (filha) · (81) 9 0000-0001', av: ['#C68E63', '#E5E5E5', '#7B4EA0', 'longo'] },
    { k: 'pedro', nome: 'Pedro Henrique (neto, 8 anos)', nec: ['crianca'], canal: 'visita', cont: 'Avó Maria do Socorro' }] },
  { k: 'c2', end: 'Beco do Cruzeiro, 12', ref: 'Subindo a escadaria, 2ª casa', z: 'z2', st: 'Precisa Defesa Civil', stAt: 2, foto: ['#E8D9B5', '#3B5B2A', false], M: [
    { k: 'raimundo', nome: 'Raimundo Nonato Ferreira', cpf: true, nec: ['idoso', 'acamada'], canal: 'ligacao', cont: 'Jorge (filho) · (81) 9 0000-0002' },
    { k: 'jorge', nome: 'Jorge Ferreira', cpf: true, nec: [], canal: 'ligacao', cont: '(81) 9 0000-0002', av: ['#A0703F', '#2B2B2B', '#455A64', 'curto'] }] },
  { k: 'c3', end: 'Rua da Ladeira, 112', ref: 'Muro amarelo', z: 'z1', st: 'Pendente', foto: ['#F2D16B', '#6B3E1F', false], M: [
    { k: 'severina', nome: 'Severina Alves de Lima', cpf: true, nec: ['idoso', 'dificuldade_entender', 'nao_enxerga', 'mora_so'], canal: 'visita', cont: 'Kátia (sobrinha)' }] },
  { k: 'c4', end: 'Beco do Cruzeiro, s/n', ref: 'Barraco de madeira no fim do beco', z: 'z2', st: 'Pendente', M: [
    { k: 'ze', nome: 'José Carlos dos Santos (Seu Zé)', cpf: true, nec: ['idoso', 'cadeira_rodas'], canal: 'visita', cont: 'Caio (neto)', av: ['#8D5524', '#222', '#2E7D32', 'curto'] },
    { k: 'caio', nome: 'Caio Santos', nec: [], canal: 'audio', cont: '' }] },
  { k: 'c5', end: 'Rua da Ladeira, 58', ref: '', z: 'z4', st: 'Visitado', stAt: 5, M: [
    { k: 'marcos', nome: 'Marcos Vinícius Lima', cpf: true, nec: ['nao_ouve'], canal: 'libras', cont: 'Paula (irmã) · (81) 9 0000-0003', av: ['#E0AC69', '#3B2A1A', '#1565C0', 'curto'] },
    { k: 'paula', nome: 'Paula Lima', cpf: true, nec: [], canal: 'texto_facil', cont: '(81) 9 0000-0003' }] },
  { k: 'c6', end: 'Travessa Alta, 3', ref: 'Portão verde', z: 'z5', st: 'Não encontrado', stAt: 1, foto: ['#F5F5F5', '#2E7D32', false], M: [
    { k: 'lucia', nome: 'Lúcia Helena (Dona Lúcia)', semdoc: true, nec: ['idoso', 'nao_le', 'mora_so'], canal: 'audio', cont: '', av: ['#6B4226', '#BDBDBD', '#C62828', 'coque'] }] },
  { k: 'c7', end: 'Rua Nova, 7 (fundos)', ref: '', z: 'z5', st: 'Pendente', M: [
    { k: 'jessica', nome: 'Jéssica Santos', nec: ['gestante', 'sem_celular'], canal: 'visita', cont: 'Rosa (vizinha)' },
    { k: 'davi', nome: 'Davi Santos (4 anos)', nec: ['crianca'], canal: 'visita', cont: 'Mãe: Jéssica' }] },
  { k: 'c8', end: '', ref: 'Beira do canal, perto da ponte', z: 'z3', st: 'Pendente', M: [
    { k: 'ana', nome: 'Ana Beatriz Rocha', nec: ['bebe_em_casa'], canal: 'audio', cont: '' },
    { k: 'cida', nome: 'Aparecida Rocha (Dona Cida, avó)', cpf: true, nec: ['idoso', 'outro'], outro: 'Usa aparelho que precisa de tomada', canal: 'visita', cont: 'Ana (neta)' }] },
  { k: 'c9', end: 'Margem do canal, 9', ref: 'Casa de taipa', z: 'z3', st: 'Pendente', foto: ['#C9A27E', '#4E342E', false], M: [
    { k: 'chica', nome: 'Francisca (Dona Chica)', semdoc: true, nec: ['idoso', 'acamada', 'mora_so'], canal: 'visita', cont: 'Beto (vizinho) · (81) 9 0000-0004' }] },
  { k: 'c10', end: 'Avenida principal, 300', ref: '', z: 'z6', st: 'Visitado', stAt: 20, M: [
    { k: 'antonio', nome: 'Antônio Pereira', cpf: true, nec: ['mora_so'], canal: 'ligacao', cont: '' }] },
];

export async function carregarExemplo(r: Repositorio, s: string) {
  const a = Date.now(), H = 3600e3, rev = a + 182 * 864e5;
  for (const [i, c] of CASAS.entries()) {
    const cid = `demo-${s}-${c.k}`;
    await r.inserir('casas', { id: cid, setor: s, apelido: '', endereco: c.end, referencia: c.ref, zona: c.z, pos: posEm(c.z), status: c.st, statusEm: c.stAt ? a - c.stAt * H : null, temFoto: !!c.foto, criadoEm: a - (12 + i) * 24 * H, ficticio: true });
    if (c.foto) await r.inserir('fotos', { id: `casa-${cid}`, setor: s, casa: casaSVG(...c.foto), ilustrativa: true });
    for (const x of c.M) {
      const id = `demo-${s}-${x.k}`;
      await r.inserir('pessoas', {
        id, setor: s, casaId: cid, nome: x.nome, cpf: x.cpf ? cpfFicticio() : '', semDocumento: !!x.semdoc, endereco: c.end, referencia: c.ref,
        necessidades: x.nec, necessidadeOutro: x.outro ?? '', canal: x.canal, contato: x.cont, zona: c.z, pos: posEm(c.z),
        temFotos: { pessoa: !!x.av }, consentimento: { em: a, forma: 'exemplo fictício', foto: !!x.av }, revisarAte: rev, criadoEm: a - (10 + i) * 24 * H, ficticio: true,
      });
      if (x.av) await r.inserir('fotos', { id, setor: s, pessoa: avatarSVG(...x.av), ilustrativa: true });
    }
  }
  const R = [['lona_rasgada', 'z1', 'foto', 0.6], ['agua_barrenta', 'z1', 'liderança', 1.5], ['lixo_canal', 'z3', 'desenho', 3], ['rachadura', 'z2', 'texto', 20], ['lixo_queima_encosta', 'z4', 'liderança', 30]] as const;
  for (const [j, [sinal, z, origem, h]] of R.entries()) {
    await r.inserir('relatos', { id: `demo-${s}-r${j}`, setor: s, sinal, zona: z, pos: posEm(z), origem, criadoEm: a - h * H, ficticio: true });
  }
  await r.inserir('pedidos', { id: `demo-${s}-p1`, setor: s, mensagem: 'Boa tarde. Queria cadastrar minha avó, Dona Lurdes. Ela tem 82 anos, anda de bengala e mora comigo na Rua Nova, 15, casa de muro rosa. Às vezes ela esquece as coisas.', para: 'outro', paraNome: 'Lurdes Barbosa (Dona Lurdes)', parentesco: 'Avó', selfie: avatarSVG('#B07A4F', '#1E1E1E', '#00897B', 'longo'), cpf: '', status: 'pendente', criadoEm: a - 0.4 * H, consentimento: { em: a, forma: 'exemplo fictício' }, ficticio: true });
  await r.inserir('pedidos', { id: `demo-${s}-p2`, setor: s, mensagem: 'Sou o Wellington, moro sozinho no Beco do Cruzeiro, 20. Não escuto bem e prefiro mensagem escrita.', para: 'eu', paraNome: '', parentesco: '', selfie: '', cpf: cpfFicticio(), status: 'pendente', criadoEm: a - 5 * H, consentimento: { em: a, forma: 'exemplo fictício' }, ficticio: true });
}
