import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  TextInput,
} from "react-native";

let Camera: any = null;
let requestCameraPermissionsAsync: any = null;
let getCameraPermissionsAsync: any = null;

try {
  const expoCamera = require("expo-camera");
  Camera = expoCamera.Camera;
  requestCameraPermissionsAsync = expoCamera.requestCameraPermissionsAsync;
  getCameraPermissionsAsync = expoCamera.getCameraPermissionsAsync;
} catch (e) {
  console.warn("Camera module not available, using manual input mode");
}

import { useWalletStore } from "../store";

const { width } = Dimensions.get("window");

export function QRScannerScreen({ navigation }: any) {
  const [scanning, setScanning] = useState(!!Camera); // Only scan if Camera is available
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const cameraRef = useRef<any>(null);

  // Request camera permission on mount (if available)
  useEffect(() => {
    if (!Camera || !getCameraPermissionsAsync) return;
    
    const checkPermission = async () => {
      try {
        const permission = await getCameraPermissionsAsync();
        if (!permission.granted) {
          const result = await requestCameraPermissionsAsync();
          if (!result.granted) {
            Alert.alert("Permission Denied", "Camera access is required to scan QR codes");
            setScanning(false);
          }
        }
      } catch (e) {
        console.warn("Camera permission check failed:", e);
        setScanning(false);
      }
    };
    checkPermission();
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    try {
      const request = JSON.parse(data);
      if (request.type === "presentation_request" || request.requestId) {
        setScannedData(data);
        setScanning(false);
      } else {
        Alert.alert("Invalid QR Code", "QR code doesn't contain a valid presentation request");
      }
    } catch {
      Alert.alert("Error", "Failed to parse QR code data");
    }
  };

  const handleManualInput = () => {
    Alert.prompt("Enter Request Code", "Paste your request code here", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Process",
        onPress: (input) => {
          if (input) {
            try {
              const data = JSON.parse(input);
              setScannedData(input);
              setScanning(false);
            } catch {
              Alert.alert("Error", "Invalid request code format");
            }
          }
        },
      },
    ]);
  };

  const handleProcessRequest = () => {
    if (scannedData) {
      try {
        const request = JSON.parse(scannedData);
        navigation.navigate("PresentationHome", {
          requestId: request.requestId,
          verifierDid: request.verifierDid,
          credentials: request.credentials,
        });
      } catch {
        Alert.alert("Error", "Failed to process request");
      }
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      Alert.alert("Error", "Please enter a request code");
      return;
    }
    
    try {
      const data = JSON.parse(manualInput);
      if (data.requestId || data.type === "presentation_request") {
        setScannedData(manualInput);
        setManualInput("");
      } else {
        Alert.alert("Error", "Invalid request code format");
      }
    } catch {
      Alert.alert("Error", "Invalid JSON format");
    }
  };

  return (
    <View style={styles.container}>
      {scanning && Camera ? (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          onBarCodeScanned={handleBarcodeScanned}
          barCodeScannerSettings={{
            barCodeTypes: ["qr"],
          }}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              
              <View style={styles.scanLine} />
            </View>
            
            <Text style={styles.scannerTitle}>Point camera at QR code</Text>
            <Text style={styles.scannerSubtitle}>
              Position the code within the frame
            </Text>
          </View>
        </Camera>
      ) : scannedData ? (
        <ScrollView style={styles.resultContent}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>

          <Text style={styles.successTitle}>Request Detected</Text>
          
          <View style={styles.requestCard}>
            <Text style={styles.cardTitle}>Presentation Request</Text>
            
            {scannedData && (() => {
              const request = JSON.parse(scannedData);
              return (
                <>
                  <DetailRow
                    label="Verifier"
                    value={request.verifierDid}
                  />
                  <DetailRow
                    label="Requested Credentials"
                    value={request.credentials?.join(", ") || "N/A"}
                  />
                  <DetailRow
                    label="Challenge"
                    value={request.challenge?.substring(0, 12) + "..."}
                  />
                </>
              );
            })()}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🔒 Review the details before sharing your credentials
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.manualInputContainer}>
          <View style={styles.manualHeader}>
            <Text style={styles.manualTitle}>
              {Camera ? "Manual Entry" : "Enter Request Code"}
            </Text>
            <Text style={styles.manualSubtitle}>
              {Camera 
                ? "Or paste your request code if QR scanning isn't working"
                : "Camera is not available. Please enter your request code manually"}
            </Text>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Paste request code here (JSON format)"
              placeholderTextColor="#9ca3af"
              value={manualInput}
              onChangeText={setManualInput}
              multiline
              editable={true}
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleManualSubmit}
          >
            <Text style={styles.submitButtonText}>Process Code</Text>
          </TouchableOpacity>

          {Camera && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Tap "Scan QR Code" to use your camera instead
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.buttonContainer}>
        {scannedData && (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#6b7280" }]}
              onPress={() => {
                setScannedData(null);
                setScanning(!!Camera);
              }}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleProcessRequest}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </>
        )}
        
        {!scannedData && (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#6b7280" }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            {Camera && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => setScanning(true)}
              >
                <Text style={styles.buttonText}>Scan QR Code</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#3b82f6",
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#3b82f6",
    opacity: 0.7,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  scannerSubtitle: {
    fontSize: 14,
    color: "#d1d5db",
    textAlign: "center",
    marginBottom: 32,
  },
  manualButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  manualButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  resultContent: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#10b981",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#fff",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
  },
  requestCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f3f4f6",
    marginBottom: 12,
  },
  detailRow: {
    borderTopWidth: 1,
    borderTopColor: "#374151",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#e5e7eb",
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: "#93c5fd",
    lineHeight: 18,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    flexDirection: "row",
  },
  button: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  manualInputContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#1f2937",
  },
  manualHeader: {
    marginBottom: 24,
    marginTop: 12,
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  manualSubtitle: {
    fontSize: 14,
    color: "#d1d5db",
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
