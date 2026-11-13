'use client';
import Link from 'next/link';
import { useState } from 'react';
import { BlocoIdentificacao, BotaoDitado, Grade, validarIdentificacao, type Identificacao } from '@/components/Campos';
import { Cabecalho, anunciar } from '@/components/Cabecalho';
import { Erro } from '@/components/Etiquetas';
import { repo } from '@/data';
import { SETORES } from '@/domain/catalogo';
import { limpa, soDigitos } from '@/domain/texto';
import { useExigePreferencias } from '@/lib/acesso';

const PARENTES = ['Avó', 'Avô', 'Mãe', 'Pai', 'Filha ou filho', 'Neta ou neto', 'Irmã ou irmão', 'Tia ou tio', 'Vizinha ou vizinho', 'Outra pessoa'];

/** Morador (sem conta) pede à liderança que faça o cadastro dele ou de alguém da casa. */
export default function Pedido() {
  useExigePreferencias('/pedido');
  const [msg, setMsg] = useState('');
  const [para, setPara] = useState<'eu' | 'outro'>('eu');
  const [outroNome, setOutroNome] = useState('');
  const [parentesco, setParentesco] = useState(PARENTES[0]);
  const [ident, setIdent] = useState<Identificacao>({ cpf: '', selfie: '' });
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function enviar() {
    setErro(null);
    if (!msg.trim()) return setErro('Escreva ou fale sua mensagem.');
    if (para === 'outro' && !limpa(outroNome, 60)) return setErro('Escreva o nome da pessoa que vai ser cadastrada.');
    const v = validarIdentificacao(ident); if (v) return setErro(v);
    if (!aceite) return setErro('Marque que você concorda em mandar seus dados.');
    setOcupado(true);
    try {
      const r = repo();
      const autor = await r.auth.idMorador();
      const id = await r.inserir('pedidos', {
        setor: localStorage.getItem('raiz-setor') || SETORES[0].id, mensagem: msg.trim().slice(0, 1500), cpf: soDigitos(ident.cpf), selfie: ident.selfie,
        para, paraNome: para === 'outro' ? limpa(outroNome, 60) : '', parentesco: para === 'outro' ? parentesco : '',
        status: 'pendente', criadoEm: Date.now(), autor, consentimento: { em: Date.now(), forma: 'morador, no aplicativo' },
      });
      localStorage.setItem('raiz-meu-pedido', id);
      setEnviado(true); anunciar('Pedido enviado para a liderança.');
    } catch { setErro('Não foi possível enviar agora. Peça ajuda a um vizinho ou ligue para a liderança.'); }
    finally { setOcupado(false); }
  }

  return (
    <>
      <Cabecalho vista="pedido" titulo="Pedir cadastro" voltar="/morador" />
      <main id="v-pedido">
        {enviado ? (
          <section className="ok">
            <h1>Pedido enviado</h1>
            <p>A liderança vai conferir e fazer o cadastro. O status aparece no seu painel. Você pode pedir para apagar quando quiser.</p>
            <Link className="btn b-dark" href="/morador">Voltar</Link>
          </section>
        ) : (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <h1><span className="tone">Quer ajuda da liderança?</span> Mande uma mensagem.</h1>
            <p className="muted">Conte quem é, onde mora e o que é difícil. A liderança faz o cadastro.</p>
            <div className="card">
              <BotaoDitado valor={msg} aoMudar={setMsg} />
              <label className="f" htmlFor="pd-msg">Sua mensagem</label>
              <textarea id="pd-msg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ex.: Sou Lúcia, moro na Travessa Alta, 3, portão verde. Moro só e não leio bem. Prefiro áudio no WhatsApp." />
            </div>
            <fieldset className="card" style={{ margin: 0 }}>
              <legend className="sr">Para quem é o cadastro?</legend><h2 aria-hidden="true">Para quem é o cadastro?</h2>
              <Grade nome="pd-para" multiplo={false} valor={[para]} aoMudar={(v) => setPara(v[0])} opcoes={[['eu', 'Para mim'], ['outro', 'Para outra pessoa da minha casa']]} />
              {para === 'outro' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div><label className="f" htmlFor="pd-onome">Nome da pessoa</label><input id="pd-onome" maxLength={60} placeholder="Ex.: Dona Cida" value={outroNome} onChange={(e) => setOutroNome(e.target.value)} /></div>
                  <div><label className="f" htmlFor="pd-opar">Ela é sua…</label><select id="pd-opar" value={parentesco} onChange={(e) => setParentesco(e.target.value)}>{PARENTES.map((p) => <option key={p}>{p}</option>)}</select></div>
                  <p className="small">Você se identifica abaixo como quem está pedindo.</p>
                </div>
              )}
            </fieldset>
            <BlocoIdentificacao prefixo="pi" valor={ident} aoMudar={setIdent} />
            <label className={`chk${aceite ? ' on' : ''}`}><input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} /> <span>Concordo em mandar meus dados para a liderança da minha comunidade</span></label>
            <Erro texto={erro} />
            <button type="button" className="b-dark" disabled={ocupado} onClick={enviar}>Enviar para a liderança</button>
          </section>
        )}
      </main>
    </>
  );
}
