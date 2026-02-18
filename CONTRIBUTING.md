# Guia de Contribuição

Obrigado por considerar contribuir com o Sistema de Checklist Veicular! 🚀

## Como Contribuir

### Reportar Bugs 🐛

Antes de criar um issue:
1. Verifique se o bug já não foi reportado
2. Teste na versão mais recente
3. Colete informações do ambiente (navegador, versão, SO)

**Ao reportar, inclua:**
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Console do navegador (F12)

### Sugerir Funcionalidades ✨

1. Abra um issue com tag `enhancement`
2. Descreva a funcionalidade em detalhes
3. Explique o caso de uso
4. Considere impactos em performance/UX

### Enviar Pull Requests 🔧

#### Preparação

```bash
# 1. Fork o repositório
# 2. Clone seu fork
git clone https://github.com/SEU_USUARIO/dev.git
cd dev

# 3. Crie uma branch
git checkout -b feature/minha-feature
# OU
git checkout -b fix/meu-bugfix
```

#### Desenvolvimento

1. **Mantenha o código limpo e documentado**
   - Comentários em português
   - Funções com nomes descritivos
   - Evite código duplicado

2. **Siga o padrão existente**
   - Indentação: 4 espaços
   - Aspas: simples ('string')
   - Ponto e vírgula: obrigatório

3. **Teste suas mudanças**
   - Teste em Chrome, Firefox e Safari
   - Teste no mobile (responsive)
   - Teste modo offline

4. **Não commite:**
   - Arquivos de configuração local
   - Tokens ou senhas
   - Arquivos de IDE
   - node_modules/

#### Commit

```bash
# Commits claros e descritivos
git add .
git commit -m "Adiciona validação de CPF no formulário"

# Use verbos no imperativo:
# ✅ "Adiciona", "Corrige", "Atualiza", "Remove"
# ❌ "Adicionado", "Corrigido", "Atualizado"
```

#### Push e Pull Request

```bash
# Push para seu fork
git push origin feature/minha-feature
```

Depois:
1. Abra um Pull Request no GitHub
2. Preencha o template (se houver)
3. Descreva as mudanças em detalhes
4. Referencie issues relacionadas (#123)
5. Aguarde revisão

## Padrões de Código

### JavaScript

```javascript
// ✅ BOM
function calcularTotal(itens) {
    return itens.reduce((total, item) => total + item.valor, 0);
}

// ❌ EVITE
function calc(x) {
    var t = 0;
    for(var i=0;i<x.length;i++)t+=x[i].valor;
    return t;
}
```

### HTML

```html
<!-- ✅ BOM: Semântico e acessível -->
<button class="btn-primary" onclick="salvarChecklist()">
    💾 Salvar
</button>

<!-- ❌ EVITE: Pouco semântico -->
<div onclick="salvarChecklist()" class="btn">Salvar</div>
```

### CSS

```css
/* ✅ BOM: Classes descritivas */
.checklist-item {
    padding: 12px;
    border-radius: 8px;
}

/* ❌ EVITE: Classes genéricas */
.item {
    padding: 12px;
}
```

## Estrutura de Branches

- `main`: Código em produção, estável
- `feature/*`: Novas funcionalidades
- `fix/*`: Correções de bugs
- `docs/*`: Atualizações de documentação
- `refactor/*`: Refatoração sem mudança de funcionalidade

## Tipos de Contribuição

### Fáceis para Iniciantes 🌱

- Corrigir erros de português
- Melhorar documentação
- Adicionar comentários no código
- Corrigir bugs pequenos
- Melhorar estilos CSS

### Intermediárias 💪

- Adicionar validações de formulário
- Implementar novas features pequenas
- Otimizar performance
- Melhorar responsividade

### Avançadas 🚀

- Integração com Firebase
- Sistema de autenticação
- Refatoração de arquitetura
- Testes automatizados

## Checklist do Pull Request

Antes de enviar, verifique:

- [ ] Código testado localmente
- [ ] Sem erros no console
- [ ] Funciona em mobile
- [ ] Funciona offline
- [ ] Documentação atualizada (se necessário)
- [ ] Sem tokens ou senhas expostas
- [ ] Commits organizados e descritivos
- [ ] README atualizado (se aplicável)

## Código de Conduta

- Seja respeitoso e profissional
- Aceite críticas construtivas
- Foque no que é melhor para o projeto
- Seja paciente com iniciantes
- Não tolere discriminação ou assédio

## Dúvidas?

- Abra uma [Discussion](https://github.com/Maralmhz/dev/discussions)
- Entre em contato: maralmhz@gmail.com
- WhatsApp: (31) 99676-6963

---

**Obrigado por contribuir! 🚀❤️**
