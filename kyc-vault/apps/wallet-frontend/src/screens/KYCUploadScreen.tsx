import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  FlatList,
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useWalletStore } from "../store";
import { api } from "../services/api";

const { width } = Dimensions.get("window");

interface DocumentTemplate {
  type: string;
  required: boolean;
  description: string;
  icon: string;
}

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    type: "passport",
    required: true,
    description: "Valid passport",
    icon: "🛂",
  },
  {
    type: "driver_license",
    required: false,
    description: "Driver's license",
    icon: "🚗",
  },
  {
    type: "national_id",
    required: false,
    description: "National ID card",
    icon: "🆔",
  },
  {
    type: "utility_bill",
    required: false,
    description: "Utility bill (proof of address)",
    icon: "📄",
  },
  {
    type: "selfie",
    required: true,
    description: "Clear selfie for verification",
    icon: "🤳",
  },
];

interface UploadedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export function KYCUploadScreen({ route, navigation }: any) {
  const { kycId } = route.params;
  const { did } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Map<string, UploadedFile>>(new Map());
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    createUploadSession();
  }, [kycId]);

  const createUploadSession = async () => {
    setLoading(true);
    try {
      const response = await api.createUploadSession(kycId, {
        requiredDocuments: DOCUMENT_TEMPLATES.map(d => d.type),
      });
      setSessionId(response.data.sessionId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create upload session";
      Alert.alert("Error", errorMessage);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocument = async (docType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });

      if (result.type === "success") {
        const file = result;
        await uploadDocument(docType, file);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadDocument = async (docType: string, file: any) => {
    if (!sessionId) {
      Alert.alert("Error", "Upload session not initialized");
      return;
    }

    setUploading(true);
    setUploadProgress(prev => ({ ...prev, [docType]: 0 }));

    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      const fileSize = fileInfo.exists ? (fileInfo as any).size || 0 : 0;

      // Create FormData
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name,
      } as any);
      formData.append("sessionId", sessionId);

      // Upload with progress tracking
      const uploadTask = FileSystem.createUploadTask(
        `http://localhost:3002/api/kyc/${kycId}/upload-document?documentType=${docType}`,
        file.uri,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          httpMethod: "POST",
        },
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.totalByteSent / (fileSize || 1)) * 100
          );
          setUploadProgress(prev => ({ ...prev, [docType]: Math.min(progress, 99) }));
        }
      );

      const response = await uploadTask.uploadAsync();

      if (response?.status === 200 || response?.status === 201) {
        setUploadProgress(prev => ({ ...prev, [docType]: 100 }));
        setUploadedDocs(prev => new Map(prev).set(docType, {
          uri: file.uri,
          name: file.name,
          size: fileSize,
          mimeType: file.mimeType || "application/octet-stream",
        }));
        Alert.alert("Success", `${docType} document uploaded successfully`);
      } else {
        Alert.alert("Error", "Upload failed. Please try again.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload document";
      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[docType];
        return newProgress;
      });
    }
  };

  const handleContinue = async () => {
    const requiredDocs = DOCUMENT_TEMPLATES.filter(d => d.required).map(d => d.type);
    const missingDocs = requiredDocs.filter(doc => !uploadedDocs.has(doc));

    if (missingDocs.length > 0) {
      Alert.alert(
        "Missing Documents",
        `Please upload: ${missingDocs.join(", ")}`
      );
      return;
    }

    navigation.navigate("KYCVerify", { kycId, sessionId });
  };

  const renderDocumentItem = ({ item }: { item: DocumentTemplate }) => {
    const isUploaded = uploadedDocs.has(item.type);
    const progress = uploadProgress[item.type];
    const uploadedFile = uploadedDocs.get(item.type);

    return (
      <View style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentIcon}>{item.icon}</Text>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>
              {item.type.replace(/_/g, " ").toUpperCase()}
              {item.required && <Text style={styles.required}> *</Text>}
            </Text>
            <Text style={styles.documentDesc}>{item.description}</Text>
            {isUploaded && uploadedFile && (
              <Text style={styles.fileName} numberOfLines={1}>
                ✓ {uploadedFile.name}
              </Text>
            )}
          </View>
        </View>

        {isUploaded ? (
          <View style={styles.uploadedBadge}>
            <Text style={styles.uploadedText}>✓ Done</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={() => handlePickDocument(item.type)}
            disabled={uploading}
          >
            {progress !== undefined ? (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${progress}%` },
                  ]}
                />
                <Text style={styles.progressText}>{progress}%</Text>
              </View>
            ) : (
              <Text style={styles.uploadButtonText}>Pick</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Preparing upload session...</Text>
      </View>
    );
  }

  const completionPercentage = Math.round(
    (uploadedDocs.size / DOCUMENT_TEMPLATES.length) * 100
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Documents</Text>
          <Text style={styles.subtitle}>
            Upload required documents for verification
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressCount}>
            {uploadedDocs.size} of {DOCUMENT_TEMPLATES.length} documents uploaded
          </Text>
        </View>

        <FlatList
          scrollEnabled={false}
          data={DOCUMENT_TEMPLATES}
          renderItem={renderDocumentItem}
          keyExtractor={item => item.type}
          contentContainerStyle={styles.documentsList}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 Your documents are encrypted and stored securely
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#6b7280" }]}
          onPress={() => navigation.goBack()}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, uploading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 24,
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3b82f6",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#d1d5db",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
  },
  progressCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  documentsList: {
    gap: 12,
    marginBottom: 16,
  },
  documentCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  documentHeader: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  documentIcon: {
    fontSize: 28,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  required: {
    color: "#ef4444",
  },
  documentDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  fileName: {
    fontSize: 11,
    color: "#059669",
    marginTop: 4,
    fontWeight: "500",
  },
  uploadButton: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
  },
  progressContainer: {
    position: "relative",
    width: 60,
    height: 32,
  },
  progressBar: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  progressText: {
    position: "absolute",
    fontSize: 11,
    fontWeight: "600",
    color: "#1f2937",
    width: 60,
    textAlign: "center",
    height: 32,
    lineHeight: 32,
  },
  uploadedBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  uploadedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  infoBox: {
    backgroundColor: "#dbeafe",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
