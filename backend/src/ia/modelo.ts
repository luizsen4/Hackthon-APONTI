import { Anthropic } from '@anthropic-ai/sdk';
import type { ContentBlock, ContentBlockParam } from '@anthropic-ai/sdk/resources/messages';
import { extrairJSON } from './guardas.js';

export interface Imagem { base64: string; tipo: 'image/jpeg' | 'image/png' | 'image/webp' }

/** Interface mínima do modelo: permite trocar o provedor e simular nos testes. */
export interface Modelo {
  perguntarJSON(prompt: string, imagem?: Imagem): Promise<unknown>;
}

export class ModeloIndisponivel extends Error {}

export function modeloAnthropic(apiKey: string | undefined, nome: string): Modelo | null {
  if (!apiKey) return null;
  const cliente = new Anthropic({ apiKey });
  return {
    async perguntarJSON(prompt, imagem) {
      const conteudo: ContentBlockParam[] = [];
      if (imagem) conteudo.push({ type: 'image', source: { type: 'base64', media_type: imagem.tipo, data: imagem.base64 } });
      conteudo.push({ type: 'text', text: prompt });
      const r = await cliente.messages.create({ model: nome, max_tokens: 600, messages: [{ role: 'user', content: conteudo }] });
      const texto = r.content.map((b: ContentBlock) => (b.type === 'text' ? b.text : '')).join('');
      return extrairJSON(texto);
    },
  };
}
