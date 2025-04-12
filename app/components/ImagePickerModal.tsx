import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useThemeColor } from '@/app/hooks/useThemeColor';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export type ImageFile = {
  uri: string;
  name: string;
  type: string;
};

type ImagePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (image: ImageFile) => void;
};

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onImageSelected,
}) => {
  const iconColor = useThemeColor({}, 'icon');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  const checkCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    return status === 'granted';
  };

  const handleTakePhoto = async () => {
    const hasPermission = cameraPermission ?? await checkCameraPermissions();
    
    if (!hasPermission) {
      alert('Se necesita acceso a la cámara para tomar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const name = uri.split('/').pop() || 'photo.jpg';
      // Determine file type from uri
      const type = 'image/' + (name.split('.').pop()?.toLowerCase() || 'jpeg');
      
      onImageSelected({ uri, name, type });
      onClose();
    }
  };

  const handleChooseFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Se necesita acceso a la galería para seleccionar imágenes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const name = uri.split('/').pop() || 'photo.jpg';
      // Determine file type from uri
      const type = 'image/' + (name.split('.').pop()?.toLowerCase() || 'jpeg');
      
      onImageSelected({ uri, name, type });
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <ThemedView style={styles.modalView}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            Seleccionar imagen
          </ThemedText>

          <TouchableOpacity
            style={styles.option}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera-outline" size={24} color={iconColor} />
            <ThemedText style={styles.optionText}>Tomar Foto</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={handleChooseFromGallery}
          >
            <Ionicons name="images-outline" size={24} color={iconColor} />
            <ThemedText style={styles.optionText}>Seleccionar de Galería</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, styles.cancelOption]}
            onPress={onClose}
          >
            <Ionicons name="close-outline" size={24} color={iconColor} />
            <ThemedText style={styles.optionText}>Cancelar</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
  },
  cancelOption: {
    marginTop: 10,
  },
}); 