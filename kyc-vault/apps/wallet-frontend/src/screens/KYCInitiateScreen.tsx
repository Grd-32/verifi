import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Dimensions,
} from "react-native";
import { useWalletStore } from "../store";
import { api } from "../services/api";

const { width } = Dimensions.get("window");

export function KYCInitiateScreen({ navigation }: any) {
  const { did } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.applicantName.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return false;
    }
    if (!formData.applicantEmail.trim()) {
      Alert.alert("Validation Error", "Please enter your email address");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.applicantEmail)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleInitiateKYC = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.initiateKYC({
        walletDid: did!,
        applicantName: formData.applicantName,
        applicantEmail: formData.applicantEmail,
        applicantPhone: formData.applicantPhone || undefined,
      });

      if (response.data.kycId) {
        Alert.alert("Success", "KYC verification initiated", [
          {
            text: "Continue",
            onPress: () =>
              navigation.navigate("KYCUpload", { kycId: response.data.kycId }),
          },
        ]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate KYC";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Know Your Customer</Text>
          <Text style={styles.subtitle}>
            Complete your identity verification to unlock credential issuance
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={formData.applicantName}
              onChangeText={(text) => handleInputChange("applicantName", text)}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              value={formData.applicantEmail}
              onChangeText={(text) => handleInputChange("applicantEmail", text)}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 123-4567"
              value={formData.applicantPhone}
              onChangeText={(text) => handleInputChange("applicantPhone", text)}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📋 Your information will be securely verified and stored encrypted in your wallet
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleInitiateKYC}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Start Verification</Text>
          )}
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
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
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
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  button: {
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
