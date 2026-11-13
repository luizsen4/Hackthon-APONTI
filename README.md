# 🏆 [EQUIPE RAIZ] - Hackathon APONTI Academy 2026 

> **Desafio:** Antena na Lama (REC'n'Play 2026)
> **Caminho escolhido:** Alertar e proteger

**RAIZ — Rede de Alerta e Inclusão nas Zonas de risco.** O morador mostra o sinal de risco e ouve o que fazer; a liderança comunitária sabe qual casa visitar primeiro.

## 📖 Sobre o Projeto
Em áreas de risco da Região Metropolitana do Recife, o alerta oficial chega igual para todos e não alcança bem quem não lê, não ouve, não tem celular ou não consegue sair de casa sozinho. Os sinais de perigo vistos na rua (lona rasgada, rachadura, água de barro descendo, lixo no canal) raramente viram aviso a tempo, e a liderança comunitária não tem uma lista de quem precisa de ajuda primeiro.

O RAIZ tem dois lados. O **morador**, sem senha e sem instalar nada, tira uma foto, fala ou toca no desenho do sinal: a IA reconhece o sinal e o app lê em voz alta a orientação oficial daquele sinal. Ele pode avisar a liderança (identificando-se com selfie ou CPF) e pedir o cadastro dele ou de alguém da casa. A **liderança** cadastra as residências e seus moradores (pessoa idosa, gestante, criança, acamada, com dificuldade para entender, "Outro"…), vê no mapa as áreas de risco R1–R4, recebe sinais e pedidos, e o painel ordena as casas para visita pelo risco da área, por quem mora nelas e por sinais recentes. A IA também adapta o aviso oficial ao canal de cada pessoa (visita, áudio, texto fácil, Libras, ligação) e deixa avisos da liderança em linguagem simples.

Limites assumidos: o app **não** prevê desastre, não emite alerta oficial, não indica rota nem diz que um lugar é "seguro". A orientação ao morador é sempre um texto fixo; a IA só escolhe qual. O impacto em vidas ainda não foi medido.

## 👥 Equipe
*   **Desenvolvedores:**
    *   [Emerson Júnior] - [Back-End]
    *   [Matheus Alves] - [Front-End]
    *   [Lytuanne Buarque] - [Dados]
    *   [Luiz Martins ] - [Devops]
*   **Validadora (Movimento Pró-Criança):**
    *   [Tayza Kevinlyn ]

## 🚀 Tecnologias Utilizadas
*   **Front-end:** Next.js 14 (App Router) + React 18 + TypeScript, Tailwind CSS (utilitários) + design system RAIZ (tokens CSS), Web Speech API (voz e ditado), PWA mobile-first
*   **Back-end:** Node.js 22 + Express 5 + TypeScript, Zod (validação), Helmet, rate limit; IA: Claude (Anthropic) multimodal com saída JSON
*   **Banco de Dados:** Supabase (Postgres + Auth + Realtime) com Row Level Security por comunidade. Sem Supabase configurado, o app roda em **modo demonstração** (dados fictícios no navegador)
*   **Deploy:** Vercel (front) / Render (API) / Supabase (banco)
*   **Testes:** Vitest + Supertest (backend: rotas de IA e guardas; frontend: regras de domínio)

## 🗂️ Organização do código
```
frontend/                 Next.js (telas)
  src/app/                rotas: / (entrada), /ajustes, /morador, /pedido, /conta, /lideranca, /lideranca/cadastro
  src/components/         cabeçalho, mapa, avisos, cartões da liderança, campos (CPF, selfie, foto, ditado)
  src/domain/             regras puras e testadas: catálogo (sinais, dificuldades, áreas), prioridade de visita, CPF
  src/data/               contrato de dados + implementações memória (demo) e Supabase; comunidade de exemplo
  src/lib/                cliente da API de IA, voz, imagem, preferências de acessibilidade
  src/styles/             design system RAIZ (tokens claro/escuro/alto contraste) + estilos das telas
backend/                  API Express: funções de IA protegidas no servidor
  src/rotas/ia.ts         POST /api/ia/sinal · /cadastro · /mensagem · /aviso
  src/ia/                 prompts, guardas (CPF fora da IA, palavras proibidas, dados cercados), cliente do modelo
supabase/migrations/      tabelas e políticas RLS
docs/                     arquitetura, segurança e LGPD
```

## 🤖 Uso Ético de IA (Obrigatório pelo Edital)
*   **Onde a IA foi usada no produto:** (1) foto/texto do morador → uma chave de uma lista fechada de 7 sinais; (2) relato livre da liderança → campos do cadastro, sempre conferidos por uma pessoa antes de salvar; (3) aviso oficial → mensagem no canal da pessoa; (4) aviso da liderança → linguagem simples.
*   **Onde a IA foi usada no desenvolvimento:** Claude (Anthropic) ajudou na pesquisa, no protótipo, na interface, na organização deste código (front, API, SQL) e nos testes.
*   **O que foi corrigido/validado:** a orientação ao morador saiu da IA e virou texto fixo por sinal; a resposta do modelo é validada (chave fora da lista ou confiança baixa = "não deu para ter certeza, escolha pelo desenho"); CPF é retirado antes de qualquer chamada ao modelo; respostas com "seguro", "sem risco" ou "rota" são descartadas e volta o texto oficial; doença citada no relato não é guardada (só a dificuldade prática); a chave do modelo fica só no servidor; [descrever aqui o que a equipe revisou/corrigiu à mão].
*   **Ferramentas usadas:** Claude (Anthropic), [outras].

## 🛠️ Como rodar o projeto localmente
### Pré-requisitos
Node.js 22.12+ · (opcional) chave da API da Anthropic · (opcional) projeto no Supabase

### Back-end
```bash
cd backend
cp .env.example .env      # coloque ANTHROPIC_API_KEY (sem ela a IA responde 503 e o app usa o modo manual)
npm install
npm run dev               # http://localhost:4000/api/saude
```

### Front-end
```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000 ; Supabase opcional
npm install
npm run dev                  # http://localhost:3000
```
Demonstração rápida (sem Supabase): entre como liderança em **“Usar conta de exemplo”** (telefone 81 9 0000-0000, PIN 123456) e toque em **“Carregar comunidade de exemplo”**. Todos os dados são fictícios e ficam no navegador.

### Banco (opcional)
Crie um projeto no Supabase, rode `supabase/migrations/0001_raiz.sql` no SQL Editor, ative *Anonymous sign-ins* e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 🌐 Deploy Público
Link do Front-end: http://frontend-alpha-lac-21.vercel.app/

Link da API (Back-end): [Cole o link do Render]

## 🧪 Testes Automatizados
15 testes rodando no CI (GitHub Actions):
```bash
cd backend && npm test    # 7 testes: lista fechada de sinais, CPF fora da IA, fallback sem "seguro", IA desligada (503), validação
cd frontend && npm test   # 8 testes: CPF, palavras proibidas, residências, ordem de visita, filtros
```
