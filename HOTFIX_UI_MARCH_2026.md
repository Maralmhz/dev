# Hotfixes UI - Março 2026

## Resumo
Este branch contém correções para 5 problemas críticos de UI identificados em 04/03/2026.

## Problemas Corrigidos

### 🎨 Issue #25: Fundo do Login Roxo
**Arquivo:** `login.html`
- **Problema:** Tela de login com gradiente roxo/rosa animado
- **Solução:** Alterado para fundo preto sólido (#000000)
- **Linhas alteradas:** 24-30

### ❌ Issue #26: Botões Não Solicitados
**Arquivo:** `ui-fixes.css` (novo)
- **Problema:** Botões "Cancelar", "Adicionar itens" e "Enviar PDF" aparecendo abaixo do rodapé
- **Solução:** CSS para ocultar `.mobile-action-bar` e elementos relacionados
- **Aplicação:** Adicionar `<link rel="stylesheet" href="ui-fixes.css">` no `<head>` do `app.html`

### 📅 Issue #27: Data e Hora Não Preenchem Automaticamente
**Arquivo:** `auto-datetime.js` (novo)
- **Problema:** Campos `#data` e `#hora` não preenchiam automaticamente
- **Solução:** Script que preenche os campos ao carregar a página
- **Aplicação:** Adicionar `<script src="auto-datetime.js"></script>` antes do fechamento do `</body>` no `app.html`

### 📏 Issue #28: Campos Reduzidos
**Arquivo:** `ui-fixes.css` (novo)
- **Problema:** Campos de formulário ocupando apenas 50% da largura
- **Solução:** CSS com `!important` forçando largura 100% nos `.form-group` e `.form-row`
- **Aplicação:** Mesmo arquivo do Issue #26

### 🚫 Issue #29: Abas e Menu Não Funcionam
**Arquivo:** `fix-tabs-menu.js` (novo)
- **Problema:** Abas e menu hamburguer não respondiam aos cliques
- **Solução:** 
  - Reimplementa `switchTab()` global
  - Corrige event listeners
  - Remove CSS bloqueador (`pointer-events: none`)
  - Adiciona listeners ao menu hamburguer
- **Aplicação:** Adicionar `<script src="fix-tabs-menu.js"></script>` antes do fechamento do `</body>` no `app.html`

---

## 🛠️ Como Aplicar as Correções

### Opção 1: Merge do Branch (Recomendado)
```bash
git checkout main
git merge fix/ui-issues-march-2026
git push origin main
```

### Opção 2: Aplicação Manual

#### 1. Atualizar `login.html`
Substituir o arquivo completo pela versão corrigida ou alterar apenas as linhas 24-30:
```css
/* Antes */
.background {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
}

/* Depois */
.background {
    background: #000000;
}
```

#### 2. Adicionar novos arquivos
Copiar para o diretório raiz:
- `ui-fixes.css`
- `auto-datetime.js`
- `fix-tabs-menu.js`

#### 3. Modificar `app.html`

**No `<head>`, adicionar:**
```html
<link rel="stylesheet" href="ui-fixes.css?v=1.0">
```

**Antes do `</body>`, adicionar:**
```html
<script src="auto-datetime.js?v=1.0"></script>
<script src="fix-tabs-menu.js?v=1.0"></script>
```

**Localização sugerida:**
- CSS: Após a linha `<link rel="stylesheet" href="sidebar-menu.css?v=1.1">`
- Scripts: Após a linha `<script src="gestao_oficina_plano.js"></script>`

---

## ✅ Testes Necessários

Após aplicar as correções, testar:

1. **Login:**
   - [ ] Fundo deve estar preto
   - [ ] Partículas brancas devem estar visíveis

2. **Sistema Principal:**
   - [ ] Não devem aparecer botões abaixo do rodapé
   - [ ] Campos de data e hora devem preencher automaticamente
   - [ ] Campos devem ocupar toda a largura disponível
   - [ ] Clicar nas abas deve trocar o conteúdo
   - [ ] Menu hamburguer deve abrir/fechar o menu lateral

3. **Mobile:**
   - [ ] Campos devem ser responsivos (100% em mobile)
   - [ ] Botões não solicitados não devem aparecer

---

## 🐛 Issues Relacionados

- [#25](https://github.com/Maralmhz/dev/issues/25) - Login com fundo roxo
- [#26](https://github.com/Maralmhz/dev/issues/26) - Botões não solicitados
- [#27](https://github.com/Maralmhz/dev/issues/27) - Data/hora não preenchem
- [#28](https://github.com/Maralmhz/dev/issues/28) - Campos reduzidos
- [#29](https://github.com/Maralmhz/dev/issues/29) - Abas e menu não funcionam

---

## 📝 Commits

- `e229945` - fix: alterar fundo do login de roxo para preto (#25)
- `2032fe7` - feat: adicionar preenchimento automático de data e hora (#27)
- `5a8b7f4` - fix: ocultar botões não solicitados e corrigir largura dos campos (#26 #28)
- `1ba1d46` - fix: corrigir funcionalidade de abas e menu hamburguer (#29)

---

## 📞 Contato

Em caso de dúvidas ou problemas:
- Abrir uma issue no repositório
- Contatar o desenvolvedor responsável

---

**Data:** 04 de março de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para merge