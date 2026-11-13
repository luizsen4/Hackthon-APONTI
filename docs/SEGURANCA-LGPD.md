# Segurança e LGPD

- **Base legal:** cadastro com consentimento lido em voz alta e registrado (LGPD art. 11, I); repasse à Defesa Civil em emergência (art. 11, II, “e”). Revisão do cadastro a cada 6 meses.
- **Dados mínimos:** dificuldade prática, não doença. CPF opcional, validado, mascarado no painel e **nunca enviado à IA**.
- **Foto do rosto** é dado biométrico: só com um “sim” separado. Fotos ficam em tabela própria.
- **Acesso:** RLS no Postgres; a liderança só vê a própria comunidade; o morador só vê o próprio pedido; avisos e estado de alerta são públicos.
- **IA:** chave só no servidor; entrada e saída validadas; conteúdo do usuário cercado como dados; respostas fora das regras são descartadas.
- **Demonstração:** apenas dados fictícios, identificados como tais na tela.
