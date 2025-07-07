import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';

interface DocumentCameraProps {
  onPictureTaken: (base64: string) => void;
  overlayType: 'id-card' | 'face';
}

const DocumentCamera: React.FC<DocumentCameraProps> = ({ onPictureTaken, overlayType }) => {
  const [facing, setFacing] = useState<'front' | 'back'>(overlayType === 'face' ? 'front' : 'back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      setPreview(photo.uri);
      setBase64(photo.base64 || null);
    }
  };

  const confirmPicture = () => {
    if (base64) {
      onPictureTaken(base64);
    }
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <ThemedText>We need your permission to show the camera</ThemedText>
        <ThemedButton onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const toggleFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  }

  const renderOverlay = () => {
    if (overlayType === 'id-card') {
      return <View style={styles.idCardOverlay} />;
    }
    if (overlayType === 'face') {
        return (
            <View style={styles.faceOverlay}>
              <View style={styles.faceOval} />
            </View>
          );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {preview ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: preview }} style={styles.previewImage} />
          <View style={styles.previewControls}>
            <ThemedButton title="Reintentar" onPress={() => setPreview(null)} type="secondary" />
            <ThemedButton title="Confirmar" onPress={confirmPicture} />
          </View>
        </View>
      ) : (
        <CameraView style={styles.camera} facing={facing} flash={flash} ref={cameraRef}>
          {renderOverlay()}
          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={toggleFlash}>
              <Ionicons name={flash === 'off' ? 'flash-off' : 'flash'} size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture} />
            <TouchableOpacity onPress={toggleFacing}>
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 20,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: '#ccc',
  },
  idCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOval: {
    width: 250,
    height: 350,
    borderRadius: 175,
    borderWidth: 2,
    borderColor: 'white',
    borderStyle: 'dashed',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 20,
    position: 'absolute',
    bottom: 0,
  },
});

export default DocumentCamera; 