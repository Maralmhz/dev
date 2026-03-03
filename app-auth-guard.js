// ==============================================
// 🔒 APP AUTH GUARD - SIMPLIFIED VERSION
// ==============================================

console.log('🔒 [GUARD] Starting...');

// ==============================================
// 1️⃣ INITIALIZE FIREBASE IMMEDIATELY
// ==============================================

function initializeFirebaseNow() {
    console.log('🔥 [GUARD] Checking Firebase...');
    
    // Wait for config
    let attempts = 0;
    const configCheck = setInterval(() => {
        attempts++;
        
        if (window.FIREBASE_CONFIG) {
            clearInterval(configCheck);
            console.log('✅ [GUARD] Config found');
            
            // Initialize if needed
            if (!firebase.apps || firebase.apps.length === 0) {
                try {
                    firebase.initializeApp(window.FIREBASE_CONFIG);
                    console.log('✅ [GUARD] Firebase initialized');
                } catch (error) {
                    console.error('❌ [GUARD] Firebase init error:', error);
                }
            } else {
                console.log('✅ [GUARD] Firebase already initialized');
            }
            
            // Start validation
            startValidation();
            
        } else if (attempts > 50) {
            clearInterval(configCheck);
            console.error('❌ [GUARD] Config timeout');
            alert('❌ Erro: Configuração não encontrada');
            window.location.href = 'index.html';
        }
    }, 100);
}

// ==============================================
// 2️⃣ VALIDATE AUTHENTICATION
// ==============================================

async function startValidation() {
    console.log('🔍 [GUARD] Starting validation...');
    
    try {
        // Get current user
        const user = await new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
            
            setTimeout(() => resolve(null), 5000);
        });
        
        if (!user) {
            console.warn('❌ [GUARD] No user');
            sessionStorage.setItem('logoutMessage', '❌ Faça login para continuar');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ [GUARD] User:', user.email);
        
        // Check Firestore
        const userDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
        
        if (!userDoc.exists) {
            console.error('❌ [GUARD] User doc not found');
            await firebase.auth().signOut();
            sessionStorage.setItem('logoutMessage', '❌ Usuário não encontrado');
            window.location.href = 'index.html';
            return;
        }
        
        const userData = userDoc.data();
        console.log('✅ [GUARD] User data:', userData.status, userData.oficinaId);
        
        // Check status
        if (userData.status !== 'ativo') {
            console.warn('❌ [GUARD] User not active');
            await firebase.auth().signOut();
            sessionStorage.setItem('logoutMessage', '❌ Conta não ativa');
            window.location.href = 'index.html';
            return;
        }
        
        // Check oficinaId
        if (!userData.oficinaId) {
            console.error('❌ [GUARD] No oficinaId');
            await firebase.auth().signOut();
            sessionStorage.setItem('logoutMessage', '❌ Usuário sem oficina vinculada');
            window.location.href = 'index.html';
            return;
        }
        
        // Set config
        window.OFICINA_CONFIG = window.OFICINA_CONFIG || {};
        window.OFICINA_CONFIG.oficinaId = userData.oficinaId;
        sessionStorage.setItem('oficinaId', userData.oficinaId);
        sessionStorage.setItem('userRole', userData.role || 'user');
        sessionStorage.setItem('userEmail', user.email);
        
        console.log('✅ [GUARD] Config set:', userData.oficinaId);
        
        // Wait for SessionManager
        await waitForSessionManager();
        
        // Validate session
        console.log('🔍 [GUARD] Validating session...');
        const result = await window.sessionManager.validateAndRegisterSession();
        
        if (!result.allowed) {
            console.error('❌ [GUARD] Session blocked:', result.message);
            await firebase.auth().signOut();
            alert(result.message);
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ [GUARD] Session OK');
        
        // UNLOCK PAGE
        unlockPage();
        
    } catch (error) {
        console.error('❌ [GUARD] Validation error:', error);
        alert('❌ Erro ao validar autenticação: ' + error.message);
        window.location.href = 'index.html';
    }
}

// ==============================================
// 3️⃣ WAIT FOR SESSION MANAGER
// ==============================================

function waitForSessionManager() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = setInterval(() => {
            attempts++;
            
            if (window.sessionManager && typeof window.sessionManager.validateAndRegisterSession === 'function') {
                clearInterval(check);
                console.log('✅ [GUARD] SessionManager ready');
                resolve();
            } else if (attempts > 30) {
                clearInterval(check);
                reject(new Error('SessionManager timeout'));
            }
        }, 100);
    });
}

// ==============================================
// 4️⃣ UNLOCK PAGE
// ==============================================

function unlockPage() {
    console.log('🚀 [GUARD] Unlocking page...');
    
    // Remove lock style
    const lockStyle = document.getElementById('auth-lock');
    if (lockStyle) lockStyle.remove();
    
    // Remove loading
    const loadingDiv = document.getElementById('auth-loading');
    if (loadingDiv) loadingDiv.remove();
    
    // Show body
    if (document.body) {
        document.body.style.display = '';
        document.body.style.opacity = '1';
    }
    
    console.log('✅ [GUARD] Page unlocked');
    
    // Initialize app
    if (typeof window.iniciarSistemaCompleto === 'function') {
        console.log('🚀 [GUARD] Starting app...');
        window.iniciarSistemaCompleto();
    } else {
        console.warn('⚠️ [GUARD] iniciarSistemaCompleto not found');
    }
}

// ==============================================
// 5️⃣ START WHEN DOM READY
// ==============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebaseNow);
} else {
    initializeFirebaseNow();
}

console.log('✅ [GUARD] Loaded');
