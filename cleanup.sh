#!/bin/bash
# 🧹 Script de Limpeza do Repositório
# Autor: Sistema Automatizado
# Data: 02/03/2026

echo "🧹 Iniciando limpeza do repositório..."

# Arquivos obsoletos de migração
echo "❌ Removendo arquivos obsoletos de migração..."
rm -f firebase_app_OLD_GIST.js
rm -f migrate-gist-to-firebase.js
rm -f migrate-ALL-oficinas.js

# Arquivos de teste temporários
echo "❌ Removendo arquivos de teste..."
rm -f test-bugfixes-v2.js
rm -f tests_security_adversarial.js

# Arquivos de debug
echo "❌ Removendo arquivos de debug..."
rm -f session-fix.js

# Verificar pastas vazias
echo "🔍 Verificando pastas vazias..."
find . -type d -empty -delete 2>/dev/null

echo "✅ Limpeza concluída!"
echo ""
echo "📊 Estatísticas:"
echo "- Arquivos JS: $(find . -name '*.js' | wc -l)"
echo "- Arquivos HTML: $(find . -name '*.html' | wc -l)"
echo "- Arquivos CSS: $(find . -name '*.css' | wc -l)"
echo "- Arquivos MD: $(find . -name '*.md' | wc -l)"
echo ""
echo "🚀 Repositório limpo e organizado!"
