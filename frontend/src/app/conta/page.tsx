'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Cabecalho } from '@/components/Cabecalho';
import { Erro } from '@/components/Etiquetas';
import { repo } from '@/data';
import { ErroAuth } from '@/data/repositorio';
import { SETORES } from '@/domain/catalogo';
import { limpa, soDigitos } from '@/domain/texto';

export default function CriarConta() {
  const router = useRouter();
  const [f, setF] = useState({ nome: '', assoc: '', setor: SETORES[0].id as string, tel: '', pin: '', pin2: '' });
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const campo = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setErro(null);
    const nome = limpa(f.nome, 60), tel = soDigitos(f.tel), pin = soDigitos(f.pin);
    if (!nome) return setErro('Escreva seu nome.');
    if (tel.length < 10) return setErro('Digite o telefone com DDD.');
    if (pin.length !== 6) return setErro('O PIN precisa ter 6 números.');
    if (pin !== soDigitos(f.pin2)) return setErro('Os dois PINs não são iguais.');
    setOcupado(true);
    try { await repo().auth.criarConta({ nome, assoc: limpa(f.assoc, 80), setor: f.setor, tel, pin }); router.push('/lideranca'); }
    catch (err) { setErro(err instanceof ErroAuth ? err.message : 'Não foi possível criar a conta agora.'); }
    finally { setOcupado(false); }
  }

  return (
    <>
      <Cabecalho vista="conta" titulo="Criar conta" voltar="/" />
      <main id="v-conta">
        <h1><span className="tone">Criar conta de</span> liderança</h1>
        <p className="muted">Só lideranças e associações têm conta. Moradores não precisam.</p>
        <form className="card" noValidate onSubmit={enviar}>
          <div><label className="f" htmlFor="ct-nome">Seu nome</label><input id="ct-nome" maxLength={60} autoComplete="name" value={f.nome} onChange={campo('nome')} /></div>
          <div><label className="f" htmlFor="ct-assoc">Associação ou grupo (se tiver)</label><input id="ct-assoc" maxLength={80} value={f.assoc} onChange={campo('assoc')} /></div>
          <div><label className="f" htmlFor="ct-setor">Comunidade que você acompanha</label><select id="ct-setor" value={f.setor} onChange={campo('setor')}>{SETORES.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>
          <div><label className="f" htmlFor="ct-tel">Telefone</label><input id="ct-tel" inputMode="tel" autoComplete="tel" placeholder="(81) 9 0000-0000" value={f.tel} onChange={campo('tel')} /></div>
          <div><label className="f" htmlFor="ct-pin">Crie um PIN de 6 números</label><input id="ct-pin" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" value={f.pin} onChange={campo('pin')} /></div>
          <div><label className="f" htmlFor="ct-pin2">Repita o PIN</label><input id="ct-pin2" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" value={f.pin2} onChange={campo('pin2')} /></div>
          <Erro texto={erro} />
          <button type="submit" className="b-dark" disabled={ocupado}>Criar conta e entrar</button>
          <p className="small">No modo demonstração o PIN é guardado só como código embaralhado (SHA-256). Com Supabase, vira a senha do Supabase Auth. Em produção: confirmação por SMS.</p>
        </form>
      </main>
    </>
  );
}
