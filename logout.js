// ==============================================
// LOGOUT.JS - GERENCIAMENTO DE LOGOUT
// ==============================================

// FUNÇÃO DE LOGOUT
function fazerLogout() {
    if (confirm('⚠️ Tem certeza que deseja sair?')) {
        firebase.auth().signOut()
            .then(() => {
                console.log('✅ Logout realizado com sucesso');
                localStorage.removeItem('rememberedEmail');
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('❌ Erro ao fazer logout:', error);
                alert('❌ Erro ao fazer logout. Tente novamente.');
            });
    }
}

// EXIBIR EMAIL DO USUÁRIO LOGADO NO HEADER
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) {
            userEmailEl.textContent = user.email;
        }
    }
});

// EXPOR FUNÇÃO GLOBALMENTE
window.fazerLogout = fazerLogout;