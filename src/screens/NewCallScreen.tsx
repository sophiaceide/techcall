import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, ALUNO_ID } from '../firebase/config';

import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function NewCallScreen() {
  const navigation = useNavigation<any>();  
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Endereço já convertido, pronto para exibir na tela
  const [address, setAddress] = useState<string | null>(null);
  // Controla o texto "Buscando localização..." enquanto aguardamos o GPS
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  // Função para tirar foto com a câmera
  async function handleTakePhoto() {
    // 1. Pede permissão para usar a câmera
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Precisamos da câmera para o chamado.');
      return;
    }

    // 2. Abre a câmera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, // Permite cortar a foto
      aspect: [4, 3], // Proporção da imagem
      quality: 0.7, // Qualidade (70% para não pesar o app)
    });

    // 3. Se o usuário não cancelou, salva o endereço (URI) da foto
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  // Função para escolher da galeria
  async function handlePickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Precisamos acessar suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  // Função para obter a localização GPS
  async function handleGetLocation() {
    // 1. Pede permissão de localização em primeiro plano
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Precisamos da localização para o check-in.');
      return;
    }

    setLoadingLocation(true);
    try {
      // 2. Verifica se o GPS do aparelho está ligado
      const gpsAtivo = await Location.hasServicesEnabledAsync();
      if (!gpsAtivo) {
        Alert.alert('GPS desligado', 'Ative a localização do aparelho e tente novamente.');
        return;
      }

      // 3. Captura latitude e longitude atuais
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 4. Reverse Geocoding: transforma coordenadas em endereço legível
      const [local] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (local) {
        const enderecoFormatado = `${local.street ?? 'Endereço não identificado'}, ${local.city ?? ''} - ${local.region ?? ''}`;
        setAddress(enderecoFormatado);
      } else {
        setAddress('Endereço não encontrado para esta coordenada.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter a localização. Tente novamente.');
    } finally {
      setLoadingLocation(false);
    }
  }
    async function handleCreateCall() {
    setSaving(true);

    try {
      await addDoc(collection(db, 'alunos', ALUNO_ID, 'chamados'), {
        description,
        photoUri,
        address,
        status: 'aberto',
        criadoEm: serverTimestamp(),
      });

      Alert.alert('Sucesso', 'Chamado registrado!');
      setDescription('');
      setPhotoUri(null);
      setAddress(null);
      navigation.navigate('CallList');
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível salvar o chamado. Tente novamente.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Novo Chamado</Text>
      <Text style={styles.label}>Descrição do problema</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: Notebook não liga..."
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Foto do equipamento</Text>
      {/* Renderização Condicional: Se tem foto, mostra a imagem. Se não, mostra o aviso. */}
      {photoUri ? (
        <View>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <TouchableOpacity
            onPress={() => setPhotoUri(null)}
            style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Remover foto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Nenhuma foto anexada</Text>
        </View>
      )}

       <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.cameraButton]}
          onPress={handleTakePhoto}>
          <Text style={styles.buttonText}>Câmera</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.galleryButton]}
          onPress={handlePickFromGallery}>
          <Text style={styles.buttonText}>Galeria</Text>
        </TouchableOpacity>
      </View>


      {/* Seção de Localização */}
      <Text style={[styles.label, styles.locationLabel]}>Localização do chamado</Text>
      {loadingLocation ? (
        <Text style={styles.placeholderText}>Buscando localização...</Text>
      ) : address ? (
        <Text style={styles.addressText}>{address}</Text>
      ) : (
        <Text style={styles.placeholderText}>Nenhuma localização registrada</Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.locationButton]}
        onPress={handleGetLocation}
        disabled={loadingLocation}
      >
        <Text style={styles.buttonText}>
          {loadingLocation ? 'Buscando...' : 'Registrar localização'}
        </Text>
      </TouchableOpacity>

     
      <TouchableOpacity
        style={[
          styles.button,
          styles.confirmButton,
          (!description || saving) && styles.disabledButton,
        ]}
        disabled={!description || saving}
        onPress={handleCreateCall}
        >
        <Text style={styles.buttonText}>
          {saving ? 'Salvando...' : 'Criar Chamado'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  content: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  label: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  placeholder: {
    height: 160,
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
  },

  photo: {
    width: '100%',
    height: 320,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
    resizeMode: 'cover',
  },

  removeButton: {
    marginTop: 8,
    alignItems: 'center',
  },

  removeButtonText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },

   locationButton: {
    backgroundColor: '#695ea8',
    marginTop: 25,
    marginBottom: 18,
    width: '85%',
    alignSelf: 'center',
  },

  confirmButton: {
    backgroundColor: '#5797cb',
    marginTop: 18,
    width: '85%',
    alignSelf: 'center',
  },

  button: {
  flex: 1,
  borderRadius: 8,
  padding: 14,
  alignItems: 'center',
},

  cameraButton: {
    backgroundColor: '#9978bb',
  },

  galleryButton: {
    backgroundColor: '#9978bb',
  },


  disabledButton: {
    backgroundColor: '#90CAF9',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },

  locationLabel: {
  marginTop: 35,
},
});