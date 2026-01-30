import React from "react";
// import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { CredentialListScreen } from "../screens/CredentialListScreen";
import { CredentialDetailScreen } from "../screens/CredentialDetailScreen";
import { CredentialIssuanceScreen } from "../screens/CredentialIssuanceScreen";
import { PresentationRequestScreen } from "../screens/PresentationRequestScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { KYCInitiateScreen } from "../screens/KYCInitiateScreen";
import { KYCUploadScreen } from "../screens/KYCUploadScreen";
import { KYCVerifyScreen } from "../screens/KYCVerifyScreen";
import { QRScannerScreen } from "../screens/QRScannerScreen";
import { Text } from "react-native";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function CredentialListStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen
        name="CredentialListHome"
        component={CredentialListScreen}
      />
      <Stack.Screen
        name="CredentialDetail"
        component={CredentialDetailScreen}
        options={{
          animationEnabled: false,
        }}
      />
      <Stack.Screen
        name="CredentialIssuance"
        component={CredentialIssuanceScreen}
        options={{
          animationEnabled: false,
        }}
      />
      <Stack.Screen
        name="KYCInitiate"
        component={KYCInitiateScreen}
        options={{
          animationEnabled: false,
        }}
      />
      <Stack.Screen
        name="KYCUpload"
        component={KYCUploadScreen}
        options={{
          animationEnabled: false,
        }}
      />
      <Stack.Screen
        name="KYCVerify"
        component={KYCVerifyScreen}
        options={{
          animationEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

function PresentationStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen
        name="PresentationHome"
        component={PresentationRequestScreen}
        initialParams={{ requestId: null }}
      />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{
          animationEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
      />
    </Stack.Navigator>
  );
}

function WalletTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen
        name="CredentialList"
        component={CredentialListStack}
        options={{
          tabBarLabel: "Credentials",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📜</Text>
          ),
        }}
      />
      <Tab.Screen
        name="PresentationRequest"
        component={PresentationStack}
        options={{
          tabBarLabel: "Share",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📤</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator({ isInitialized }: { isInitialized: boolean }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
      initialRouteName={isInitialized ? "MainApp" : "Welcome"}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
      />
      <Stack.Screen
        name="MainApp"
        component={WalletTabs}
      />
    </Stack.Navigator>
  );
}
