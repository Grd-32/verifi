import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, SafeAreaView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import { NavigationContainer } from "@react-navigation/native";
import { useWalletStore } from "./store";
import { walletIdentityStorage } from "./services/storage";
import { api } from "./services/api";
import { RootNavigator } from "./navigation";

// Enable native screens for better performance
enableScreens();

export default function App() {
  const { isInitialized, setInitialized, setDID, did } = useWalletStore();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      console.log("[App] Starting bootstrap...");
      console.log("[App] API URL:", process.env.EXPO_PUBLIC_API_URL);
      
      // Check API health (non-critical)
      try {
        console.log("[App] Checking API health...");
        const isHealthy = await api.checkHealth();
        console.log("[App] API health:", isHealthy ? "✅ HEALTHY" : "❌ UNHEALTHY");
      } catch (healthError) {
        console.warn("[App] Health check failed, continuing anyway:", healthError);
      }
      
      // Check if wallet is already initialized
      const initialized = await walletIdentityStorage.isInitialized();
      console.log("[App] Wallet initialized:", initialized);
      
      const storedDID = await walletIdentityStorage.getDID();
      console.log("[App] Stored DID:", storedDID ? "found" : "not found");

      if (initialized && storedDID) {
        console.log("[App] Setting DID and initialized state");
        setInitialized(true);
        setDID(storedDID);
      } else {
        console.log("[App] Wallet not yet initialized");
      }
    } catch (error) {
      console.error("[App] Error bootstrapping:", error);
      setError(String(error));
    } finally {
      console.log("[App] Bootstrap complete, setting isReady");
      setIsReady(true);
    }
  };

  if (!isReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 12, fontSize: 16, color: "#666" }}>Loading wallet...</Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  if (error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#dc2626", marginBottom: 10 }}>
              Initialization Error
            </Text>
            <Text style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
              {error}
            </Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        fallback={
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        }
      >
        <RootNavigator isInitialized={isInitialized} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
