'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Cabecalho } from '@/components/Cabecalho';
import { Erro } from '@/components/Etiquetas';
import { Icone } from '@/components/Icone';
import { repo } from '@/data';
import { ErroAuth } from '@/data/repositorio';
import { soDigitos } from '@/domain/texto';

export default function Inicio() {
  const router = useRouter();
  const [tel, setTel] = useState('');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [demo, setDemo] = useState(false);
  useEffect(() => { setDemo(repo().modo === 'demo'); }, []);

  async function entrar(fn: () => Promise<unknown>) {
    setErro(null); setOcupado(true);
    try { await fn(); router.push('/lideranca'); }
    catch (e) { setErro(e instanceof ErroAuth ? e.message : 'Não foi possível entrar agora.'); }
    finally { setOcupado(false); }
  }

  return (
    <>
      <Cabecalho vista="inicio" textoTela={() => 'Se você mora na área, toque em Sou morador. Se você é liderança, entre com telefone e PIN. Em emergência, toque no botão vermelho embaixo, para ligar 199.'} />
      <main id="v-inicio">
        <section className="abertura">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="selo"><img className="simbolo-p" src="/marca/simbolo-raiz-preto.svg" alt="Símbolo do RAIZ: uma casa sobre duas folhas" /><img className="simbolo-b" src="/marca/simbolo-raiz-branco.svg" alt="Símbolo do RAIZ: uma casa sobre duas folhas" /></div>
          <h1 className="bv"><span className="tone">Bem-vindo ao</span><span className="sr">RAIZ</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="wm-g wm-p" src="/marca/raiz-palavra-preto.svg" alt="" /><img className="wm-g wm-b" src="/marca/raiz-palavra-branco.svg" alt="" /></h1>
          <p className="muted">Rede de alerta da sua comunidade. Ninguém fica sem aviso.</p>
        </section>

        <Link className="linha card-linha" href="/morador">
          <span className="ict ict--inv"><Icone nome="casa" /></span>
          <span className="lt"><b>Sou morador</b><span>Entrar sem senha · mostrar um sinal e saber o que fazer</span></span>
          <Icone nome="chev" className="chev" espessura={2.4} />
        </Link>

        <div className="divisor"><span>ou</span></div>

        <form className="card" id="lg-form" noValidate onSubmit={(e) => {
          e.preventDefault();
          if (soDigitos(tel).length < 10) return setErro('Digite o telefone com DDD.');
          if (soDigitos(pin).length !== 6) return setErro('O PIN tem 6 números.');
          void entrar(() => repo().auth.entrar(tel, soDigitos(pin)));
        }}>
          <div className="secao"><span className="ict"><Icone nome="grupo" /></span><div><h2>Sou liderança</h2><p className="small">Entre para ver quem visitar primeiro</p></div></div>
          <div><label className="f" htmlFor="lg-tel">Telefone</label><input type="text" id="lg-tel" inputMode="tel" autoComplete="username" placeholder="(81) 9 0000-0000" value={tel} onChange={(e) => setTel(e.target.value)} /></div>
          <div><label className="f" htmlFor="lg-pin">PIN de 6 números</label><input type="password" id="lg-pin" inputMode="numeric" autoComplete="current-password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} /></div>
          <Erro texto={erro} />
          <button type="submit" className="b-dark" disabled={ocupado}>Entrar</button>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <Link className="b-link" href="/conta" style={{ alignSelf: 'auto' }}>Criar conta de liderança</Link>
            {demo && <button type="button" className="b-link" style={{ alignSelf: 'auto' }} disabled={ocupado} onClick={() => entrar(() => repo().auth.contaExemplo())}>Usar conta de exemplo</button>}
          </div>
        </form>

        <p className="small" style={{ textAlign: 'center' }}>Morador não precisa de conta. Quem cadastra o morador é a liderança, a partir de um pedido enviado pelo próprio morador.</p>
      </main>
    </>
  );
}
