const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'oficina-dev-hallz'
});

async function setClaims() {
  const uid = 'hhiMuwHaijQpJYQqWKvmDDaoknj1';
  const claims = {
    role: 'super_admin',
    oficina_id: 'modelo',
    super_admin: true
  };

  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log('🎉 CLAIMS CONFIGURADOS!');
    console.log('👤 UID:', uid);
    console.log('🔑 Claims:', claims);
    console.log('✅ Logout/login no app para atualizar!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

setClaims();
