import { Icone } from './Icone';

/** Sempre visível: ligação direta para 199, 193 e 192. */
export function BarraEmergencia() {
  const L = [['199', 'Defesa Civil', 'casa'], ['193', 'Bombeiros', 'fogo'], ['192', 'SAMU', 'ambulancia']];
  return (
    <nav className="pt-ebar pt-ebar--fixed" aria-label="Ligações de emergência">
      <div className="pt-ebar__label"><Icone nome="telefone" /><span>Perigo agora? Ligue</span></div>
      <div className="pt-ebar__row">
        {L.map(([n, quem, ic]) => (
          <a key={n} className="pt-ebar__call" href={`tel:${n}`} aria-label={`Ligar ${n}, ${quem}`}>
            <span className="pt-ebar__num"><Icone nome={ic} />{n}</span><span className="pt-ebar__who">{quem}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
