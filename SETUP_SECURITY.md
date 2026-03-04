# 🔒 GUIA DE SETUP - CUSTOM CLAIMS + SECURITY RULES

## 🎯 OBJETIVO
Implementar isolamento multi-tenant real com Custom Claims e Firestore Security Rules.

---

## 👣 PASSO 1: DEPLOY DAS CLOUD FUNCTIONS

### 1.1 Instalar dependências
```bash
cd functions
npm install
```

### 1.2 Deploy
```bash
firebase deploy --only functions
```

### 1.3 Verificar deploy
```bash
firebase functions:log
```

**Funções deployadas:**
- `setUserOficinaClaim` - Setar claims manualmente
- `getUserClaims` - Debug de claims
- `onUserCreate` - Auto-assign ao criar usuário
- `migrateExistingUsers` - Migrar usuários existentes

---

## 🔥 PASSO 2: DEPLOY DAS SECURITY RULES

```bash
firebase deploy --only firestore:rules
```

### 2.1 Testar rules
```bash
firebase emulators:start --only firestore
```

---

## 👥 PASSO 3: MIGRAR USUÁRIOS EXISTENTES

### 3.1 No console do navegador:
```javascript
// 1. Fazer login como admin
await firebase.auth().signInWithEmailAndPassword('admin@email.com', 'senha');

// 2. Setar claims de admin primeiro
await authClaimsManager.setOficinaClaims(
  firebase.auth().currentUser.uid,
  'modelo',
  'admin'
);

// 3. Forçar refresh
await firebase.auth().currentUser.getIdToken(true);

// 4. Verificar
await authClaimsManager.debugClaims();

// 5. Migrar todos os usuários
await authClaimsManager.migrateExistingUsers('modelo');
```

---

## ✅ PASSO 4: VALIDAR SETUP

### 4.1 Testar claims de um usuário
```javascript
// No console após login
await authClaimsManager.debugClaims();

// Deve aparecer:
// 🏢 Oficina ID: modelo
// 🔑 Role: user (ou admin)
```

### 4.2 Testar isolamento
```javascript
// Tentar acessar outra oficina (deve falhar)
const doc = await firebase.firestore()
  .collection('oficinas')
  .doc('outra_oficina')
  .get();

// Erro esperado: Missing or insufficient permissions
```

### 4.3 Testar transações
```javascript
// Criar OS e ver estoque baixar atomicamente
const resultado = await osManager.criarOS({
  cliente_id: 'xxx',
  veiculo_id: 'yyy',
  pecas: [
    { peca_id: 'zzz', quantidade: 2, nome: 'Oleo', valor: 50 }
  ]
});

console.log(resultado);
// success: true
// operacao_id: "criar_os_..."
```

### 4.4 Testar proteção contra clique duplo
```javascript
// Clicar rápido 2x no mesmo botão
await osManager.criarOS(dados);
await osManager.criarOS(dados); // Deve retornar erro

// Erro esperado: "Operação já em andamento"
```

### 4.5 Testar versionamento
```javascript
// Simular edição concorrente
const os = await osManager.buscarOS('xxx');
const versaoAntiga = os.data.version;

// Outra pessoa atualiza a OS
await osManager.atualizarOS('xxx', { status: 'EM_ANDAMENTO' });

// Tentar atualizar com versão antiga
await osManager.atualizarOS('xxx', { observacoes: 'teste' }, versaoAntiga);

// Erro esperado: "OS foi modificada por outro usuário"
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

| TESTE | STATUS |
|-------|--------|
| ☐ Cloud Functions deployadas | |
| ☐ Security Rules deployadas | |
| ☐ Usuários migrados | |
| ☐ Claims aparecem no token | |
| ☐ Isolamento entre oficinas funciona | |
| ☐ Transações funcionando | |
| ☐ Clique duplo bloqueado | |
| ☐ Versionamento funciona | |
| ☐ Campos read-only protegidos | |
| ☐ Delete bloqueado | |

---

## ⚠️ TROUBLESHOOTING

### Erro: "Missing or insufficient permissions"
**Causa:** Claims não configurados ou token não refreshed  
**Solução:**
```javascript
await firebase.auth().currentUser.getIdToken(true);
await authClaimsManager.debugClaims();
```

### Erro: "Unauthenticated"
**Causa:** Usuário não está logado  
**Solução:**
```javascript
await firebase.auth().signInWithEmailAndPassword(email, senha);
```

### Erro: "version mismatch"
**Causa:** Outro usuário modificou o documento  
**Solução:** Recarregar dados e tentar novamente

### Rules não funcionam
**Causa:** Não deployou as rules  
**Solução:**
```bash
firebase deploy --only firestore:rules
```

---

## 🚀 PRÓXIMOS PASSOS

Após validar tudo:

1. ✅ Testar em produção com usuários reais
2. ✅ Implementar UI para admin gerenciar usuários
3. ✅ Adicionar logs de auditoria
4. ✅ Monitorar performance das transações
5. ✅ Criar testes automatizados

---

## 📄 REFERÊNCIAS

- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)

---

**✅ Sistema blindado e pronto para produção!**