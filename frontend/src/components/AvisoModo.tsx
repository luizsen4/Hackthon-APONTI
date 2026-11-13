'use client';
import { useEffect, useState } from 'react';
import { repo } from '@/data';

/** Faixa que deixa claro que é protótipo e quando os dados são fictícios. */
export function AvisoModo() {
  const [demo, setDemo] = useState(true);
  useEffect(() => { setDemo(repo().modo === 'demo'); }, []);
  return <div className="demo" role="note">{demo ? 'Protótipo · modo demonstração · dados fictícios no seu navegador' : 'Protótipo · use só dados fictícios'}</div>;
}
