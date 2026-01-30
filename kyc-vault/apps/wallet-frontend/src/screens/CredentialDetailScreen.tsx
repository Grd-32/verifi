import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useWalletStore } from "../store";
import { credentialStorage } from "../services/storage";
import { claimsToDisplayFormat, formatDate, getCredentialType, parseJWT } from "../utils";
import { StoredCredential } from "../types";

const { width } = Dimensions.get("window");

export function CredentialDetailScreen({ navigation }: any) {
  const route = useRoute();
  const { credentialId } = route.params as { credentialId: string };
  const { credentials } = useWalletStore();
  const [credential, setCredential] = useState<StoredCredential | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredential();
  }, [credentialId]);

  const loadCredential = async () => {
    try {
      setLoading(true);
      const found = credentials.find((c) => c.id === credentialId);
      if (found) {
        setCredential(found);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load credential");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Credential",
      "Are you sure you want to delete this credential? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              if (credential) {
                await credentialStorage.deleteCredential(credential.id);
                Alert.alert("Success", "Credential deleted", [
                  { text: "OK", onPress: () => navigation.goBack() },
                ]);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete credential");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleShare = () => {
    Alert.alert(
      "Share Credential",
      "Share this credential with a verifier by scanning their QR code or using a deep link.",
      [{ text: "OK" }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!credential) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Credential not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const credentialType = getCredentialType(credential.jwt);
  const payload = parseJWT(credential.jwt);
  const claims = credential.claims || {};
  const displayClaims = claimsToDisplayFormat(claims);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credential Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Credential Header Card */}
        <View style={styles.credentialCard}>
          <View style={styles.credentialIcon}>
            <Text style={styles.credentialIconText}>📜</Text>
          </View>
          <Text style={styles.credentialName}>{credential.templateName}</Text>
          <Text style={styles.credentialType}>{credentialType}</Text>
          <View
            style={[
              styles.statusBadge,
              credential.verified ? styles.verifiedBadge : styles.unverifiedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {credential.verified ? "✓ Verified" : "⚠ Unverified"}
            </Text>
          </View>
        </View>

        {/* Issuer Information */}
        <Section title="Issuer Information">
          <InfoRow label="Issuer DID" value={credential.issuerDid} copyable={true} />
          <InfoRow label="Issued Date" value={formatDate(credential.issuedAt)} />
        </Section>

        {/* Claims */}
        <Section title="Claims">
          {Object.entries(displayClaims).length > 0 ? (
            Object.entries(displayClaims).map(([key, value]) => (
              <InfoRow key={key} label={key} value={value} />
            ))
          ) : (
            <Text style={styles.noDataText}>No claims available</Text>
          )}
        </Section>

        {/* Verification Status */}
        {credential.verified && credential.verificationPayload && (
          <Section title="Verification Details">
            <VerificationStatusSection payload={credential.verificationPayload} />
          </Section>
        )}

        {/* Technical Details */}
        <Section title="Technical Details">
          <InfoRow
            label="Credential ID"
            value={credential.id}
            copyable={true}
            truncate={true}
          />
          <InfoRow
            label="JWT Hash"
            value={credential.jwt.substring(0, 32)}
            copyable={true}
            truncate={true}
          />
          {payload && <InfoRow label="Algorithm" value={payload.alg || "Unknown"} />}
        </Section>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
          <Text style={styles.secondaryButtonText}>📤 Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={handleDelete}>
          <Text style={styles.dangerButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  copyable = false,
  truncate = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  truncate?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // In a real app, use react-native-clipboard
    Alert.alert("Copied", value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = truncate && value.length > 40 ? value.substring(0, 40) + "..." : value;

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueContainer}>
        <Text style={styles.infoValue} numberOfLines={3}>
          {displayValue}
        </Text>
        {copyable && (
          <TouchableOpacity
            onPress={handleCopy}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.copyIcon}>{copied ? "✓" : "📋"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function VerificationStatusSection({ payload }: { payload: any }) {
  return (
    <>
      {payload.verified !== undefined && (
        <InfoRow
          label="Verification Status"
          value={payload.verified ? "Valid" : "Invalid"}
        />
      )}
      {payload.issuer && (
        <InfoRow label="Verified Issuer" value={payload.issuer} truncate={true} />
      )}
      {payload.signer && (
        <InfoRow
          label="Signer"
          value={JSON.stringify(payload.signer).substring(0, 60)}
          truncate={true}
        />
      )}
    </>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backIcon: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  credentialCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  credentialIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  credentialIconText: {
    fontSize: 40,
  },
  credentialName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 4,
  },
  credentialType: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verifiedBadge: {
    backgroundColor: "#d1fae5",
  },
  unverifiedBadge: {
    backgroundColor: "#fed7aa",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
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
  sectionContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoValueContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  infoValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
    flex: 1,
  },
  copyIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
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
  secondaryButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  dangerButton: {
    flex: 1,
    backgroundColor: "#fee2e2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#dc2626",
  },
});
