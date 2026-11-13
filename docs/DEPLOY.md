# Deploy

O repositório tem duas aplicações. Na Vercel, crie **dois projetos** importando o mesmo repositório e mudando só a **Root Directory**.

## 1. API (`backend`)
| Configuração | Valor |
|---|---|
| Root Directory | `backend` |
| Framework Preset | Express (detectado automaticamente) |
| Node.js | 22.x |

Variáveis de ambiente:

| Nome | Exemplo | Obrigatória |
|---|---|---|
| `ANTHROPIC_API_KEY` | chave da Anthropic | sim, para a IA funcionar |
| `ANTHROPIC_MODEL` | `claude-haiku-5-5` | não |
| `CORS_ORIGIN` | `https://raiz.vercel.app` (URL do front-end) | sim |

O ponto de entrada é `src/index.ts`, que exporta o app Express. Teste em `https://<sua-api>.vercel.app/api/saude`.

**Alternativa (Render):** Root Directory `backend`, Build `npm ci && npm run build`, Start `npm start`, mesmas variáveis.

## 2. Front-end (`frontend`)
| Configuração | Valor |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Next.js |
| Node.js | 22.x |

Variáveis de ambiente:

| Nome | Exemplo | Obrigatória |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<sua-api>.vercel.app` | sim, para a IA funcionar |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | não (sem ela, modo demonstração) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave pública (anon) do Supabase | não |

Depois de publicar o front-end, volte na API e coloque a URL dele em `CORS_ORIGIN`.
