import React from "react";
import { View, Text, SafeAreaView } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000" }}>
          KYC Vault
        </Text>
        <Text style={{ fontSize: 16, color: "#666", marginTop: 10 }}>
          Wallet is loading...
        </Text>
      </View>
    </SafeAreaView>
  );
}
