# 🚪 INSTRUÇÕES PARA ADICIONAR LOGOUT

## 📌 Arquivos criados:
- `logout.js` - Função de logout
- `logout-style.css` - Estilos do botão

---

## ✅ PASSO 1: Adicionar no HTML (sistema.html ou index.html principal)

### No `<head>`, adicione o CSS:
```html
<link rel="stylesheet" href="logout-style.css">
```

### Antes de fechar `</body>`, adicione o JS:
```html
<script src="logout.js"></script>
```

---

## ✅ PASSO 2: Adicionar botão no HEADER

Procure a seção do header onde tem o status "Online". Adicione logo após:

```html
<div class="status-sync">
    <div class="sync-dot" id="syncStatus"></div>
    <span id="syncText">Online</span>
</div>

<!-- 🔴 ADICIONAR AQUI: -->
<div class="user-info-container">
    <div class="user-email-badge">
        <span id="userEmail">Carregando...</span>
    </div>
    <button class="btn-logout" onclick="fazerLogout()">
        Sair
    </button>
</div>
```

---

## 🎯 LOCALIZAÇÃO EXATA

Procure no seu HTML essa parte:
```html
<div class="header-content">
    <h1 id="nome-oficina">OFICINA</h1>
    <p id="subtitulo-oficina">Checklist de entrada e inspeção veicular</p>
    <div class="contato-info">
        <img src="..." alt="WhatsApp" class="whatsapp-icon">
        <span id="telefone-oficina">(00) 00000-0000</span>
    </div>
    
    <div class="status-sync">
        <div class="sync-dot" id="syncStatus"></div>
        <span id="syncText">Online</span>
    </div>
    
    <!-- ⬇️ COLE AQUI EMBAIXO: -->
    <div class="user-info-container">
        <div class="user-email-badge">
            <span id="userEmail">Carregando...</span>
        </div>
        <button class="btn-logout" onclick="fazerLogout()">
            Sair
        </button>
    </div>
    <!-- ⬆️ ATÉ AQUI -->
    
</div>
```

---

## 🚀 COMO FUNCIONA

1. **Exibe o email do usuário logado** automaticamente
2. **Botão "Sair"** com confirmação
3. **Faz logout do Firebase** e redireciona pro login
4. **Limpa o localStorage**
5. **Visual bonito** com gradiente vermelho

---

## 📱 VISUAL

**Desktop:**
```
[Status: Online] [👤 usuario@email.com] [🚪 Sair]
```

**Mobile:**
```
[Status: Online]
[👤 usuario@email.com]
[🚪 Sair]
```

---

## ⚙️ CUSTOMIZAÇÃO

Para mudar as cores do botão, edite no `logout-style.css`:

```css
.btn-logout {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    /* Mude para suas cores aqui */
}
```

---

## ❓ DÚVIDAS

Se tiver algum problema:
1. Verifique se os arquivos `.js` e `.css` foram adicionados
2. Verifique se o Firebase Auth está inicializado
3. Abra o Console do navegador (F12) para ver erros

---

✅ **Pronto! O sistema de logout está implementado.**