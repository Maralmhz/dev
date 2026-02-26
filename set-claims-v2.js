const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Verificar service account
const saPath = path.join(__dirname, 'service-account.json');
console.log('📁 Verificando:', saPath);

if (!fs.existsSync(saPath)) {
  console.error('❌ service-account.json NÃO ENCONTRADO!');
  process.exit(1);
}

console.log('✅ Service account carregado');

const serviceAccount = require(saPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

(async () => {
  try {
    const uid = 'hhiMuwHaijQpJYQqWKvmDDaoknj1';
    const claims = {
      role: 'super_admin',
      oficina_id: 'modelo',
      super_admin: true
    };
    
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log('🎉 SUCESSO! Claims aplicados:');
    console.log(JSON.stringify(claims, null, 2));
    console.log('\n✅ Faça logout/login no seu app Flutter!');
  } catch (error) {
    console.error('❌ Erro detalhado:', error.message);
  }
})();
