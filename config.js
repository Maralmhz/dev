// config.js - Configuração do Sistema de Checklist
// ================================================

// ============================================
// CONFIGURAÇÃO DA OFICINA
// ============================================
// Preencha com os dados da sua oficina

window.OFICINA_CONFIG = {
    oficina_id: "modelo",  // ← Identificador para oficina modelo/amostra
    nome: "NOME DA SUA OFICINA",
    subtitulo: "CHECKLIST DE ENTRADA E INSPEÇÃO VEICULAR",
    cnpj: "00.000.000/0001-00",
    logo: "logo.png",
    corPrimaria: "#000000",
    endereco: "Seu endereço completo aqui",
    telefone: "(00) 0000-0000",
    whatsapp: "(00) 00000-0000"
};


// ============================================
// CONFIGURAÇÃO FIREBASE
// ============================================

window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyCpCfotfXYNpQu5o0fFbBvwOnQgU9PuYqU",
    authDomain: "checklist-oficina-72c9e.firebaseapp.com",
    databaseURL: "https://checklist-oficina-72c9e-default-rtdb.firebaseio.com",
    projectId: "checklist-oficina-72c9e",
    storageBucket: "checklist-oficina-72c9e.firebasestorage.app",
    messagingSenderId: "305423384809",
    appId: "1:305423384809:web:b152970a419848a0147078"
};

// ============================================
// CONFIGURAÇÃO GITHUB GIST (LEGADO - NÃO USAR)
// ============================================
// ⚠️ Mantido apenas para compatibilidade durante migração
// Após migrar para Firebase, esta seção pode ser removida

window.CLOUD_CONFIG = {
    TOKEN: '', // DEIXE VAZIO - Não usar mais!
    GIST_ID: '', // Não necessário após migração
    FILENAME: 'backup_checklist.json'
};
