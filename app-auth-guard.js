(function () {

  // 🔒 Bloqueio seguro sem acessar elementos inexistentes
  document.documentElement.style.display = "none";

  window.addEventListener("load", async () => {

    console.log('🔒 [AUTH-GUARD] Starting validation...');

    try {

      // 1️⃣ Check Firebase initialized
      if (!firebase.apps.length) {
        console.error("❌ Firebase não inicializado.");
        window.location.href = "index.html";
        return;
      }
      console.log('✅ Firebase initialized');

      // 2️⃣ Wait for auth state
      const user = await new Promise(resolve => {
        firebase.auth().onAuthStateChanged(user => resolve(user));
      });

      if (!user) {
        console.warn('❌ No user authenticated');
        window.location.href = "index.html";
        return;
      }
      console.log('✅ User authenticated:', user.email);

      // 3️⃣ Check SessionManager
      if (!window.sessionManager) {
        console.error("❌ SessionManager não disponível.");
        window.location.href = "index.html";
        return;
      }
      console.log('✅ SessionManager available');

      // 4️⃣ Validate session
      console.log('🔍 Validating session limit...');
      const result = await window.sessionManager.validateAndRegisterSession();

      if (!result.allowed) {
        console.error('❌ Session blocked:', result.message);
        await firebase.auth().signOut();
        window.location.href = "index.html";
        return;
      }
      console.log('✅ Session validated');

      // ✅ Liberar renderização
      console.log('🚀 Unlocking page...');
      document.documentElement.style.display = "block";
      
      // Remove loading screen
      const authLoading = document.getElementById('auth-loading');
      if (authLoading) authLoading.remove();
      
      const authLock = document.getElementById('auth-lock');
      if (authLock) authLock.remove();
      
      console.log('✅ Page unlocked - ready to render');

    } catch (err) {
      console.error("❌ Erro no Auth Guard:", err);
      window.location.href = "index.html";
    }

  });

})();
