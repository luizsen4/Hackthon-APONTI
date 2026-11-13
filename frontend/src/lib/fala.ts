'use client';

/** Leitura em voz alta (Web Speech API), em português. Funciona offline na maioria dos celulares. */
let falando = false;

export function pararFala() {
  try { window.speechSynthesis?.cancel(); } catch { /* sem suporte */ }
  falando = false;
}

export async function falar(texto: string, forcar = true) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (falando) { pararFala(); if (!forcar) return; }
  falando = true;
  const limite = new Promise((r) => setTimeout(r, Math.min(60000, 4000 + texto.length * 90)));
  const fala = new Promise<void>((res) => {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR'; u.rate = 0.9; u.onend = () => res(); u.onerror = () => res();
    window.speechSynthesis.speak(u);
  });
  await Promise.race([fala, limite]);
  falando = false;
}

type Reconhecimento = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null };

/** Ditado (fala → texto). Nem todo navegador tem; o botão some quando não há suporte. */
export function criarDitado(aoTexto: (t: string) => void, aoParar: () => void) {
  const W = window as unknown as { SpeechRecognition?: new () => Reconhecimento; webkitSpeechRecognition?: new () => Reconhecimento };
  const C = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!C) return null;
  const r = new C();
  r.lang = 'pt-BR'; r.interimResults = true; r.continuous = true;
  r.onresult = (e) => aoTexto(Array.from(e.results).map((x) => x[0].transcript).join(' '));
  r.onend = aoParar; r.onerror = aoParar;
  return r;
}
