// config.js - Configuração FINAL do Sistema de Checklist
// ======================================================

// ============================================
// CONFIGURAÇÃO DA OFICINA HALLZ
// ============================================

window.OFICINA_CONFIG = {
    oficina_id: "modelo",  // ← ID único para sua oficina principal
    nome: "Nossa Oficina",
    subtitulo: "CHECKLIST DE ENTRADA E INSPEÇÃO VEICULAR",
    cnpj: "00.000.000/0001-00",  // ← Seu CNPJ real
    logo: "logo.png",
    corPrimaria: "#000000",
    endereco: "Seu endereço em Belo Horizonte, MG",
    telefone: "(31) 0000-0000",  // ← Seu telefone
    whatsapp: "(31) 99999-9999"  // ← Seu WhatsApp
};

// ============================================
// CONFIGURAÇÃO FIREBASE - NOVO PROJETO DEV ISOLADO
// ============================================

window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyAZkatw4xvO3MLoZM465YQJso_-PFuLZxo",
    authDomain: "oficina-dev-hallz.firebaseapp.com",
    projectId: "oficina-dev-hallz",
    storageBucket: "oficina-dev-hallz.firebasestorage.app",
    messagingSenderId: "458466237755",
    appId: "1:458466237755:web:589d6b233a3c338c466b1e"
};

// Variáveis de compatibilidade para firebase_app_real.js
window.FIREBASE_API_KEY = "AIzaSyAZkatw4xvO3MLoZM465YQJso_-PFuLZxo";
window.FIREBASE_SENDER_ID = "458466237755";
window.FIREBASE_APP_ID = "1:458466237755:web:589d6b233a3c338c466b1e";

// ============================================
// CONFIG GITHUB GIST (DESABILITADO)
// ============================================
window.CLOUD_CONFIG = {
    TOKEN: '',
    GIST_ID: '',
    FILENAME: 'backup_checklist.json'
};

console.log('✅ Config carregado:', window.OFICINA_CONFIG.nome);
console.log('🔥 Firebase Config:', window.FIREBASE_CONFIG.projectId);
