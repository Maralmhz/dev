// ==============================================
// 🔒 APP AUTH GUARD - BLOCKING VALIDATION
// ==============================================
// This file MUST load BEFORE any app logic
// Blocks rendering until authentication is validated

(function() {
    'use strict';

    console.log('🔒 Auth Guard: Starting validation...');

    // ==============================================
    // WAIT FOR DOM TO BE READY
    // ==============================================
    
    function startGuard() {
        // ==============================================
        // BLOCK PAGE RENDERING
        // ==============================================
        
        if (document.body) {
            document.body.style.display = 'none';
            document.body.style.opacity = '0';
        }

        // ==============================================
        // VALIDATION TIMEOUT
        // ==============================================
        
        const MAX_WAIT = 5000; // 5 seconds max
        const startTime = Date.now();
        let authValidated = false;

        // ==============================================
        // WAIT FOR FIREBASE
        // ==============================================
        
        const waitForFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                clearInterval(waitForFirebase);
                console.log('✅ Firebase detected, starting auth check...');
                startAuthValidation();
            } else if (Date.now() - startTime > MAX_WAIT) {
                clearInterval(waitForFirebase);
                console.error('❌ Timeout: Firebase not loaded');
                redirectToLogin('❌ Erro ao carregar sistema');
            }
        }, 100);

        // ==============================================
        // AUTH VALIDATION FLOW
        // ==============================================
        
        async function startAuthValidation() {
            try {
                // Wait for auth state
                const user = await waitForAuthState();

                if (!user) {
                    console.warn('❌ No user authenticated');
                    redirectToLogin('❌ Faça login para continuar');
                    return;
                }

                console.log('✅ User authenticated:', user.email);

                // Check user status in Firestore
                const userDoc = await firebase.firestore()
                    .collection('usuarios')
                    .doc(user.uid)
                    .get();

                if (!userDoc.exists) {
                    console.error('❌ User document not found');
                    await firebase.auth().signOut();
                    redirectToLogin('❌ Usuário não encontrado');
                    return;
                }

                const userData = userDoc.data();

                // Check status
                if (userData.status !== 'ativo') {
                    console.warn('❌ User status:', userData.status);
                    await firebase.auth().signOut();
                    redirectToLogin('❌ Conta não ativa');
                    return;
                }

                // Check oficinaId
                if (!userData.oficinaId) {
                    console.error('❌ No oficinaId found');
                    await firebase.auth().signOut();
                    redirectToLogin('❌ Usuário sem oficina vinculada');
                    return;
                }

                // Set global config
                window.OFICINA_CONFIG = window.OFICINA_CONFIG || {};
                window.OFICINA_CONFIG.oficinaId = userData.oficinaId;
                sessionStorage.setItem('oficinaId', userData.oficinaId);
                sessionStorage.setItem('userRole', userData.role);
                sessionStorage.setItem('userEmail', user.email);

                console.log('✅ Oficina ID set:', userData.oficinaId);

                // Wait for SessionManager
                await waitForSessionManager();

                // Validate session limit
                console.log('🔍 Validating session limit...');
                const result = await window.sessionManager.validateAndRegisterSession();

                if (!result.allowed) {
                    console.error('❌ Session validation failed:', result.message);
                    await firebase.auth().signOut();
                    redirectToLogin(result.message);
                    return;
                }

                console.log('✅ Session validated successfully');
                authValidated = true;

                // ALLOW PAGE TO RENDER
                allowPageRender();

            } catch (error) {
                console.error('❌ Auth validation error:', error);
                redirectToLogin('❌ Erro ao validar autenticação');
            }
        }

        // ==============================================
        // HELPER: WAIT FOR AUTH STATE
        // ==============================================
        
        function waitForAuthState() {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Auth state timeout'));
                }, MAX_WAIT);

                const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve(user);
                });
            });
        }

        // ==============================================
        // HELPER: WAIT FOR SESSION MANAGER
        // ==============================================
        
        function waitForSessionManager() {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('SessionManager timeout'));
                }, 3000);

                const check = setInterval(() => {
                    if (window.sessionManager && typeof window.sessionManager.validateAndRegisterSession === 'function') {
                        clearInterval(check);
                        clearTimeout(timeout);
                        console.log('✅ SessionManager ready');
                        resolve();
                    }
                }, 100);
            });
        }

        // ==============================================
        // ALLOW PAGE RENDER
        // ==============================================
        
        function allowPageRender() {
            console.log('🚀 Auth validation complete - rendering app');
            
            // Remove auth lock
            const lockStyle = document.getElementById('auth-lock');
            if (lockStyle) lockStyle.remove();

            const loadingDiv = document.getElementById('auth-loading');
            if (loadingDiv) loadingDiv.remove();

            // Show content
            if (document.body) {
                document.body.style.display = '';
                document.body.style.opacity = '1';
            }

            // Trigger app initialization
            if (typeof window.iniciarSistemaCompleto === 'function') {
                window.iniciarSistemaCompleto();
            }
        }

        // ==============================================
        // REDIRECT TO LOGIN
        // ==============================================
        
        function redirectToLogin(message) {
            if (message) {
                sessionStorage.setItem('logoutMessage', message);
            }
            window.location.href = 'index.html';
        }

        // ==============================================
        // CLEANUP ON PAGE UNLOAD
        // ==============================================
        
        window.addEventListener('beforeunload', async () => {
            if (window.sessionManager && authValidated) {
                await window.sessionManager.cleanup();
            }
        });
    }

    // ==============================================
    // WAIT FOR DOM OR START IMMEDIATELY
    // ==============================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startGuard);
    } else {
        startGuard();
    }

    console.log('🔒 Auth Guard loaded - waiting for DOM...');

})();
