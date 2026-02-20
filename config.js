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
// CONFIGURAÇÃO FIREBASE - COMPLETA COM REALTIME DATABASE
// ============================================

window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyB6b4waUVzjwxWRCqxDGdtnMuQ8dPLnLRc",
    authDomain: "oficina-hallz.firebaseapp.com",
    databaseURL: "https://oficina-hallz-default-rtdb.firebaseio.com/",  // ✅ ADICIONADO para Realtime Database
    projectId: "oficina-hallz",
    storageBucket: "oficina-hallz.firebasestorage.app",
    messagingSenderId: "597523417628",
    appId: "1:597523417628:web:c928794dec224c0d29edd9"
};

// Variáveis de compatibilidade para firebase_app_real.js
window.FIREBASE_API_KEY = "AIzaSyB6b4waUVzjwxWRCqxDGdtnMuQ8dPLnLRc";
window.FIREBASE_SENDER_ID = "597523417628";
window.FIREBASE_APP_ID = "1:597523417628:web:c928794dec224c0d29edd9";

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
