import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'helpers/saas_helpers.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Oficina SaaS - Modelo',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: HomeSaaS(),
    );
  }
}

class HomeSaaS extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('🚗 Oficina SaaS'),
        backgroundColor: Colors.green[700],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: SaasHelpers.ordensServico
            .orderBy('criado_em', descending: true)
            .limit(20)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return Center(child: Text('Nenhuma OS encontrada'));
          }
          
          final docs = snapshot.data!.docs;
          return ListView.builder(
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final os = docs[index].data() as Map<String, dynamic>;
              return Card(
                child: ListTile(
                  title: Text(os['placa'] ?? 'Sem placa'),
                  subtitle: Text('OS #${docs[index].id}\n${os['cliente'] ?? 'Sem cliente'}'),
                  trailing: Icon(Icons.assignment),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
