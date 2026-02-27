# Guia de Implementação - Gestão Oficina V2 (Fase 1)

## Arquivos adicionados

1. `gestao_oficina_v2.js` - Camada visual moderna, cards aprimorados, acompanhamento e clientes atrasados.
2. `gestao_oficina_agendamentos.js` - Calendário diário, modal de agendamento com validações e lembretes automáticos.
3. `gestao_oficina_financeiro.js` - Modelo financeiro completo, painel de indicadores e modal em etapas.
4. `gestao_oficina_v2.css` - Novo design system (cores, tipografia, sombras, espaçamento e responsividade).

## Estratégia de migração gradual

- O código atual (`gestao_oficina.js`) permanece ativo.
- Os módulos novos atuam como **camada incremental** sobre o sistema existente.
- Toda persistência continua usando `localStorage` e funções globais atuais (`carregarOS`, `salvarOS`, `renderizarVisao`).

## Como integrar

1. Incluir o CSS novo após `gestao_oficina.css` para sobrescrever estilos sem quebrar legado.
2. Incluir os scripts novos após `gestao_oficina.js`.
3. Validar no fluxo:
   - Criar OS na tela atual.
   - Abrir painel de Gestão e conferir cards V2.
   - Abrir calendário e criar agendamento.
   - Abrir financeiro e salvar valores.

## Compatibilidade e fallback

- Se alguma função global não existir, os módulos falham de forma segura.
- Caso deseje desativar temporariamente, basta remover os `<script>` e `<link>` dos novos arquivos.

## Próxima fase (Firebase)

- Mapear o objeto `financeiro` e flags de lembrete para Firestore.
- Reutilizar validações de agendamento no backend (Cloud Functions).
- Substituir `window.open` de relatório por geração de PDF no servidor.

## Rollout em produção (novo PR)

Como alguns ambientes estavam servindo cache antigo, siga este checklist após merge/deploy:

1. Confirmar versão dos assets V2 no `index.html` (`gestao_oficina_v2.css/js`, `gestao_oficina_agendamentos.js`, `gestao_oficina_financeiro.js`, `gestao_oficina_recibos.js`).
2. Forçar hard refresh no navegador (Ctrl+F5) e limpar cache de CDN, se houver.
3. Abrir aba **Gestão Oficina** e validar que as seções aparecem:
   - Calendário (Dia/Semana/Mês/Ano)
   - Financeiro
   - Clientes atrasados / veículos na oficina
4. No console, se necessário, executar `window.ativarGestaoV2?.()` para diagnóstico rápido de inicialização.

## Checklist rápido de validação funcional

- Criar agendamento e verificar conflito/horário ocupado.
- Salvar financeiro de uma OS e recarregar página para confirmar persistência.
- Gerar recibo e relatório financeiro.
- Verificar lembretes automáticos (janelas 48h/24h/2h) em ambiente de teste.


## Quando o Codex falhar ao criar/atualizar PR

Se aparecer a mensagem de limitação do Codex para PR alterado fora dele, use este fluxo:

1. Criar um **novo commit** com o ajuste pendente (mesmo que pequeno e objetivo).
2. Solicitar explicitamente: **"crie um novo PR"**.
3. Publicar esse novo PR e desconsiderar o PR anterior bloqueado.
4. No deploy, validar cache/versionamento dos assets V2 para não servir código antigo.

> Dica: manter `?v=` dos assets atualizado em `index.html` reduz bastante falso-positivo de "voltou para versão antiga".

## Controle de PR (separado)

- Este arquivo inclui esta nota para registrar que ajustes de rollout da Gestão V2 podem ser publicados em **PR separado**, sem reaproveitar PR alterado externamente.
- Em caso de bloqueio de atualização pelo Codex, seguir: novo commit -> novo PR -> deploy.

