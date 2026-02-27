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
