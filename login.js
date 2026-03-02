// ==============================================
// LOGIN.JS - VERSÃO CORRETA COM BLOQUEIO REAL
// ==============================================

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('senha');
const rememberCheckbox = document.getElementById('rememberMe');
const errorMessage = document.getElementById('alertError');
const loadingSpinner = document.getElementById('loading');

// ==============================================
// CARREGAR EMAIL SALVO
// ==============================================

window.addEventListener('DOMContentLoaded', () => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberCheckbox.checked = true;
    }
});

// ==============================================
// LOGIN PRINCIPAL
// ==============================================

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
        // 🔐 LOGIN FIREBASE
        const userCredential = await firebase.auth()
            .signInWithEmailAndPassword(email, password);

        const user = userCredential.user;
        console.log('✅ Login bem-sucedido:', user.email);

        // 💾 Lembrar email
        if (rememberCheckbox.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // ==========================================
        // 🔥 BLOQUEIO REAL DE SESSÃO
        // ==========================================

        await window.sessionManager.waitForAuthReady();

        const result = await window.sessionManager.validateAndRegisterSession();

        if (!result.allowed) {
            showLoading(false);
            showError(result.message);
            await firebase.auth().signOut();
            return;
        }

        // ✅ Se passou no bloqueio, entra no sistema
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

// ==============================================
// UI HELPERS
// ==============================================

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
}

function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    loginForm.querySelector('button[type="submit"]').disabled = show;
}

// ==============================================
// VISUALIZAR SENHA
// ==============================================

function togglePassword() {
    const input = document.getElementById('senha');

    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

window.togglePassword = togglePassword;
