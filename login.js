// ==============================================
// LOGIN.JS - ATUALIZADO COM SESSION MANAGER
// ==============================================

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');

// CARREGAR EMAIL SALVO
window.addEventListener('DOMContentLoaded', () => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberCheckbox.checked = true;
    }
});

// FUNÇÃO DE LOGIN
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('⚠️ Preencha email e senha');
        return;
    }

    showLoading(true);
    errorMessage.style.display = 'none';

    try {
        // 🔥 NOVO: Verificar limite de sessões ANTES de logar
        const sessionCheck = await window.sessionManager.checkSessionLimit(email);
        
        if (!sessionCheck.allowed) {
            showLoading(false);
            showSessionLimitError(sessionCheck);
            return;
        }

        // Fazer login no Firebase
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log('✅ Login bem-sucedido:', user.email);

        // Salvar email se "Lembrar-me" estiver marcado
        if (rememberCheckbox.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // 🔥 NOVO: Registrar sessão ativa
        await window.sessionManager.registerSession(user.email);

        // Redirecionar para o app
        window.location.href = 'app.html';

    } catch (error) {
        showLoading(false);
        console.error('❌ Erro no login:', error);
        
        let errorMsg = '❌ Erro ao fazer login';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMsg = '❌ Usuário não encontrado';
                break;
            case 'auth/wrong-password':
                errorMsg = '❌ Senha incorreta';
                break;
            case 'auth/invalid-email':
                errorMsg = '❌ Email inválido';
                break;
            case 'auth/too-many-requests':
                errorMsg = '❌ Muitas tentativas. Aguarde e tente novamente';
                break;
            default:
                errorMsg = `❌ ${error.message}`;
        }
        
        showError(errorMsg);
    }
});

// MOSTRAR ERRO
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Vibrar se disponível
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
}

// MOSTRAR ERRO DE LIMITE DE SESSÕES
function showSessionLimitError(sessionInfo) {
    const message = `
        🚫 <strong>Limite de Dispositivos Atingido</strong><br><br>
        Você já está logado em <strong>${sessionInfo.activeCount} dispositivo(s)</strong>.<br>
        Seu plano permite até <strong>${sessionInfo.maxSessions} dispositivo(s)</strong>.<br><br>
        <strong>Opções:</strong><br>
        1️⃣ Deslogue de outro dispositivo<br>
        2️⃣ Faça upgrade: <strong>R$ 30,00</strong> por dispositivo adicional<br><br>
        <small>Entre em contato para ativar dispositivos extras</small>
    `;
    
    errorMessage.innerHTML = message;
    errorMessage.style.display = 'block';
    errorMessage.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)';
    errorMessage.style.color = '#fff';
    errorMessage.style.padding = '20px';
    errorMessage.style.borderRadius = '12px';
}

// LOADING SPINNER
function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
    loginForm.querySelector('button[type="submit"]').disabled = show;
}

// VISUALIZAR SENHA
function togglePassword() {
    const input = document.getElementById('password');
    const icon = document.querySelector('.toggle-password');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '👁️';
    } else {
        input.type = 'password';
        icon.textContent = '👁️‍🗨️';
    }
}

// Expor função globalmente
window.togglePassword = togglePassword;