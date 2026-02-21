const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// ==========================================
// 🔐 SET CUSTOM CLAIMS - OFICINA
// ==========================================

exports.setUserOficinaClaim = functions.https.onCall(async (data, context) => {
  // Validação de autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    );
  }

  const { uid, oficina_id, role } = data;

  // Validação de parâmetros
  if (!uid || !oficina_id) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'uid e oficina_id são obrigatórios'
    );
  }

  try {
    // Setar custom claims
    await admin.auth().setCustomUserClaims(uid, {
      oficina_id: oficina_id,
      role: role || 'user',
      updated_at: Date.now()
    });

    console.log(`✅ Custom claims setados para ${uid}:`, { oficina_id, role });

    return { 
      success: true, 
      message: 'Claims atualizados com sucesso',
      oficina_id: oficina_id,
      role: role || 'user'
    };

  } catch (error) {
    console.error('❌ Erro ao setar claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao configurar permissões do usuário'
    );
  }
});

// ==========================================
// 📄 GET USER CLAIMS (DEBUG)
// ==========================================

exports.getUserClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    );
  }

  try {
    const user = await admin.auth().getUser(context.auth.uid);
    return {
      success: true,
      claims: user.customClaims || {},
      uid: user.uid,
      email: user.email
    };
  } catch (error) {
    console.error('❌ Erro ao buscar claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao buscar permissões'
    );
  }
});

// ==========================================
// 🆕 TRIGGER: AUTO-ASSIGN AO CRIAR USUÁRIO
// ==========================================

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  console.log('🆕 Novo usuário criado:', user.uid);

  // MUDAR PARA FALSO SE NÃO QUISER AUTO-ASSIGN
  const AUTO_ASSIGN_OFICINA = true;

  if (AUTO_ASSIGN_OFICINA) {
    // Criar ou buscar oficina padrão
    const oficinaRef = admin.firestore().collection('oficinas').doc('modelo');
    const oficinaDoc = await oficinaRef.get();

    if (!oficinaDoc.exists) {
      // Criar oficina modelo
      await oficinaRef.set({
        nome: 'Nossa Oficina',
        criado_em: admin.firestore.Timestamp.now(),
        ativo: true
      });
    }

    // Setar claims
    await admin.auth().setCustomUserClaims(user.uid, {
      oficina_id: 'modelo',
      role: 'user',
      auto_assigned: true
    });

    console.log(`✅ Auto-assigned ${user.uid} → oficina: modelo`);
  }

  return null;
});

// ==========================================
// 🛠️ MIGRAÇÃO: ATUALIZAR USUÁRIOS EXISTENTES
// ==========================================

exports.migrateExistingUsers = functions.https.onCall(async (data, context) => {
  // ATENÇÃO: SÓ ADMIN PODE EXECUTAR
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Somente administradores podem migrar usuários'
    );
  }

  const { oficina_id_padrao } = data;

  if (!oficina_id_padrao) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'oficina_id_padrao é obrigatório'
    );
  }

  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const updates = [];

    for (const user of listUsersResult.users) {
      // Verificar se já tem claims
      if (!user.customClaims || !user.customClaims.oficina_id) {
        updates.push(
          admin.auth().setCustomUserClaims(user.uid, {
            oficina_id: oficina_id_padrao,
            role: 'user',
            migrated: true,
            migrated_at: Date.now()
          })
        );
      }
    }

    await Promise.all(updates);

    console.log(`✅ Migrados ${updates.length} usuários`);

    return {
      success: true,
      usuarios_migrados: updates.length,
      total_usuarios: listUsersResult.users.length
    };

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao migrar usuários'
    );
  }
});

console.log('✅ Firebase Functions carregadas - Custom Claims v1.0');