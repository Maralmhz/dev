// perfil-usuario.js - Sistema Seguro de Perfil do Usuário
// ==========================================================

(function() {
    'use strict';
    
    console.log('👤 Módulo Perfil carregado');
    
    // Inicializar Firebase
    if (window.FIREBASE_CONFIG && !firebase.apps.length) {
        firebase.initializeApp(window.FIREBASE_CONFIG);
    }
    
    let currentUser = null;
    let userData = null;
    
    // Verificar autenticação ao carregar
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            alert('❌ Você precisa estar logado!');
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = user;
        await carregarDadosUsuario();
    });
    
    // Carregar dados do usuário
    async function carregarDadosUsuario() {
        try {
            const uid = currentUser.uid;
            const db = firebase.firestore();
            
            // Buscar dados no Firestore
            const userDoc = await db.collection('usuarios').doc(uid).get();
            
            if (!userDoc.exists) {
                throw new Error('Dados do usuário não encontrados');
            }
            
            userData = userDoc.data();
            
            // Preencher informações na tela
            document.getElementById('userName').textContent = userData.nome || 'Não informado';
            document.getElementById('userEmail').textContent = currentUser.email;
            
            // Plano
            const plano = userData.plano || 'starter';
            const planosEmoji = {
                'starter': '🚀 Starter',
                'professional': '🔥 Professional',
                'enterprise': '🏢 Enterprise'
            };
            document.getElementById('userPlano').innerHTML = `<span class="badge-plano">${planosEmoji[plano]}</span>`;
            
            // Oficina ID
            document.getElementById('userOficinaId').textContent = userData.oficinaId || 'Não vinculado';
            
            // Role
            const role = userData.role || 'user';
            const roleLabel = role === 'owner' ? '👑 Proprietário' : role === 'admin' ? '🔧 Admin' : '👥 Usuário';
            document.getElementById('userRole').innerHTML = `<span class="badge-role">${roleLabel}</span>`;
            
            // Data de criação
            if (userData.createdAt) {
                const data = userData.createdAt.toDate();
                document.getElementById('dataCriacao').textContent = data.toLocaleString('pt-BR');
            } else {
                document.getElementById('dataCriacao').textContent = 'Não disponível';
            }
            
            // Última mudança de senha
            if (userData.ultimaMudancaSenha) {
                const data = userData.ultimaMudancaSenha.toDate();
                document.getElementById('ultimaMudancaSenha').textContent = data.toLocaleString('pt-BR');
            }
            
            console.log('✅ Dados carregados:', userData);
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            showAlert('Erro ao carregar dados do perfil', 'error');
        }
    }
    
    // Toggle visibilidade da senha
    window.togglePasswordVisibility = function(inputId) {
        const input = document.getElementById(inputId);
        const button = input.nextElementSibling;
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
        } else {
            input.type = 'password';
            button.textContent = '👁️';
        }
    };
    
    // Força da senha
    document.getElementById('novaSenha')?.addEventListener('input', function() {
        const senha = this.value;
        const strengthDiv = document.getElementById('passwordStrength');
        
        if (!senha) {
            strengthDiv.innerHTML = '';
            return;
        }
        
        let strength = 0;
        
        // Critérios de força
        if (senha.length >= 8) strength++;
        if (senha.length >= 12) strength++;
        if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) strength++;
        if (/[0-9]/.test(senha)) strength++;
        if (/[^a-zA-Z0-9]/.test(senha)) strength++;
        
        let className = '';
        let label = '';
        
        if (strength <= 2) {
            className = 'strength-weak';
            label = 'Fraca';
        } else if (strength <= 4) {
            className = 'strength-medium';
            label = 'Média';
        } else {
            className = 'strength-strong';
            label = 'Forte';
        }
        
        strengthDiv.innerHTML = `
            <div class="password-strength-bar ${className}"></div>
            <div style="margin-top: 5px; font-size: 12px; color: #666;">Força: ${label}</div>
        `;
    });
    
    // Mostrar alertas
    function showAlert(message, type = 'info') {
        const alertDiv = document.getElementById('alertPerfil');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';
        
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 5000);
    }
    
    // Formulário de alterar senha
    document.getElementById('formAlterarSenha')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const senhaAtual = document.getElementById('senhaAtual').value;
        const novaSenha = document.getElementById('novaSenha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        const btnSalvar = document.getElementById('btnSalvarSenha');
        
        // Validações
        if (novaSenha.length < 8) {
            showAlert('❌ A nova senha deve ter no mínimo 8 caracteres', 'error');
            return;
        }
        
        if (novaSenha !== confirmarSenha) {
            showAlert('❌ As senhas não coincidem', 'error');
            return;
        }
        
        if (senhaAtual === novaSenha) {
            showAlert('❌ A nova senha deve ser diferente da atual', 'error');
            return;
        }
        
        // Validar força da senha
        if (!/[a-zA-Z]/.test(novaSenha) || !/[0-9]/.test(novaSenha)) {
            showAlert('❌ A senha deve conter letras e números', 'error');
            return;
        }
        
        btnSalvar.disabled = true;
        btnSalvar.textContent = '⏳ Salvando...';
        
        try {
            // 1. RE-AUTENTICAR usuário (segurança)
            console.log('🔒 Re-autenticando usuário...');
            const credential = firebase.auth.EmailAuthProvider.credential(
                currentUser.email,
                senhaAtual
            );
            
            await currentUser.reauthenticateWithCredential(credential);
            console.log('✅ Re-autenticação bem-sucedida');
            
            // 2. ATUALIZAR SENHA no Firebase Auth
            await currentUser.updatePassword(novaSenha);
            console.log('✅ Senha atualizada no Firebase Auth');
            
            // 3. REGISTRAR no Firestore (auditoria)
            const db = firebase.firestore();
            await db.collection('usuarios').doc(currentUser.uid).update({
                ultimaMudancaSenha: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // 4. LOG de auditoria
            await db.collection('auditoria_senhas').add({
                uid: currentUser.uid,
                email: currentUser.email,
                acao: 'senha_alterada',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ip: 'N/A',
                userAgent: navigator.userAgent
            });
            
            console.log('✅ Senha alterada com sucesso!');
            
            // Limpar formulário
            document.getElementById('formAlterarSenha').reset();
            document.getElementById('passwordStrength').innerHTML = '';
            
            showAlert('✅ Senha alterada com sucesso!', 'success');
            
            // Atualizar data na tela
            document.getElementById('ultimaMudancaSenha').textContent = new Date().toLocaleString('pt-BR');
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                window.location.href = 'app.html';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro ao alterar senha:', error);
            
            let mensagem = 'Erro ao alterar senha';
            
            if (error.code === 'auth/wrong-password') {
                mensagem = '❌ Senha atual incorreta';
            } else if (error.code === 'auth/weak-password') {
                mensagem = '❌ Senha muito fraca';
            } else if (error.code === 'auth/requires-recent-login') {
                mensagem = '❌ Sessão expirada. Faça login novamente';
                setTimeout(() => {
                    firebase.auth().signOut();
                    window.location.href = 'index.html';
                }, 2000);
            }
            
            showAlert(mensagem, 'error');
            
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = '✅ Salvar Nova Senha';
        }
    });
    
    console.log('✅ Sistema de perfil inicializado');
})();
