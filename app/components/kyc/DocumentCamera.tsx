import { useKycStore } from '@/app/store';
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
  const { isLoading } = useKycStore();
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
    console.log("base64", base64 ? "yes" : "no");
    if (base64) {
      console.log("onPictureTaken");
      onPictureTaken(base64);
    }
  };

  // Show loading screen while uploading document
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Subiendo documento...</ThemedText>
      </View>
    );
  }

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
      return <View style={styles.idCardOverlay}>
        <View style={styles.idCardRect} />
      </View>;
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
          <View style={styles.controlsFloating}>
            <TouchableOpacity onPress={() => setPreview(null)} style={styles.iconButton}>
              <Ionicons name="trash" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmPicture} style={styles.captureButtonSmall}>
              <Ionicons name="checkmark" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraWrapper}>
          <CameraView style={styles.camera} facing={facing} flash={flash} ref={cameraRef} />
          {renderOverlay()}
          <View style={styles.controlsFloating}>
            <TouchableOpacity onPress={toggleFacing} style={styles.iconButton}>
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture} />
            <TouchableOpacity onPress={toggleFlash} style={styles.iconButton}>
              <Ionicons name={flash === 'off' ? 'flash-off' : 'flash'} size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
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
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  controlsFloating: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  captureButtonSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idCardRect: {
    width: '80%',
    aspectRatio: 1.6, // typical ID card ratio
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  faceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: 'white',
    fontSize: 20,
  },
});

export default DocumentCamera; 