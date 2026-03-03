// ==============================================
// 🔥 FIREBASE INITIALIZATION FOR APP.HTML
// ==============================================
// Must run BEFORE app-auth-guard.js
// Initializes Firebase using window.FIREBASE_CONFIG

(function() {
  console.log('🔥 [FIREBASE-INIT] Starting Firebase initialization...');

  // Check if Firebase SDK is loaded
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK not loaded!');
    return;
  }

  // Check if config exists
  if (!window.FIREBASE_CONFIG) {
    console.error('❌ FIREBASE_CONFIG not found!');
    return;
  }

  // Check if already initialized
  if (firebase.apps && firebase.apps.length > 0) {
    console.log('✅ Firebase already initialized');
    return;
  }

  // Initialize Firebase
  try {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    console.log('✅ Firebase initialized successfully');
    console.log('📦 Project ID:', window.FIREBASE_CONFIG.projectId);
    console.log('📦 Auth Domain:', window.FIREBASE_CONFIG.authDomain);
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
  }

})();
