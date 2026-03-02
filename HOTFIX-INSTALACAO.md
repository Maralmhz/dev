# 🐛 Hotfix: Contador de Sessões + Logo no PDF

## ✅ Bugs Corrigidos

1. **Contador de sessões sempre mostrava 1/2** → Agora mostra valor correto (0/2, 1/2, 2/2)
2. **Logo não aparecia no PDF** → Agora converte para base64 automaticamente

---

## 📦 Arquivos Modificados

```
hotfix/contador-e-logo-pdf/
├── sidebar-menu.js          (✏️ Modificado)
├── pdf-logo-fix.js          (✨ Novo)
└── HOTFIX-INSTALACAO.md     (📝 Documentação)
```

---

## 🚀 Instalação Rápida

### Opção 1: Merge Automático (Recomendado)

```bash
git fetch origin
git checkout main
git merge hotfix/contador-e-logo-pdf
git push origin main
```

### Opção 2: Via Pull Request

1. Acesse: [https://github.com/Maralmhz/dev/pull/15](https://github.com/Maralmhz/dev/pull/15)
2. Clique em **"Merge pull request"**
3. Confirme o merge
4. Pronto! 🎉

---

## ⚠️ Passo Adicional: Carregar pdf-logo-fix.js

Após o merge, adicione o novo módulo ao carregamento em `app.html`:

### Localizar linha ~850:

```javascript
const scripts = [
  "auth-guard.js", "oficina-guard.js", "firestore-wrapper.js",
  "app.js", "core_utils.js", "firebase.js", "checklist.js",
  // ...
];
```

### Adicionar pdf-logo-fix.js:

```javascript
const scripts = [
  "auth-guard.js", "oficina-guard.js", "firestore-wrapper.js",
  "pdf-logo-fix.js", // 🆕 ADICIONAR ESTA LINHA
  "app.js", "core_utils.js", "firebase.js", "checklist.js",
  // ...
];
```

### Salvar e fazer commit:

```bash
git add app.html
git commit -m "✨ Adicionar pdf-logo-fix.js ao carregamento"
git push origin main
```

---

## 🧪 Testes

### 1. Testar Contador de Sessões

```bash
# Passo 1: Fazer logout
# Passo 2: Fazer login
# Passo 3: Abrir sidebar (botão hambúrguer)
# Passo 4: Verificar badge "Dispositivos Ativos"
# Resultado esperado: 1/2 (laranja)

# Passo 5: Abrir aba anônima e fazer login novamente
# Passo 6: Verificar badge novamente
# Resultado esperado: 2/2 (vermelho)
```

### 2. Testar Logo no PDF

```bash
# Passo 1: Criar um checklist completo
# Passo 2: Ir para aba "Resumo"
# Passo 3: Clicar em "Baixar PDF"
# Passo 4: Abrir PDF gerado
# Resultado esperado: Logo visível no cabeçalho
```

### 3. Verificar Carregamento

Abra o console (F12) e verifique:

```javascript
// Deve retornar um objeto:
console.log(window.PDFLogoFix);

// Deve mostrar: ✅ PDF Logo Fix carregado
```

---

## 🔧 Troubleshooting

### Problema: "PDFLogoFix is not defined"

**Causa:** `pdf-logo-fix.js` não foi carregado

**Solução:**
1. Verificar se `pdf-logo-fix.js` está na lista de scripts em `app.html`
2. Limpar cache do navegador (Ctrl+Shift+Del)
3. Recarregar página com Ctrl+F5

---

### Problema: Contador ainda mostra 1/2

**Causa:** Cache de sessão antiga

**Solução:**
```javascript
// No console (F12):
// 1. Limpar sessões antigas
const user = firebase.auth().currentUser;
if (user) {
  const email = user.email.replace(/[.@]/g, '_');
  firebase.database().ref(`sessions/${email}`).remove();
}

// 2. Fazer logout e login novamente
firebase.auth().signOut();
window.location.href = 'index.html';
```

---

### Problema: Logo ainda não aparece no PDF

**Causa:** CORS ou logo não carregou

**Solução Temporária - Usar Base64 direto:**

1. Converter logo para base64: https://www.base64-image.de/
2. Copiar resultado (ex: `data:image/png;base64,iVBORw0KG...`)
3. Adicionar em `config.js`:

```javascript
window.OFICINA_CONFIG = {
  oficinaId: "sua-oficina-123",
  nome: "Minha Oficina",
  logo: "data:image/png;base64,iVBORw0KG...", // 👈 Cole aqui
  // ...
};
```

---

## 📊 Resultados Esperados

### Antes do Hotfix:
- ❌ Contador: Sempre `1` (incorreto)
- ❌ Badge formato: `1` (sem `/2`)
- ❌ PDF: Logo invisível

### Depois do Hotfix:
- ✅ Contador: `0`, `1` ou `2` (correto)
- ✅ Badge formato: `X/2` (ex: `1/2`)
- ✅ Cor dinâmica: Verde, Laranja ou Vermelho
- ✅ PDF: Logo visível

---

## 📩 Suporte

Se precisar de ajuda:

1. Verificar logs no console (F12)
2. Enviar screenshot do erro
3. Informar:
   - Build atual: `window.__GESTAO_V2_BUILD__`
   - Módulos carregados: `window.__modulosStatus`

**Contato:** Hallz Branding - 3199676-6963

---

**Build:** v3.7-hotfix  
**Data:** 01/03/2026  
✅ Testado e aprovado