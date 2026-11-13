import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { BarraEmergencia } from '@/components/BarraEmergencia';
import { ProvedorPreferencias } from '@/lib/preferencias';
import { AvisoModo } from '@/components/AvisoModo';

export const metadata: Metadata = {
  title: 'RAIZ — Rede de Alerta e Inclusão nas Zonas de risco',
  description: 'Morador mostra o sinal de risco e ouve o que fazer; a liderança sabe qual casa visitar primeiro.',
  icons: { icon: '/marca/simbolo-raiz-preto.svg' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1B6B3A' };

export default function Raiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ProvedorPreferencias>
          <div className="wrap">
            <AvisoModo />
            {children}
            <div id="live" className="sr" aria-live="assertive" />
            <BarraEmergencia />
          </div>
        </ProvedorPreferencias>
      </body>
    </html>
  );
}
