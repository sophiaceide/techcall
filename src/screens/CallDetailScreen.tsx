import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
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
  const [saving, setSaving] = useState(false);

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

    setSaving(true);

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
    } finally {
      setSaving(false);
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
      <Text style={styles.text}>
        {chamado.description}
      </Text>

      <Text style={styles.label}>Foto:</Text>

      {chamado.photoUri ? (
        <Image
          source={{ uri: chamado.photoUri }}
          style={styles.photo}
        />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.placeholderText}>
            Nenhuma foto anexada.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Endereço:</Text>
      <Text style={styles.text}>
        {chamado.address ?? 'Não informado'}
      </Text>

      <Text style={styles.label}>Status:</Text>
      <Text style={styles.status}>
        {chamado.status}
      </Text>

      {chamado.status === 'aberto' && (
        <>
          <TouchableOpacity
            style={styles.button}
            onPress={() => mudarStatus('atendendo')}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving
                ? 'Salvando...'
                : 'Iniciar Atendimento'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => mudarStatus('cancelado')}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving
                ? 'Salvando...'
                : 'Cancelar Chamado'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {chamado.status === 'atendendo' && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => mudarStatus('concluido')}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving
              ? 'Salvando...'
              : 'Concluir Atendimento'}
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
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  label: {
    fontSize: 19,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 7,
  },

  text: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },

  photo: {
    width: '100%',
    height: 360,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
    resizeMode: 'cover',
  },

  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    color: '#999',
    fontSize: 15,
  },

  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textTransform: 'capitalize',
  },

  button: {
    backgroundColor: '#5797cb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    width: '85%',
    alignSelf: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  cancelButton: {
    backgroundColor: '#c62828',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    width: '85%',
    alignSelf: 'center',
    marginTop: 10,
  },
});
