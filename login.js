// ==============================================
// 🔒 LOGIN.JS - PROFESSIONAL SAAS AUTH FLOW
// ==============================================
// ⚠️ This is the ONLY file that can call signInWithEmailAndPassword
// All auth MUST go through SessionManager validation

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('senha');
const rememberCheckbox = document.getElementById('rememberMe');
const errorMessage = document.getElementById('alertError');
const successMessage = document.getElementById('alertSuccess');
const warningMessage = document.getElementById('alertWarning');
const loadingSpinner = document.getElementById('loading');

window.__loginInProgress = false;

// ==============================================
// 📦 LOAD SAVED EMAIL
// ==============================================

window.addEventListener('DOMContentLoaded', () => {
    // HOTFIX UI: força fundo preto no login mesmo com CSS antigo em cache
    const applyBlackBackground = () => {
        document.documentElement.style.setProperty('background', '#000000', 'important');
        document.body.style.setProperty('background', '#000000', 'important');

        const backgroundEl = document.querySelector('.background');
        if (backgroundEl) {
            backgroundEl.style.setProperty('background', '#000000', 'important');
            backgroundEl.style.setProperty('animation', 'none', 'important');
            backgroundEl.style.setProperty('background-image', 'none', 'important');
        }
    };

    applyBlackBackground();
    requestAnimationFrame(applyBlackBackground);

    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberCheckbox.checked = true;
    }

    // Check for logout message
    const logoutMsg = sessionStorage.getItem('logoutMessage');
    if (logoutMsg) {
        showWarning(logoutMsg);
        sessionStorage.removeItem('logoutMessage');
    }
});

// ==============================================
// 🔒 MAIN LOGIN HANDLER
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
    hideAlerts();

    try {
        console.log('🔐 Attempting Firebase authentication...');
        
        // ✅ STEP 1: Firebase Authentication
        const userCredential = await firebase.auth()
            .signInWithEmailAndPassword(email, password);

        const user = userCredential.user;
        console.log('✅ Firebase auth successful:', user.email);

        // Save email if remember is checked
        if (rememberCheckbox.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // ✅ STEP 2: Check user status in Firestore
        console.log('🔍 Checking user status in Firestore...');
        const userDoc = await firebase.firestore()
            .collection('usuarios')
            .doc(user.uid)
            .get();

        if (!userDoc.exists) {
            // Create pending user
            await firebase.firestore().collection('usuarios').doc(user.uid).set({
                email: user.email,
                nome: user.displayName || '',
                status: 'pendente',
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await firebase.auth().signOut();
            showLoading(false);
            showWarning('⏳ Acesso solicitado! Aguarde aprovação do administrador.');
            return;
        }

        const userData = userDoc.data();

        // Check status
        if (userData.status !== 'ativo') {
            await firebase.auth().signOut();
            showLoading(false);
            
            const messages = {
                'pendente': '⏳ Aguardando aprovação...',
                'bloqueado': '❌ Conta bloqueada. Entre em contato com o suporte.',
                'rejeitado': '❌ Acesso rejeitado.'
            };
            
            showWarning(messages[userData.status] || '❌ Acesso negado');
            return;
        }

        // Check oficinaId
        if (!userData.oficinaId) {
            await firebase.auth().signOut();
            showLoading(false);
            showError('❌ Usuário sem oficina vinculada. Contate o administrador.');
            return;
        }

        // ✅ STEP 3: WAIT FOR AUTH STATE
        console.log('⏳ Waiting for auth state to be ready...');
        await window.sessionManager.waitForAuthReady();
        console.log('✅ Auth state ready');

        // ✅ STEP 4: VALIDATE AND REGISTER SESSION
        console.log('🔒 Validating session limit...');
        const result = await window.sessionManager.validateAndRegisterSession();

        if (!result.allowed) {
            console.error('❌ Session blocked:', result.message);
            await firebase.auth().signOut();
            showLoading(false);
            showError(result.message);
            return;
        }

        console.log('✅ Session validated successfully');

        // ✅ STEP 5: SET GLOBAL CONFIG
        window.OFICINA_CONFIG = window.OFICINA_CONFIG || {};
        window.OFICINA_CONFIG.oficinaId = userData.oficinaId;
        sessionStorage.setItem('oficinaId', userData.oficinaId);
        sessionStorage.setItem('userRole', userData.role);
        sessionStorage.setItem('userEmail', user.email);

        // ✅ STEP 6: REDIRECT TO APP
        console.log('🚀 Redirecting to app.html...');
        showLoading(false);
        showSuccess('✅ Login realizado! Redirecionando...');
        
        setTimeout(() => {
            window.__loginInProgress = true;
            window.location.href = 'app.html';
        }, 1000);

    } catch (error) {
        showLoading(false);
        console.error('❌ Login error:', error);

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
            case 'auth/network-request-failed':
                errorMsg = '❌ Erro de conexão. Verifique sua internet.';
                break;
            default:
                errorMsg = `❌ ${error.message}`;
        }

        showError(errorMsg);
    }
});

// ==============================================
// 🎨 UI HELPERS
// ==============================================

function hideAlerts() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    warningMessage.style.display = 'none';
}

function showError(message) {
    hideAlerts();
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
}

function showSuccess(message) {
    hideAlerts();
    successMessage.textContent = message;
    successMessage.style.display = 'block';
}

function showWarning(message) {
    hideAlerts();
    warningMessage.textContent = message;
    warningMessage.style.display = 'block';
}

function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = show;
    }
}

// ==============================================
// 🔒 PREVENT DIRECT ACCESS TO APP
// ==============================================

firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const fromApp = urlParams.get('from') === 'app' || urlParams.has('from');

    if (fromApp) {
        console.warn('⚠️ Redirected from app.html guard. Limpando sessão para evitar loop.');
        await firebase.auth().signOut();
        sessionStorage.setItem('logoutMessage', '❌ Sessão inválida detectada. Faça login novamente.');
        showWarning('❌ Sessão inválida. Faça login novamente.');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (window.__loginInProgress) {
        console.log('ℹ️ Login redirect já em andamento, ignorando onAuthStateChanged.');
        return;
    }

    try {
        const userDoc = await firebase.firestore()
            .collection('usuarios')
            .doc(user.uid)
            .get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.status === 'ativo' && userData.oficinaId) {
                window.__loginInProgress = true;
                console.log('✅ User already authenticated, redirecting to app.html...');
                window.location.href = 'app.html';
            }
        }
    } catch (error) {
        console.error('❌ Error checking auth state:', error);
    }
});

console.log('🔒 login.js loaded - Professional SaaS auth flow ready');
