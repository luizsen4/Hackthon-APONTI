# Como contribuir

## Fluxo
1. Crie uma branch a partir da `main`: `feat/…`, `fix/…`, `docs/…` ou `chore/…`.
2. Faça commits pequenos no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português:
   `feat(web): adiciona status do cadastro no painel do morador`
3. Rode os testes antes de abrir o PR:
   ```bash
   cd backend && npm test && npm run build
   cd frontend && npm test && npm run build
   ```
4. Abra um Pull Request para a `main` preenchendo o modelo. O CI precisa passar.
5. Peça revisão de pelo menos uma pessoa da equipe. Prefira **Squash and merge**.

## Escopos usados nos commits
`web` (front-end) · `api` (back-end) · `db` (Supabase) · `ci` · `docs`

## Regras do produto (não negociáveis)
- O app nunca diz que um lugar é "seguro", nunca indica rota e não emite alerta oficial.
- A orientação ao morador é sempre o texto fixo do catálogo; a IA só escolhe a chave.
- CPF nunca vai para a IA. Foto do rosto só com consentimento separado.
- Dados de demonstração são sempre fictícios e identificados como tais.
- Nunca suba chaves ou senhas: use `.env` (já ignorado) e os `.env.example`.
