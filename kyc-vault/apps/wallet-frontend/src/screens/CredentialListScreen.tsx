import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useWalletStore } from "../store";
import { credentialStorage } from "../services/storage";
import { getCredentialType, formatDate, claimsToDisplayFormat } from "../utils";
import { StoredCredential } from "../types";

const { width } = Dimensions.get("window");

export function CredentialListScreen({ navigation }: any) {
  const { credentials, setCredentials, did } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadCredentials();
    }, [])
  );

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const stored = await credentialStorage.getAllCredentials();
      setCredentials(stored);
    } catch (error) {
      Alert.alert("Error", "Failed to load credentials");
      console.error("Load credentials error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCredentials();
    setRefreshing(false);
  };

  const handleDeleteCredential = (id: string) => {
    Alert.alert("Delete Credential", "Are you sure you want to delete this credential?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await credentialStorage.deleteCredential(id);
            setCredentials(credentials.filter((c) => c.id !== id));
            Alert.alert("Success", "Credential deleted");
          } catch (error) {
            Alert.alert("Error", "Failed to delete credential");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Credentials</Text>
          <Text style={styles.headerSubtitle}>
            {credentials.length} credential{credentials.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {credentials.length > 0 && (
        <TouchableOpacity
          style={styles.kycBanner}
          onPress={() => navigation.navigate("KYCInitiate")}
        >
          <Text style={styles.kycIcon}>🆔</Text>
          <View style={styles.kycContent}>
            <Text style={styles.kycTitle}>Complete KYC Verification</Text>
            <Text style={styles.kycSubtitle}>Unlock additional credential issuance</Text>
          </View>
          <Text style={styles.kycArrow}>→</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Credentials Yet</Text>
      <Text style={styles.emptyText}>
        Credentials you receive will appear here. You can also request new credentials from issuers.
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          Alert.alert(
            "Add Credential",
            "Scan a QR code from an issuer to receive a new credential",
            [{ text: "OK" }]
          );
        }}
      >
        <Text style={styles.addButtonText}>+ Request Credential</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCredential = ({ item }: { item: StoredCredential }) => (
    <CredentialCard
      credential={item}
      onPress={() => navigation.navigate("CredentialDetail", { credentialId: item.id })}
      onDelete={() => handleDeleteCredential(item.id)}
    />
  );

  if (loading && credentials.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={credentials}
        renderItem={renderCredential}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />
    </View>
  );
}

function CredentialCard({
  credential,
  onPress,
  onDelete,
}: {
  credential: StoredCredential;
  onPress: () => void;
  onDelete: () => void;
}) {
  const credentialType = getCredentialType(credential.jwt);
  const formattedDate = formatDate(credential.issuedAt);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardIcon}>📜</Text>
          <View>
            <Text style={styles.cardTitle}>{credential.templateName}</Text>
            <Text style={styles.cardType}>{credentialType}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
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
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.issuerText}>From: {credential.issuerDid.substring(0, 30)}...</Text>
        <Text style={styles.dateText}>Issued: {formattedDate}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
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
  listContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  scanButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  scanButtonText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  cardType: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  cardActions: {
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifiedBadge: {
    backgroundColor: "#d1fae5",
  },
  unverifiedBadge: {
    backgroundColor: "#fed7aa",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: {
    gap: 4,
  },
  issuerText: {
    fontSize: 12,
    color: "#666",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsButtonText: {
    fontSize: 20,
  },
  kycBanner: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  kycIcon: {
    fontSize: 28,
  },
  kycContent: {
    flex: 1,
  },
  kycTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e40af",
  },
  kycSubtitle: {
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 2,
  },
  kycArrow: {
    fontSize: 16,
    color: "#3b82f6",
  },
});
