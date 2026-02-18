# 📋 Sistema de Checklist Veicular - Fast Car Centro Automotivo

> Sistema web moderno e offline-first para gestão de checklists de entrada, orçamentos e inspeção veicular em oficinas mecânicas.

![Version](https://img.shields.io/badge/version-3.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-ready-orange)

## ✨ Funcionalidades

- ✅ **Checklist Digital Completo**: Inspeção de veículos com mais de 30 itens
- 💰 **Orçamento Integrado**: Controle de peças e serviços com cálculo automático
- 📸 **Galeria de Fotos**: Captura com marca d'água (data/hora/geolocalização)
- 📄 **Geração de PDF**: Relatórios profissionais para impressão
- 💾 **Armazenamento Local**: Funciona 100% offline com localStorage
- ☁️ **Backup na Nuvem**: Sincronização opcional via GitHub Gist
- 📊 **Relatórios e Estatísticas**: Análise de atendimentos e marcas
- 📱 **Progressive Web App**: Instale como aplicativo no celular
- 🔒 **Segurança**: Suporte a variáveis de ambiente para tokens

## 🚀 Como Usar

### Opção 1: Uso Direto (sem instalação)

1. Abra o arquivo `index.html` em qualquer navegador moderno
2. O sistema funciona totalmente offline
3. Dados serão salvos no navegador (localStorage)

### Opção 2: Hospedagem Web

1. Faça upload de todos os arquivos para seu servidor/hospedagem
2. Acesse via navegador (desktop ou mobile)
3. Instale como PWA para acesso rápido

### Opção 3: Servidor Local para Desenvolvimento

```bash
# Com Python 3
python -m http.server 8000

# Com Node.js (npx)
npx serve .

# Com PHP
php -S localhost:8000
```

Depois acesse: `http://localhost:8000`

## ⚙️ Configuração

### 1. Configurar Informações da Oficina

Edite o arquivo `config.js`:

```javascript
window.OFICINA_CONFIG = {
    nome: "SUA OFICINA",
    subtitulo: "SEU SUBTITULO",
    cnpj: "00.000.000/0000-00",
    logo: "logo.png", // Substitua sua logo
    corPrimaria: "#c32421", // Cor principal do sistema
    endereco: "Seu endereço completo",
    telefone: "(00) 0000-0000",
    whatsapp: "(00) 00000-0000"
};
```

### 2. Configurar Backup na Nuvem (Opcional)

#### Usando GitHub Gist:

1. **Crie um Token de Acesso Pessoal no GitHub**:
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token (classic)"
   - Dê um nome: `Checklist Backup`
   - Selecione apenas a permissão: `gist`
   - Clique em "Generate token"
   - **COPIE O TOKEN** (ele só aparece uma vez!)

2. **Crie um Gist privado**:
   - Acesse: https://gist.github.com/
   - Crie um novo Gist com nome `backup_oficina.json`
   - Conteudo inicial: `[]`
   - Marque como "Secret"
   - Copie o ID do Gist (está na URL)

3. **Configure as variáveis**:
   - Copie `.env.example` para `.env`
   - Adicione seu token e Gist ID
   - **NUNCA** faça commit do arquivo `.env`!

```bash
cp .env.example .env
# Edite o .env com seus dados
```

### 3. Personalizar Logo

Substitua o arquivo `logo.png` pela logo da sua oficina (recomendado: 200x200px, PNG com fundo transparente).

## 📚 Estrutura do Projeto

```
dev/
├── index.html          # Página principal
├── styles.css          # Estilos visuais
├── app.js              # Inicialização e configuração dinâmica
├── checklist.js        # Lógica principal do checklist
├── firebase_app.js     # Módulo de sincronização (Gist/Firebase)
├── config.js           # Configurações da oficina
├── service-worker.js   # Service Worker para PWA
├── manifest.json       # Manifesto PWA
├── logo.png            # Logo da oficina
├── whatsapp.png        # Ícone WhatsApp
├── .gitignore          # Arquivos ignorados pelo Git
├── .env.example        # Exemplo de variáveis de ambiente
└── README.md           # Este arquivo
```

## 🔒 Segurança

### ⚠️ IMPORTANTE

1. **NUNCA** commite tokens ou senhas no repositório
2. Use sempre variáveis de ambiente (`.env`)
3. O arquivo `.env` está no `.gitignore` por segurança
4. Se um token for exposto, **revogue imediatamente** no GitHub
5. Para produção, considere usar um backend para esconder credenciais

### Revogar Token Exposto

Se você acidentalmente expor um token:

1. Acesse: https://github.com/settings/tokens
2. Encontre o token comprometido
3. Clique em "Delete"
4. Crie um novo token
5. Atualize sua configuração local

## 📱 Instalar como App (PWA)

### Android (Chrome/Edge)
1. Abra o site no navegador
2. Toque no menu (⋮)
3. Selecione "Adicionar à tela inicial"
4. Confirme a instalação

### iOS (Safari)
1. Abra o site no Safari
2. Toque no botão compartilhar (🔼)
3. Role e selecione "Adicionar à Tela de Início"
4. Confirme

### Desktop (Chrome/Edge)
1. Abra o site
2. Procure o ícone de instalação na barra de endereços
3. Clique em "Instalar"

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 🛠️ Tecnologias Utilizadas

- HTML5, CSS3, JavaScript (Vanilla)
- LocalStorage API
- Service Workers
- Media Devices API (Câmera)
- Geolocation API
- GitHub REST API (opcional)
- html2pdf.js (geração de PDF)

## 🐛 Problemas Conhecidos

- Fotos são armazenadas apenas localmente (backup manual necessário)
- Limite de 15 fotos por checklist (para não sobrecarregar localStorage)
- Sincronização na nuvem requer configuração manual

## 📝 Roadmap

- [ ] Integração real com Firebase Firestore
- [ ] Upload de fotos para cloud storage
- [ ] Sistema de autenticação multi-usuário
- [ ] App mobile nativo (React Native/Flutter)
- [ ] Assinatura digital no PDF
- [ ] Integração com WhatsApp Business API
- [ ] Dashboard administrativo
- [ ] Exportação para Excel/CSV

## 💬 Suporte

Para reportar bugs ou solicitar features:
- Abra uma [Issue](https://github.com/Maralmhz/dev/issues)
- Entre em contato: maralmhz@gmail.com

## 📄 Licença

MIT License - Veja o arquivo [LICENSE](LICENSE) para detalhes.

## ❤️ Desenvolvido por

**Hallz Branding**  
WhatsApp: (31) 99676-6963

---

⭐ Se este projeto foi útil, considere dar uma estrela no repositório!
