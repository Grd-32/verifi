import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useWalletStore, usePresentationStore } from "../store";
import { api } from "../services/api";
import { credentialStorage } from "../services/storage";
import { VerificationRequest, StoredCredential } from "../types";
import { formatDate } from "../utils";

const { width } = Dimensions.get("window");

export function PresentationRequestScreen({ navigation }: any) {
  const route = useRoute();
  const { requestId } = route.params as { requestId?: string };
  const { did } = useWalletStore();
  const { credentials } = useWalletStore();
  const { setCurrentRequest, selectedCredentials, setSelectedCredentials, setSubmitting, submitting } =
    usePresentationStore();

  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [compatibleCredentials, setCompatibleCredentials] = useState<StoredCredential[]>([]);

  useEffect(() => {
    loadVerificationRequest();
  }, [requestId]);

  const loadVerificationRequest = async () => {
    try {
      setLoading(true);
      if (!requestId) {
        Alert.alert("Error", "No request ID provided");
        navigation.goBack();
        return;
      }

      const verificationRequest = await api.getVerificationRequest(requestId);
      setRequest(verificationRequest);
      setCurrentRequest(verificationRequest);

      // Find compatible credentials
      const compatible = credentials.filter((cred) => {
        const credType = cred.templateName.toLowerCase();
        return verificationRequest.requestedCredentialTypes.some(
          (type) => type.toLowerCase().includes(credType) || credType.includes(type.toLowerCase())
        );
      });

      setCompatibleCredentials(compatible);

      if (compatible.length === 0) {
        Alert.alert(
          "No Compatible Credentials",
          `This verifier is requesting: ${verificationRequest.requestedCredentialTypes.join(
            ", "
          )}\n\nYou don't have any matching credentials.`
        );
      }
    } catch (error) {
      console.error("Error loading verification request:", error);
      Alert.alert(
        "Error",
        "Failed to load verification request. It may have expired or be invalid."
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCredential = (credentialId: string) => {
    if (selectedCredentials.includes(credentialId)) {
      setSelectedCredentials(
        selectedCredentials.filter((id) => id !== credentialId)
      );
    } else {
      setSelectedCredentials([...selectedCredentials, credentialId]);
    }
  };

  const handleSubmitPresentation = async () => {
    if (selectedCredentials.length === 0) {
      Alert.alert("Error", "Please select at least one credential");
      return;
    }

    if (!request || !did) {
      Alert.alert("Error", "Missing required information");
      return;
    }

    setSubmitting(true);
    try {
      // Get the full JWT strings for selected credentials
      const selectedCredentialJWTs = await Promise.all(
        selectedCredentials.map(async (id) => {
          const cred = await credentialStorage.getCredential(id);
          return cred?.jwt || "";
        })
      );

      // Create presentation
      const presentationResponse = await api.createPresentation(
        did,
        selectedCredentialJWTs,
        request.verifierId,
        request.challenge
      );

      if (presentationResponse.data.presentationJwt) {
        // Submit presentation to verifier
        await api.submitPresentation(
          presentationResponse.data.presentationJwt,
          request.id
        );

        Alert.alert(
          "Success",
          "Credentials shared successfully with the verifier",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.popToTop();
                navigation.navigate("CredentialList");
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error submitting presentation:", error);
      Alert.alert(
        "Error",
        "Failed to submit credentials. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = () => {
    Alert.alert(
      "Deny Request",
      "Are you sure you want to deny this presentation request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deny",
          onPress: () => navigation.popToTop(),
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>📱</Text>
        </View>
        <Text style={styles.emptyTitle}>No Active Request</Text>
        <Text style={styles.emptySubtitle}>
          Scan a QR code to receive a credential sharing request
        </Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate("QRScanner")}
        >
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Presentation Request</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
      >
        {/* Request Details Card */}
        <View style={styles.requestCard}>
          <View style={styles.requestIcon}>
            <Text style={styles.requestIconText}>🔍</Text>
          </View>
          <Text style={styles.requestTitle}>Verification Request</Text>
          <Text style={styles.requestPurpose}>{request.purpose}</Text>
        </View>

        {/* Requested Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requested Credentials</Text>
          <View style={styles.credentialTypesList}>
            {request.requestedCredentialTypes.map((type, index) => (
              <View key={index} style={styles.credentialTypeBadge}>
                <Text style={styles.credentialTypeText}>{type}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Available Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Credentials ({compatibleCredentials.length})
          </Text>
          {compatibleCredentials.length > 0 ? (
            <FlatList
              data={compatibleCredentials}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <CredentialSelectionCard
                  credential={item}
                  selected={selectedCredentials.includes(item.id)}
                  onPress={() => handleSelectCredential(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.credentialsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No compatible credentials available
              </Text>
            </View>
          )}
        </View>

        {/* Verifier Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verifier Information</Text>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Verifier ID</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {request.verifierId}
              </Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Expires In</Text>
              <Text style={styles.infoValue}>
                {Math.ceil((request.expiresAt * 1000 - Date.now()) / (1000 * 60))} minutes
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyIcon}>ℹ️</Text>
          <Text style={styles.privacyText}>
            You are about to share your selected credentials with the verifier. Only the
            information you explicitly approve will be shared.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.denyButton}
          onPress={handleDeny}
          disabled={submitting}
        >
          <Text style={styles.denyButtonText}>Deny</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedCredentials.length || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitPresentation}
          disabled={!selectedCredentials.length || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Share Credentials</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CredentialSelectionCard({
  credential,
  selected,
  onPress,
}: {
  credential: StoredCredential;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.selectionCard, selected && styles.selectionCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.selectionCardContent}>
        <Text style={styles.selectionCardIcon}>📜</Text>
        <View style={styles.selectionCardInfo}>
          <Text style={styles.selectionCardTitle}>{credential.templateName}</Text>
          <Text style={styles.selectionCardDate}>
            Issued: {formatDate(credential.issuedAt)}
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.selectionCheckbox,
          selected && styles.selectionCheckboxSelected,
        ]}
      >
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  requestCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  requestIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  requestIconText: {
    fontSize: 30,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 8,
  },
  requestPurpose: {
    fontSize: 14,
    color: "#1e40af",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  credentialTypesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  credentialTypeBadge: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  credentialTypeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#166534",
  },
  credentialsList: {
    gap: 8,
  },
  selectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  selectionCardSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  selectionCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  selectionCardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectionCardInfo: {
    flex: 1,
  },
  selectionCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  selectionCardDate: {
    fontSize: 12,
    color: "#666",
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  selectionCheckboxSelected: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#e5e7eb",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
  },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  privacyNotice: {
    flexDirection: "row",
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  privacyIcon: {
    fontSize: 18,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  denyButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  denyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
