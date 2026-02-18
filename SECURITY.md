# 🔒 Política de Segurança

## ⚠️ AVISO IMPORTANTE SOBRE CREDENCIAIS

### Token do GitHub Exposto

Se você clonou este repositório e encontrou um token do GitHub no arquivo `config.js`, tome as seguintes ações **IMEDIATAMENTE**:

1. **Revogue o token comprometido**:
   - Acesse: https://github.com/settings/tokens
   - Localize o token exposto
   - Clique em **Delete** ou **Revoke**

2. **Crie um novo token**:
   - Clique em **Generate new token (classic)**
   - Nome sugerido: `Checklist Backup - [Data]`
   - Selecione **apenas** a permissão: `gist`
   - Defina expiração (recomendado: 90 dias)
   - Copie o token gerado

3. **Configure localmente**:
   ```bash
   # Copie o arquivo de exemplo
   cp config.example.js config.js
   
   # Edite config.js e adicione seu novo token
   # NUNCA commite este arquivo!
   ```

4. **Verifique o .gitignore**:
   - Certifique-se que `config.js` está listado no `.gitignore`
   - Confirme: `git check-ignore config.js` deve retornar `config.js`

## 🔍 Versões Suportadas

Apenas a versão mais recente recebe atualizações de segurança.

| Versão | Suportada          |
| ------- | ------------------ |
| 3.1.x   | :white_check_mark: |
| 3.0.x   | :x:                |
| < 3.0   | :x:                |

## 🚨 Reportar Vulnerabilidades

### Vulnerabilidades de Segurança

Se você descobrir uma vulnerabilidade de segurança, por favor **NÃO** abra uma issue pública. Em vez disso:

1. **Envie um e-mail para**: maralmhz@gmail.com
2. **Assunto**: `[SECURITY] Vulnerabilidade no Checklist Veicular`
3. **Inclua**:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Versão afetada
   - Sugestões de correção (se houver)

### Tempo de Resposta

- **Confirmação inicial**: Até 48 horas
- **Avaliação**: Até 1 semana
- **Correção**: Varia conforme a severidade
  - Crítica: Até 72 horas
  - Alta: Até 1 semana
  - Média: Até 2 semanas
  - Baixa: Próxima release

## 🛡️ Práticas de Segurança Recomendadas

### Para Usuários

1. **Tokens e Credenciais**:
   - Nunca compartilhe seu `config.js` com token real
   - Use tokens com expiração definida
   - Rotacione tokens regularmente (a cada 90 dias)
   - Use permissões mínimas necessárias

2. **Backup de Dados**:
   - Faça backup regular dos checklists
   - Armazene backups em local seguro
   - Teste a restauração periodicamente

3. **Navegação**:
   - Use HTTPS sempre que possível
   - Mantenha o navegador atualizado
   - Limpe cache/localStorage ao trocar de dispositivo

### Para Desenvolvedores

1. **Antes de Commitar**:
   ```bash
   # Verifique se não há credenciais
   git diff --cached | grep -i "token\|password\|secret\|key"
   
   # Verifique arquivos sensíveis
   git status --ignored
   ```

2. **Variáveis de Ambiente**:
   - Use sempre `.env` para credenciais
   - Nunca hardcode tokens no código
   - Documente variáveis no `.env.example`

3. **Code Review**:
   - Revise pull requests cuidadosamente
   - Procure por exposição de dados sensíveis
   - Verifique validações de entrada

## 🔑 Checklist de Segurança

### Setup Inicial

- [ ] Token antigo foi revogado
- [ ] Novo token foi criado com permissões mínimas
- [ ] `config.js` está no `.gitignore`
- [ ] `config.example.js` não contém dados reais
- [ ] `.env` está no `.gitignore`

### Antes de Deploy

- [ ] Sem tokens hardcoded no código
- [ ] Sem console.logs com dados sensíveis
- [ ] Arquivos de configuração não estão versionados
- [ ] HTTPS está habilitado (se hospedado)
- [ ] Backup dos dados foi realizado

### Manutenção Regular

- [ ] Tokens rotatados a cada 90 dias
- [ ] Dependências atualizadas
- [ ] Logs de acesso revisados
- [ ] Backup testado

## 📊 Histórico de Segurança

### 2026-02-18
- **Tipo**: Exposição de Token
- **Status**: Mitigado
- **Ação**: 
  - Adicionado `.gitignore` para `config.js`
  - Criado `config.example.js` sem credenciais
  - Documentado processo de rotação de tokens
  - Token exposto foi sinalizado para revogação

## 📞 Contato de Segurança

- **E-mail**: maralmhz@gmail.com
- **Assunto**: `[SECURITY]` para questões de segurança
- **Resposta**: Até 48 horas úteis

## 📚 Recursos Adicionais

- [GitHub Token Security](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Basics](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**⚠️ Lembre-se: Segurança é responsabilidade de todos!**
