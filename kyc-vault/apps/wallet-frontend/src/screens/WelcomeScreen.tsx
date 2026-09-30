import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useWalletStore } from "../store";
import { api } from "../services/api";
import { walletIdentityStorage } from "../services/storage";

const { width } = Dimensions.get("window");

export function WelcomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const { setDID, setInitialized, did } = useWalletStore();

  useEffect(() => {
    // If wallet already initialized, navigate to home
    if (did) {
    //   navigation.replace("CredentialList");
      navigation.replace("MainApp");

    }
  }, [did, navigation]);

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      console.log("[WelcomeScreen] Starting wallet creation...");
      const result = await api.createDID();
      console.log("[WelcomeScreen] DID creation result:", result);
      
      if (result.data.did) {
        const newDID = result.data.did;
        console.log("[WelcomeScreen] Setting DID:", newDID);
        setDID(newDID);
        await walletIdentityStorage.setDID(newDID);
        await walletIdentityStorage.setInitialized();
        setInitialized(true);

        Alert.alert("Success", `Wallet created!\n${newDID}`, [
          {
            text: "OK",
            onPress: () => navigation.replace("MainApp"),
          },
        ]);
      }
    } catch (error) {
      console.error("[WelcomeScreen] Wallet creation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert("Error", `Failed to create wallet: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🔐</Text>
          <Text style={styles.title}>KYC Vault</Text>
          <Text style={styles.subtitle}>Secure Self-Sovereign Identity Wallet</Text>
        </View>

        <View style={styles.featureList}>
          <FeatureItem icon="🆔" title="Decentralized Identity" />
          <FeatureItem icon="🏆" title="Verifiable Credentials" />
          <FeatureItem icon="🔒" title="End-to-End Encrypted" />
          <FeatureItem icon="⚡" title="Instant Verification" />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCreateWallet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create New Wallet</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} disabled={true}>
          <Text style={styles.secondaryButtonText}>Restore Wallet (Coming Soon)</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By creating a wallet, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  featureList: {
    width: "100%",
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
});
