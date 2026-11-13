# Arquitetura do RAIZ

```
Celular do morador / da liderança (Next.js, PWA)
   │  dados ──────────────► Supabase (Postgres + RLS por comunidade + Realtime)
   │                         └ sem Supabase: modo demonstração (localStorage, dados fictícios)
   └─ IA ─► API RAIZ (Express) ─► Claude (multimodal, saída JSON)
              guardas: Zod na entrada e na saída, CPF removido, dados cercados, lista fechada,
              palavras proibidas, rate limit, 503 quando a IA está desligada
```

## Decisões
- **A IA classifica, a regra orienta.** O texto que o morador ouve é fixo por sinal (`frontend/src/domain/catalogo.ts`).
- **Ordem de visita por regra** (`domain/prioridade.ts`): casas pendentes primeiro; pontos = soma das dificuldades dos moradores + peso do nível da área + 5 se houve sinal de risco na área nas últimas 48 h. Nunca marca ninguém como “seguro”.
- **Residência agrupa moradores.** O status da visita é da casa; cadastros antigos sem casa viram uma casa de uma pessoa.
- **Sem IA, tudo continua funcionando:** escolher o sinal pelo desenho, preencher o cadastro à mão, avisos sem reescrita.
- **Contrato de dados único** (`data/repositorio.ts`) com duas implementações, para a demo rodar sem infraestrutura.

## Próximos passos
Mapa oficial de áreas de risco (dados abertos do Recife), boletim da APAC real, login por SMS, fotos no Supabase Storage, aviso por SMS para quem não tem internet, piloto com uma associação.
