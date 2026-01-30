import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { useWalletStore } from "../store";
import { api } from "../services/api";

const { width } = Dimensions.get("window");

export function KYCVerifyScreen({ route, navigation }: any) {
  const { kycId, sessionId } = route.params;
  const { did } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<"processing" | "result" | "complete">("processing");
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    confidenceScore: number;
    message: string;
    details?: Record<string, any>;
  } | null>(null);

  React.useEffect(() => {
    performVerification();
  }, [kycId]);

  const performVerification = async () => {
    setLoading(true);
    try {
      // Simulate verification processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await api.verifyKYC(kycId, {
        sessionId: sessionId || undefined,
      });

      const result = {
        success: response.data.success !== false,
        confidenceScore: response.data.confidenceScore || 85,
        message: response.data.success !== false 
          ? "✓ Verification successful!"
          : "⚠ Verification incomplete",
        details: response.data.verificationData,
      };

      setVerificationResult(result);
      setVerificationStep("result");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";
      setVerificationResult({
        success: false,
        confidenceScore: 0,
        message: errorMessage,
      });
      setVerificationStep("result");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (verificationResult?.success) {
      setVerificationStep("complete");
      Alert.alert("Success", "Your KYC verification is complete!", [
        {
          text: "Back to Credentials",
          onPress: () => navigation.navigate("CredentialList"),
        },
      ]);
    }
  };

  const handleRetry = async () => {
    setVerificationStep("processing");
    await performVerification();
  };

  if (verificationStep === "processing") {
    return (
      <View style={styles.processingContainer}>
        <View style={styles.processingContent}>
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
          <Text style={styles.processingTitle}>Verifying Your Identity</Text>
          <Text style={styles.processingSubtitle}>
            This may take a few moments...
          </Text>

          <View style={styles.stepsContainer}>
            <ProcessingStep
              icon="✓"
              title="Documents Received"
              status="complete"
            />
            <ProcessingStep
              icon="⏳"
              title="Document Analysis"
              status="active"
            />
            <ProcessingStep
              icon="⊙"
              title="Identity Verification"
              status="pending"
            />
            <ProcessingStep
              icon="⊙"
              title="AML Screening"
              status="pending"
            />
          </View>
        </View>
      </View>
    );
  }

  if (!verificationResult) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.resultCard}>
          <View
            style={[
              styles.resultIcon,
              {
                backgroundColor: verificationResult.success ? "#d1fae5" : "#fee2e2",
              },
            ]}
          >
            <Text style={styles.resultIconText}>
              {verificationResult.success ? "✓" : "✕"}
            </Text>
          </View>

          <Text style={styles.resultTitle}>{verificationResult.message}</Text>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Confidence Score</Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${verificationResult.confidenceScore}%`,
                    backgroundColor:
                      verificationResult.confidenceScore >= 80
                        ? "#10b981"
                        : verificationResult.confidenceScore >= 60
                        ? "#f59e0b"
                        : "#ef4444",
                  },
                ]}
              />
            </View>
            <Text style={styles.scoreValue}>
              {verificationResult.confidenceScore.toFixed(1)}%
            </Text>
          </View>

          {verificationResult.details && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>Verification Details</Text>
              {Object.entries(verificationResult.details).map(([key, value]) => (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailKey}>
                    {key.replace(/_/g, " ").toUpperCase()}
                  </Text>
                  <Text style={styles.detailValue}>
                    {String(value)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {verificationResult.success
                ? "✓ You can now receive verifiable credentials"
                : "⚠ Please review and resubmit your documents"}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        {!verificationResult.success && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#6b7280" }]}
            onPress={handleRetry}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, !verificationResult.success && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={!verificationResult.success || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {verificationResult.success ? "Complete" : "Cancel"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ProcessingStep({
  icon,
  title,
  status,
}: {
  icon: string;
  title: string;
  status: "complete" | "active" | "pending";
}) {
  const statusColor =
    status === "complete" ? "#10b981" : status === "active" ? "#3b82f6" : "#d1d5db";
  const statusBg =
    status === "complete" ? "#d1fae5" : status === "active" ? "#dbeafe" : "#f3f4f6";

  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepIcon, { backgroundColor: statusBg }]}>
        <Text style={[styles.stepIconText, { color: statusColor }]}>{icon}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  processingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  processingContent: {
    width: "100%",
    alignItems: "center",
  },
  spinnerContainer: {
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  processingSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 32,
    textAlign: "center",
  },
  stepsContainer: {
    width: "100%",
    gap: 12,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  stepIconText: {
    fontSize: 18,
    fontWeight: "700",
  },
  stepTitle: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
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
  resultCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginTop: 12,
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  resultIconText: {
    fontSize: 40,
    fontWeight: "700",
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 24,
    textAlign: "center",
  },
  scoreContainer: {
    width: "100%",
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  scoreBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "right",
  },
  detailsSection: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailKey: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 12,
    color: "#1f2937",
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: "#dbeafe",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    padding: 12,
    borderRadius: 6,
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
