import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const SCAN_FRAME_SIZE = Math.min(screenWidth, screenHeight) * 0.6;

export default function QRScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraType] = useState<"front" | "back">("back");

  // Animation values
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cornerAnim = useRef(new Animated.Value(0)).current;

  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint") || "#007AFF";

  useEffect(() => {
    // Start scanning line animation
    const startScanLineAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    // Start corner animation
    const startCornerAnimation = () => {
      Animated.loop(
        Animated.timing(cornerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        })
      ).start();
    };

    startScanLineAnimation();
    startCornerAnimation();
  }, [scanLineAnim, cornerAnim]);

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    Alert.alert("QR Detectado", `Tipo: ${type}\nDatos: ${data}`);
    // Here you would handle the QR code data
    // For now, just show an alert
  };

  const handleMyQR = () => {
    // TODO: Navigate to My QR screen
    Alert.alert("Mi QR", "Navegar a Mi QR");
  };

  const handleCapture = () => {
    // TODO: Implement camera capture
    Alert.alert("Capturar", "Capturar imagen");
  };

  const handleUpload = () => {
    // TODO: Navigate to upload screen
    Alert.alert("Subir", "Navegar a pantalla de subir");
  };

  const handleBackPress = () => {
    router.back();
  };

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }
  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No access to camera</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Camera View */}
        <CameraView
          style={styles.camera}
          facing={cameraType}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          {/* Dark Overlay */}
          <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <ThemedText style={styles.headerTitle}>Escanear QR</ThemedText>
              <View style={styles.headerSpacer} />
            </View>

            {/* Scanning Frame */}
            <View style={styles.scanFrameContainer}>
              <View style={styles.scanFrame}>
                {/* Corner Indicators */}
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />

                {/* Animated Scanning Line */}
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, SCAN_FRAME_SIZE - 2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </View>

            {/* Instruction Text */}
            <View style={styles.instructionContainer}>
              <ThemedText style={styles.instructionText}>
                Coloca el código QR dentro del marco
              </ThemedText>
            </View>

            {/* Bottom Action Buttons */}
            <View style={styles.bottomContainer}>
              {/* Mi QR Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMyQR}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code-outline" size={24} color="white" />
                <ThemedText style={styles.actionButtonText}>Mi QR</ThemedText>
              </TouchableOpacity>

              {/* Camera Capture Button */}
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={32} color="white" />
              </TouchableOpacity>

              {/* Upload Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleUpload}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={24} color="white" />
                <ThemedText style={styles.actionButtonText}>Subir</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  headerSpacer: {
    width: 40,
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#007AFF",
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 20,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 20,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 20,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 20,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#007AFF",
    borderRadius: 1,
  },
  instructionContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    marginBottom: 60,
  },
  instructionText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    lineHeight: 22,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    minWidth: 80,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
});
