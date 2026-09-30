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
} from "react-native";
import { useWalletStore } from "../store";
import { api } from "../services/api";
import { credentialStorage } from "../services/storage";

const { width } = Dimensions.get("window");

export function CredentialIssuanceScreen({ route, navigation }: any) {
  const { issuerDid, templateId } = route.params || {};
  const { did, addCredential } = useWalletStore();
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [claims, setClaims] = useState<Record<string, string>>({});
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (issuerDid) {
      loadTemplate();
    }
  }, [issuerDid, templateId]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      if (!issuerDid) {
        throw new Error("Issuer DID is required");
      }

      // Fetch real template from issuer service
      const response = templateId
        ? await api.getCredentialTemplate(templateId)
        : await api.getCredentialTemplates(issuerDid);

      const template = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      if (!template) {
        throw new Error("No templates available from this issuer");
      }

      setTemplate(template);

      // Initialize claims object
      const initialClaims: Record<string, string> = {};
      (template.claims || []).forEach((claim: any) => {
        initialClaims[claim.name] = "";
      });
      setClaims(initialClaims);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load credential template";
      Alert.alert("Error", errorMessage);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateClaims = (): boolean => {
    const errors: Record<string, string> = {};

    template.claims.forEach((claim: any) => {
      if (claim.required && !claims[claim.name]?.trim()) {
        errors[claim.name] = `${claim.name} is required`;
      }
    });

    setClaimErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleIssueCredential = async () => {
    if (!validateClaims()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    setIssuing(true);
    try {
      const response = await api.issueCredential(
        templateId || template.id,
        issuerDid || "did:example:issuer",
        did!,
        claims
      );

      if (response.data.credential) {
        // Store credential
        const credentialId = response.data.credentialId || `cred_${Date.now()}`;
        const credentialData = {
          id: credentialId,
          jwt: response.data.credential,
          templateName: template.name,
          issuerDid: issuerDid || "did:example:issuer",
          claims,
          issuedAt: Math.floor(Date.now() / 1000),
          verified: false,
          verificationPayload: null,
        };

        await credentialStorage.addCredential(credentialData);
        addCredential(credentialData);

        Alert.alert("Success", "Credential issued successfully!", [
          {
            text: "View Credential",
            onPress: () =>
              navigation.navigate("CredentialDetail", {
                credentialId,
              }),
          },
        ]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to issue credential";
      Alert.alert("Error", errorMessage);
    } finally {
      setIssuing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading credential template...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Request Credential</Text>
          <Text style={styles.templateName}>{template?.name}</Text>
        </View>

        <View style={styles.issuerCard}>
          <Text style={styles.issuerLabel}>From Issuer</Text>
          <Text style={styles.issuerDid}>{issuerDid || "Unknown Issuer"}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Required Information</Text>

          {template?.claims.map((claim: any) => (
            <View key={claim.name} style={styles.formGroup}>
              <Text style={styles.label}>
                {claim.name.replace(/_/g, " ").toUpperCase()}
                {claim.required && <Text style={styles.required}> *</Text>}
              </Text>
              <View
                style={[
                  styles.input,
                  claimErrors[claim.name] ? styles.inputError : undefined,
                ]}
              >
                <TextInput
                  style={styles.inputText}
                  placeholder={`Enter ${claim.name}`}
                  value={claims[claim.name]}
                  onChangeText={(text) =>
                    setClaims(prev => ({
                      ...prev,
                      [claim.name]: text,
                    }))
                  }
                  editable={!issuing}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              {claimErrors[claim.name] && (
                <Text style={styles.errorText}>{claimErrors[claim.name]}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ✓ This credential will be stored encrypted in your wallet and verified by the issuer
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#6b7280" }]}
          onPress={() => navigation.goBack()}
          disabled={issuing}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, issuing && styles.buttonDisabled]}
          onPress={handleIssueCredential}
          disabled={issuing}
        >
          {issuing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Request Credential</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// TextInput import (React Native)
import { TextInput } from "react-native";

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
  templateName: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  issuerCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  issuerLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  issuerDid: {
    fontSize: 13,
    color: "#374151",
    fontFamily: "Menlo",
    fontWeight: "500",
  },
  form: {
    gap: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f9fafb",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  inputText: {
    padding: 12,
    fontSize: 14,
    color: "#1f2937",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: "#dbeafe",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
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
