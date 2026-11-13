'use client';

async function carregar(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}

function desenhar(img: HTMLImageElement, max: number) {
  const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.naturalWidth * r); cv.height = Math.round(img.naturalHeight * r);
  cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
  return cv;
}

/** Foto para guardar no cadastro: pequena (480 px) e comprimida. */
export async function fotoParaGuardar(file: Blob) {
  return desenhar(await carregar(file), 480).toDataURL('image/jpeg', 0.6);
}

/** Foto para a IA: até 1024 px, em base64 (sem o prefixo data:). Câmera fraca também serve. */
export async function fotoParaIA(file: Blob) {
  const url = desenhar(await carregar(file), 1024).toDataURL('image/jpeg', 0.82);
  return { base64: url.split(',')[1], tipo: 'image/jpeg' as const };
}
