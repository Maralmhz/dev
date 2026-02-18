// config.js - Fast Car Centro Automotivo
// Configuração completa para Checklist Veicular

window.OFICINA_CONFIG = {
    nome: "FAST CAR CENTRO AUTOMOTIVO",
    subtitulo: "CHECKLIST DE ENTRADA E INSPEÇÃO VEICULAR",
    cnpj: "60.516.882/0001-74",
    logo: "logo.png",
    corPrimaria: "#c32421",
    endereco: "Av. Régulus, 248 - Jardim Riacho das Pedras, Contagem - MG, 32241-210",
    telefone: "(31) 2342-1699",
    whatsapp: "(31) 99457-9274"
};

// Configuração Nuvem (GitHub Gist)
// ⚠️ ATENÇÃO: NUNCA COLOQUE SEU TOKEN DIRETAMENTE AQUI!
// 
// INSTRUÇÕES DE SEGURANÇA:
// 1. Crie um arquivo .env na raiz do projeto (ele está no .gitignore)
// 2. Adicione seu token lá: GITHUB_TOKEN=ghp_seu_token_aqui
// 3. Use um servidor local ou backend para ler o .env
// 4. OU use variáveis de ambiente do servidor de hospedagem
//
// PARA DESENVOLVIMENTO LOCAL TEMPORÁRIO:
// - Descomente as linhas abaixo APENAS para testes locais
// - NUNCA faça commit com o token real
// - Revogue o token imediatamente após uso público

window.CLOUD_CONFIG = {
    // TOKEN: 'cole_seu_token_aqui_apenas_para_teste_local',
    TOKEN: '', // DEIXE VAZIO! Use variáveis de ambiente
    GIST_ID: '75e76a26d9b0c36f602ec356f525680a',
    FILENAME: 'backup_fastcar.json'
};

// Função para carregar token de forma segura (exemplo)
// Se você estiver usando um backend, carregue o token de lá
if (typeof process !== 'undefined' && process.env && process.env.GITHUB_TOKEN) {
    window.CLOUD_CONFIG.TOKEN = process.env.GITHUB_TOKEN;
}
