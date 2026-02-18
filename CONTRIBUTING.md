# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o projeto! Este documento contém diretrizes para ajudá-lo a contribuir de forma eficaz.

## 🐛 Como Reportar Bugs

Antes de reportar um bug, verifique se ele já não foi reportado nas [Issues](https://github.com/Maralmhz/dev/issues).

### Template para Bug Report

```markdown
**Descrição do Bug**
Uma descrição clara e concisa do bug.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente**
- Navegador: [ex: Chrome 120]
- Sistema Operacional: [ex: Windows 11]
- Versão do Sistema: [ex: 3.1]

**Informações Adicionais**
Qualquer outra informação relevante.
```

## ✨ Como Sugerir Melhorias

Sugestões são sempre bem-vindas! Abra uma Issue com o label `enhancement`.

### Template para Feature Request

```markdown
**Problema que a Feature Resolve**
Descreva o problema que você está tentando resolver.

**Solução Proposta**
Descreva a solução que você gostaria.

**Alternativas Consideradas**
Alternativas que você já considerou.

**Contexto Adicional**
Qualquer outro contexto ou screenshots.
```

## 🛠️ Processo de Desenvolvimento

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU_USUARIO/dev.git
cd dev

# Adicione o repositório original como upstream
git remote add upstream https://github.com/Maralmhz/dev.git
```

### 2. Crie uma Branch

```bash
# Atualize sua main
git checkout main
git pull upstream main

# Crie uma branch para sua feature
git checkout -b feature/minha-feature
# ou para bugfix
git checkout -b fix/meu-bugfix
```

### 3. Faça suas Alterações

- Escreva código limpo e bem documentado
- Siga as convenções de estilo do projeto
- Teste suas alterações em diferentes navegadores
- Mantenha commits pequenos e focados

### 4. Commit suas Alterações

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Exemplos de commits:
git commit -m "feat: adicionar exportação para Excel"
git commit -m "fix: corrigir cálculo de totais no orçamento"
git commit -m "docs: atualizar README com novas instruções"
git commit -m "style: formatar código com Prettier"
git commit -m "refactor: reorganizar funções de fotos"
git commit -m "test: adicionar testes para validação de placa"
```

**Tipos de commit:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, ponto e vírgula, etc
- `refactor`: Refatoração de código
- `test`: Adição de testes
- `chore`: Atualizações de build, configurações, etc

### 5. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/minha-feature
```

Depois:
1. Vá para o repositório no GitHub
2. Clique em "Compare & pull request"
3. Preencha o template do PR
4. Aguarde a revisão

## 📝 Padrões de Código

### JavaScript

```javascript
// Use nomes descritivos
function calcularTotalOrcamento(itens) {
    return itens.reduce((total, item) => total + item.valor, 0);
}

// Comente código complexo
// Calcula o total considerando descontos progressivos
function calcularComDesconto(valor, quantidadeItens) {
    const desconto = quantidadeItens > 10 ? 0.1 : 0;
    return valor * (1 - desconto);
}

// Use const/let ao invés de var
const LIMITE_FOTOS = 15;
let fotosVeiculo = [];
```

### HTML

```html
<!-- Use IDs descritivos -->
<div id="secaoOrcamento" class="content">
    <h2 class="section-title">Orçamento</h2>
    <!-- Conteúdo -->
</div>

<!-- Acessibilidade -->
<label for="placaVeiculo">Placa do Veículo</label>
<input type="text" id="placaVeiculo" name="placa" required>
```

### CSS

```css
/* Use variáveis CSS */
:root {
    --color-primary: #c32421;
    --color-secondary: #333;
}

/* Organize por seções */
/* =========================
   Header Styles
   ========================= */
.header {
    background: var(--color-primary);
}
```

## ✅ Checklist antes do Pull Request

- [ ] O código funciona em Chrome, Firefox e Safari?
- [ ] O código funciona em mobile?
- [ ] Testei a funcionalidade offline?
- [ ] Removi console.logs de debug?
- [ ] Atualizei a documentação se necessário?
- [ ] Segui as convenções de commit?
- [ ] Não adicionei credenciais ou tokens?

## 💬 Comunicação

- Use as Issues para discussões técnicas
- Seja respeitoso e construtivo
- Se não tiver certeza, pergunte!

## 🎯 Prioridades do Projeto

Características mais importantes:
1. **Performance**: O sistema deve ser rápido
2. **Usabilidade**: Interface intuitiva para mecânicos
3. **Confiabilidade**: Dados não podem ser perdidos
4. **Offline-first**: Funcionar sem internet
5. **Mobile-friendly**: Funcionar bem em celulares

## 🛡️ Segurança

Se você descobrir uma vulnerabilidade de segurança:

1. **NÃO** abra uma issue pública
2. Envie um email para: maralmhz@gmail.com
3. Descreva a vulnerabilidade em detalhes
4. Aguarde resposta antes de divulgar

## 📚 Recursos Úteis

- [JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

## ❓ Dúvidas?

Não hesite em abrir uma Issue com a tag `question` ou entrar em contato!

---

**Obrigado por contribuir! 🚀**
