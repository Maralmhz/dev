import 'package:cloud_firestore/cloud_firestore.dart';

class SaasHelpers {
  static FirebaseFirestore get firestore => FirebaseFirestore.instance;
  
  static CollectionReference collection(String nome) {
    return firestore.collection('oficinas').doc('modelo').collection(nome);
  }
  
  static CollectionReference get ordensServico => collection('ordens_servico');
  
  static Future<String> getOficinaId() async {
    return 'modelo'; // Depois pega dos claims
  }
}
