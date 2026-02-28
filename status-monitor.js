/**
 * MONITOR DE STATUS EM TEMPO REAL
 * Verifica se o usuário foi bloqueado/rejeitado e desloga automaticamente
 */

let statusMonitorInterval = null;
let lastKnownStatus = null;

// Iniciar monitoramento
function iniciarMonitoramentoStatus() {
    console.log('🔍 Monitor de status iniciado');

    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            pararMonitoramentoStatus();
            return;
        }

        // Verificar status a cada 3 segundos
        statusMonitorInterval = setInterval(async () => {
            await verificarStatusUsuario(user);
        }, 3000);

        // Verificar imediatamente
        await verificarStatusUsuario(user);
    });
}

// Verificar status do usuário
async function verificarStatusUsuario(user) {
    try {
        const userDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();

        if (!userDoc.exists) {
            console.warn('⚠️ Usuário não encontrado no Firestore');
            await deslogarUsuario('❌ Conta não encontrada');
            return;
        }

        const userData = userDoc.data();
        const status = userData.status || 'ativo';

        // Detectar mudança de status
        if (lastKnownStatus && lastKnownStatus !== status) {
            console.log(`🔄 Status mudou: ${lastKnownStatus} → ${status}`);
        }

        lastKnownStatus = status;

        // Ações baseadas no status
        if (status === 'bloqueado') {
            console.warn('🔒 Conta bloqueada! Deslogando...');
            await deslogarUsuario('🔒 Sua conta foi bloqueada pelo administrador');
        } else if (status === 'rejeitado') {
            console.warn('❌ Conta rejeitada! Deslogando...');
            await deslogarUsuario('❌ Seu acesso foi rejeitado');
        } else if (status === 'pendente') {
            console.warn('⏳ Conta pendente! Deslogando...');
            await deslogarUsuario('⏳ Aguardando aprovação do administrador');
        }

    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
    }
}

// Deslogar usuário e mostrar mensagem
async function deslogarUsuario(mensagem) {
    pararMonitoramentoStatus();

    // Salvar mensagem para mostrar na próxima página
    sessionStorage.setItem('logoutMessage', mensagem);

    // Deslogar do Firebase
    await firebase.auth().signOut();

    // Redirecionar para login
    window.location.href = 'index.html';
}

// Parar monitoramento
function pararMonitoramentoStatus() {
    if (statusMonitorInterval) {
        clearInterval(statusMonitorInterval);
        statusMonitorInterval = null;
        console.log('🛑 Monitor de status parado');
    }
}

// Iniciar automaticamente quando o script carregar
if (typeof firebase !== 'undefined') {
    iniciarMonitoramentoStatus();
} else {
    console.warn('⚠️ Firebase não carregado ainda');
    window.addEventListener('load', () => {
        if (typeof firebase !== 'undefined') {
            iniciarMonitoramentoStatus();
        }
    });
}

// Limpar ao sair
window.addEventListener('beforeunload', pararMonitoramentoStatus);