/**
 * MONITOR DE STATUS EM TEMPO REAL
 * Verifica se o usuario foi bloqueado/rejeitado e desloga automaticamente
 */

let statusMonitorInterval = null;
let lastKnownStatus = null;

// Iniciar monitoramento
function iniciarMonitoramentoStatus() {
    console.log('[STATUS MONITOR] Iniciado');

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

// Verificar status do usuario
async function verificarStatusUsuario(user) {
    try {
        const userDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();

        if (!userDoc.exists) {
            console.warn('[STATUS MONITOR] Usuario nao encontrado no Firestore');
            await deslogarUsuario('[BLOQUEIO] Conta nao encontrada');
            return;
        }

        const userData = userDoc.data();
        const status = userData.status || 'ativo';

        // Detectar mudanca de status
        if (lastKnownStatus && lastKnownStatus !== status) {
            console.log('[STATUS MONITOR] Status mudou: ' + lastKnownStatus + ' -> ' + status);
        }

        lastKnownStatus = status;

        // Acoes baseadas no status
        if (status === 'bloqueado') {
            console.warn('[STATUS MONITOR] Conta bloqueada! Deslogando...');
            await deslogarUsuario('[BLOQUEIO] Sua conta foi bloqueada pelo administrador');
        } else if (status === 'rejeitado') {
            console.warn('[STATUS MONITOR] Conta rejeitada! Deslogando...');
            await deslogarUsuario('[BLOQUEIO] Seu acesso foi rejeitado');
        } else if (status === 'pendente') {
            console.warn('[STATUS MONITOR] Conta pendente! Deslogando...');
            await deslogarUsuario('[BLOQUEIO] Aguardando aprovacao do administrador');
        }

    } catch (error) {
        console.error('[STATUS MONITOR] Erro ao verificar status:', error);
    }
}

// Deslogar usuario e mostrar mensagem
async function deslogarUsuario(mensagem) {
    pararMonitoramentoStatus();

    // Salvar mensagem para mostrar na proxima pagina
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
        console.log('[STATUS MONITOR] Parado');
    }
}

// Iniciar automaticamente quando o script carregar
if (typeof firebase !== 'undefined') {
    iniciarMonitoramentoStatus();
} else {
    console.warn('[STATUS MONITOR] Firebase nao carregado ainda');
    window.addEventListener('load', () => {
        if (typeof firebase !== 'undefined') {
            iniciarMonitoramentoStatus();
        }
    });
}

// Limpar ao sair
window.addEventListener('beforeunload', pararMonitoramentoStatus);