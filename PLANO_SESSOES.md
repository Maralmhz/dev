# 💰 SISTEMA DE SESSÕES E COBRANÇA

## 🎯 OBJETIVO

Implementar sistema de limite de sessões simultâneas com modelo de cobrança:
- **2 dispositivos grátis** (padrão)
- **R$ 30,00 por dispositivo adicional**

---

## ✅ JÁ IMPLEMENTADO

### 1. **Session Manager** (`session-manager.js`)

**Funcionalidades:**
- ✅ Rastreamento de sessões ativas por dispositivo
- ✅ Geração de Device ID único
- ✅ Heartbeat (atualização a cada 30s)
- ✅ Limpeza automática de sessões expiradas (5 min)
- ✅ Remoção ao desconectar (onDisconnect)
- ✅ Verificação de limite antes do login
- ✅ Atualização de limites (upgrade)

**Métodos principais:**
```javascript
// Verifica se pode logar
await sessionManager.checkSessionLimit(email);

// Registra sessão ativa
await sessionManager.registerSession(email);

// Lista sessões ativas
await sessionManager.getActiveSessions(email);

// Remove sessão específica
await sessionManager.removeSession(email, deviceId);

// Limpa sessão ao fazer logout
await sessionManager.cleanup(email);

// Atualiza limite (upgrade)
await sessionManager.updateSessionLimit(email, 3);
```

### 2. **Login Integrado** (`login.js`)

- ✅ Valida limite ANTES de autenticar
- ✅ Bloqueia login se exceder limite
- ✅ Mostra mensagem de upgrade
- ✅ Registra sessão após login bem-sucedido

### 3. **Logout com Limpeza** (`logout.js`)

- ✅ Remove sessão ao fazer logout
- ✅ Limpa heartbeat interval
- ✅ Limpa localStorage

---

## 🔥 ESTRUTURA NO FIREBASE

```
firebase-database/
├── sessions/
│   └── usuario_email_com/
│       ├── device_123456/
│       │   ├── browser: "Chrome/Windows"
│       │   ├── platform: "Win32"
│       │   ├── timestamp: 1709140800000
│       │   └── lastActive: 1709140830000
│       └── device_789012/
│           ├── browser: "Safari/iOS"
│           └── ...
├── users/
│   └── usuario_email_com/
│       ├── config/
│       │   ├── maxSessions: 2
│       │   └── updatedAt: 1709140800000
│       └── plano: "basico"
```

---

## 🛒 FLUXO DE COBRANÇA

### Cenário 1: Usuário com 2 devices (Grátis)

1. Usuário loga no **Notebook** ✅
2. Usuário loga no **Celular** ✅
3. Usuário tenta logar no **Tablet** ❌
   - **Bloqueado!**
   - Mensagem: "Limite atingido. Deslogue ou faça upgrade"

### Cenário 2: Upgrade para 3+ devices

1. Usuário entra em **contato**
2. Paga **R$ 30,00** por dispositivo adicional
3. Admin atualiza no Firebase:
```javascript
await sessionManager.updateSessionLimit('usuario@email.com', 3);
```
4. Usuário pode logar no 3º dispositivo ✅

---

## 👨‍💻 DASHBOARD ADMIN (A FAZER)

Para gerenciar sessões e upgrades, criar:

### Página: `admin-sessions.html`

**Funcionalidades:**
- 📊 Lista todos os usuários e sessões ativas
- 🔧 Forçar logout de dispositivos específicos
- ⬆️ Atualizar limite de sessões
- 💳 Registrar pagamentos
- 📈 Estatísticas de uso

**Código exemplo:**
```javascript
// Listar usuários
const usersRef = firebase.database().ref('sessions');
usersRef.on('value', (snapshot) => {
    const users = snapshot.val();
    // Renderizar tabela
});

// Forçar logout
async function forceLogout(email, deviceId) {
    await sessionManager.removeSession(email, deviceId);
}

// Upgrade
async function upgradeUser(email, newLimit) {
    await sessionManager.updateSessionLimit(email, newLimit);
}
```

---

## 💳 INTEGRAÇÃO DE PAGAMENTO (A FAZER)

### Opções:

1. **Mercado Pago** (Recomendado para Brasil)
2. **Stripe** (Internacional)
3. **PagSeguro** (Nacional)
4. **Pix Manual** (Confirmação por WhatsApp)

### Fluxo Pix Manual:

1. Usuário solicita upgrade
2. Sistema gera **QR Code Pix** de R$ 30
3. Usuário paga e envia comprovante
4. Admin confirma e libera slot

---

## 🛡️ SEGURANÇA

### Regras do Firebase Database:

```json
{
  "rules": {
    "sessions": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "users": {
      "$userId": {
        "config": {
          ".read": "auth != null && auth.uid == $userId",
          ".write": false  // Apenas admin pode alterar
        }
      }
    }
  }
}
```

---

## 📝 PRÓXIMOS PASSOS

### Curto Prazo:
- [ ] Criar página de gerenciamento de sessões para usuário
- [ ] Mostrar dispositivos ativos com opção de deslogar remotamente
- [ ] Notificação quando alguém tenta logar no 3º dispositivo

### Médio Prazo:
- [ ] Dashboard admin completo
- [ ] Sistema de pagamento automatizado
- [ ] Histórico de logins
- [ ] Alertas de segurança (login em novo dispositivo)

### Longo Prazo:
- [ ] Planos mensais (ex: R$ 50/mês para dispositivos ilimitados)
- [ ] Sistema de convites (compartilhar acesso)
- [ ] Logs de auditoria

---

## 🔧 TESTES

### Testar Limite:

1. Abra o site em 2 navegadores diferentes
2. Faça login nos dois ✅
3. Tente logar em um 3º navegador ❌
4. Deve bloquear com mensagem de upgrade

### Testar Logout:

1. Faça login
2. Clique em "Sair"
3. Verifique no Firebase Database se a sessão foi removida

### Testar Expiração:

1. Faça login
2. Feche o navegador sem fazer logout
3. Aguarde 5 minutos
4. Sessão deve ser marcada como expirada

---

## ❓ FAQ

**P: O que acontece se o usuário simplesmente fechar o navegador?**
**R:** A sessão é removida automaticamente via `onDisconnect()` do Firebase.

**P: E se o dispositivo ficar sem internet?**
**R:** Após 5 minutos sem heartbeat, a sessão é marcada como expirada.

**P: Como o admin libera mais dispositivos?**
**R:** Usando a função: `sessionManager.updateSessionLimit(email, 3)`

**P: O limite é por conta ou por usuário?**
**R:** Por conta de email (usuário).

---

✅ **Sistema de sessões implementado e funcional!**
👥 **Contato para upgrade:** WhatsApp no rodapé do site