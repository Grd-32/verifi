import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useWalletStore } from "../store";
import { walletIdentityStorage, settingsStorage } from "../services/storage";
import { formatDID } from "../utils";

const { width } = Dimensions.get("window");

export function SettingsScreen({ navigation }: any) {
  const { did, alias, updateSettings, reset } = useWalletStore();
  const [settings, setSettings] = useState<{
    theme: "light" | "dark";
    notificationsEnabled: boolean;
    autoVerifyCredentials: boolean;
    hapticEnabled: boolean;
  }>({
    theme: "light",
    notificationsEnabled: true,
    autoVerifyCredentials: true,
    hapticEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const saved = await settingsStorage.getSettings();
      setSettings(saved);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await settingsStorage.updateSetting(key, value);
      updateSettings(newSettings);
    } catch (error) {
      console.error("Error updating setting:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  const handleCopyDID = () => {
    if (did) {
      // In a real app, use react-native-clipboard
      Alert.alert("Copied", "Wallet DID copied to clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetWallet = () => {
    Alert.alert(
      "Reset Wallet",
      "Are you sure you want to reset your wallet? This action cannot be undone and you will lose all stored credentials.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            try {
              await walletIdentityStorage.clearWallet();
              reset();
              navigation.navigate("Welcome");
            } catch (error) {
              Alert.alert("Error", "Failed to reset wallet");
            }
          },
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Information */}
        <Section title="Wallet Information">
          <SettingItem label="Wallet DID" value={did ? formatDID(did) : "Not initialized"} />
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyDID}
            disabled={!did}
          >
            <Text style={styles.copyButtonText}>
              {copied ? "✓ Copied" : "📋 Copy Full DID"}
            </Text>
          </TouchableOpacity>
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <SettingToggle
            label="Notifications"
            sublabel="Get alerts for new credentials and requests"
            value={settings.notificationsEnabled}
            onValueChange={(value) =>
              handleSettingChange("notificationsEnabled", value)
            }
          />
          <SettingToggle
            label="Auto-Verify Credentials"
            sublabel="Automatically verify new credentials"
            value={settings.autoVerifyCredentials}
            onValueChange={(value) =>
              handleSettingChange("autoVerifyCredentials", value)
            }
          />
          <SettingToggle
            label="Haptic Feedback"
            sublabel="Vibrations for interactions"
            value={settings.hapticEnabled}
            onValueChange={(value) => handleSettingChange("hapticEnabled", value)}
          />
        </Section>

        {/* Theme */}
        <Section title="Display">
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                settings.theme === "light" && styles.themeOptionActive,
              ]}
              onPress={() => handleSettingChange("theme", "light")}
            >
              <Text style={styles.themeIcon}>☀️</Text>
              <Text style={styles.themeLabel}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                settings.theme === "dark" && styles.themeOptionActive,
              ]}
              onPress={() => handleSettingChange("theme", "dark")}
            >
              <Text style={styles.themeIcon}>🌙</Text>
              <Text style={styles.themeLabel}>Dark</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Information */}
        <Section title="Information">
          <InfoItem
            icon="ℹ️"
            title="App Version"
            subtitle="1.0.0"
          />
          <InfoItem
            icon="📖"
            title="Documentation"
            subtitle="Learn more about the wallet"
            onPress={() =>
              Alert.alert(
                "Documentation",
                "Visit https://kyc-vault.app/docs for full documentation"
              )
            }
          />
          <InfoItem
            icon="🔒"
            title="Privacy Policy"
            subtitle="Read our privacy practices"
            onPress={() =>
              Alert.alert(
                "Privacy Policy",
                "Privacy policy available at https://kyc-vault.app/privacy"
              )
            }
          />
          <InfoItem
            icon="⚖️"
            title="Terms of Service"
            subtitle="Review our terms"
            onPress={() =>
              Alert.alert(
                "Terms of Service",
                "Terms available at https://kyc-vault.app/terms"
              )
            }
          />
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleResetWallet}
          >
            <Text style={styles.dangerButtonText}>🔄 Reset Wallet</Text>
          </TouchableOpacity>
          <Text style={styles.dangerWarning}>
            This will delete all your credentials and reset your wallet identity. This cannot be
            undone.
          </Text>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function SettingItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function SettingToggle({
  label,
  sublabel,
  value,
  onValueChange,
}: {
  label: string;
  sublabel: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleItem}>
      <View style={styles.toggleLabel}>
        <Text style={styles.toggleLabelText}>{label}</Text>
        <Text style={styles.toggleSublabel}>{sublabel}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
        thumbColor={value ? "#3b82f6" : "#f3f4f6"}
      />
    </View>
  );
}

function InfoItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.infoItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.infoItemContent}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <View>
          <Text style={styles.infoTitle}>{title}</Text>
          <Text style={styles.infoSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {onPress && <Text style={styles.arrowIcon}>›</Text>}
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
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  settingValue: {
    fontSize: 13,
    color: "#666",
    marginLeft: 12,
    maxWidth: "50%",
  },
  copyButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  toggleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  toggleLabel: {
    flex: 1,
  },
  toggleLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  toggleSublabel: {
    fontSize: 12,
    color: "#666",
  },
  themeOptions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center",
    gap: 8,
  },
  themeOptionActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  themeIcon: {
    fontSize: 24,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  arrowIcon: {
    fontSize: 20,
    color: "#d1d5db",
    marginLeft: 8,
  },
  dangerButton: {
    marginHorizontal: 16,
    marginVertical: 12,
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
  dangerWarning: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 12,
    color: "#991b1b",
    textAlign: "center",
    lineHeight: 16,
  },
});
