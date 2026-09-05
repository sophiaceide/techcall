import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { db, ALUNO_ID } from '../firebase/config';

type Chamado = {
  description: string;
  photoUri?: string | null;
  address?: string | null;
  status: string;
};

export default function CallDetailScreen({ route }: any) {
  const { chamadoId } = route.params;

  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarChamado() {
      try {
        const chamadoRef = doc(
          db,
          'alunos',
          ALUNO_ID,
          'chamados',
          chamadoId
        );

        const snapshot = await getDoc(chamadoRef);

        if (snapshot.exists()) {
          setChamado(snapshot.data() as Chamado);
        } else {
          Alert.alert('Erro', 'Chamado não encontrado.');
        }
      } catch (error) {
        Alert.alert(
          'Erro',
          'Não foi possível carregar o chamado.'
        );
      } finally {
        setLoading(false);
      }
    }

    carregarChamado();
  }, [chamadoId]);

  async function mudarStatus(novoStatus: string) {
    if (!chamado) return;

    try {
      const chamadoRef = doc(
        db,
        'alunos',
        ALUNO_ID,
        'chamados',
        chamadoId
      );

      await updateDoc(chamadoRef, {
        status: novoStatus,
      });

      setChamado({
        ...chamado,
        status: novoStatus,
      });
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível atualizar o status.'
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!chamado) {
    return (
      <View style={styles.center}>
        <Text>Chamado não encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Detalhes do Chamado</Text>

      <Text style={styles.label}>Descrição:</Text>
      <Text style={styles.text}>{chamado.description}</Text>

      <Text style={styles.label}>Endereço:</Text>
      <Text style={styles.text}>
        {chamado.address ?? 'Não informado'}
      </Text>

      <Text style={styles.label}>Status:</Text>
      <Text style={styles.status}>{chamado.status}</Text>

      {chamado.status === 'aberto' && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => mudarStatus('em atendimento')}
        >
          <Text style={styles.buttonText}>
            Iniciar atendimento
          </Text>
        </TouchableOpacity>
      )}

      {chamado.status === 'em atendimento' && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => mudarStatus('resolvido')}
        >
          <Text style={styles.buttonText}>
            Marcar como resolvido
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },

  text: {
    fontSize: 16,
  },

  status: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});