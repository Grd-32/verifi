import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { StoredCredential, WalletSettings } from "../types";

export const STORAGE_KEYS = {
  WALLET_DID: "@kyc_vault/wallet_did",
  WALLET_ALIAS: "@kyc_vault/wallet_alias",
  CREDENTIALS: "@kyc_vault/credentials",
  VERIFICATION_CACHE: "@kyc_vault/verification_cache",
  SETTINGS: "@kyc_vault/settings",
  PRIVATE_KEY: "wallet_private_key_encrypted",
  SEED: "wallet_seed",
  INITIALIZED: "@kyc_vault/initialized",
  KYC_SESSIONS: "@kyc_vault/kyc_sessions",
};

// Credentials Storage
export const credentialStorage = {
  async addCredential(credential: StoredCredential): Promise<void> {
    try {
      const existing = await this.getAllCredentials();
      const updated = [...existing, credential];
      await AsyncStorage.setItem(
        STORAGE_KEYS.CREDENTIALS,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Error adding credential:", error);
      throw error;
    }
  },

  async getAllCredentials(): Promise<StoredCredential[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting credentials:", error);
      return [];
    }
  },

  async getCredential(id: string): Promise<StoredCredential | null> {
    try {
      const credentials = await this.getAllCredentials();
      return credentials.find((c) => c.id === id) || null;
    } catch (error) {
      console.error("Error getting credential:", error);
      return null;
    }
  },

  async deleteCredential(id: string): Promise<void> {
    try {
      const credentials = await this.getAllCredentials();
      const filtered = credentials.filter((c) => c.id !== id);
      await AsyncStorage.setItem(
        STORAGE_KEYS.CREDENTIALS,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error("Error deleting credential:", error);
      throw error;
    }
  },

  async updateCredential(id: string, updates: Partial<StoredCredential>): Promise<void> {
    try {
      const credentials = await this.getAllCredentials();
      const updated = credentials.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.CREDENTIALS,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Error updating credential:", error);
      throw error;
    }
  },

  async clearAllCredentials(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    } catch (error) {
      console.error("Error clearing credentials:", error);
      throw error;
    }
  },
};

// Wallet Identity Storage
export const walletIdentityStorage = {
  async setDID(did: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_DID, did);
    } catch (error) {
      console.error("Error setting DID:", error);
      throw error;
    }
  },

  async getDID(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.WALLET_DID);
    } catch (error) {
      console.error("Error getting DID:", error);
      return null;
    }
  },

  async setAlias(alias: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ALIAS, alias);
    } catch (error) {
      console.error("Error setting alias:", error);
      throw error;
    }
  },

  async getAlias(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ALIAS);
    } catch (error) {
      console.error("Error getting alias:", error);
      return null;
    }
  },

  async isInitialized(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
      return value === "true";
    } catch (error) {
      console.error("Error checking initialization:", error);
      return false;
    }
  },

  async setInitialized(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
    } catch (error) {
      console.error("Error setting initialized:", error);
      throw error;
    }
  },

  async clearWallet(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.WALLET_DID,
        STORAGE_KEYS.WALLET_ALIAS,
        STORAGE_KEYS.INITIALIZED,
      ]);
    } catch (error) {
      console.error("Error clearing wallet identity:", error);
      throw error;
    }
  },
};

// Secure Storage (Private Keys)
export const secureKeyStorage = {
  async storePrivateKey(key: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.PRIVATE_KEY, key);
    } catch (error) {
      console.error("Error storing private key:", error);
      throw error;
    }
  },

  async retrievePrivateKey(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.PRIVATE_KEY);
    } catch (error) {
      console.error("Error retrieving private key:", error);
      return null;
    }
  },

  async deletePrivateKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PRIVATE_KEY);
    } catch (error) {
      console.error("Error deleting private key:", error);
      throw error;
    }
  },
};

// Settings Storage
export const settingsStorage = {
  async saveSettings(settings: WalletSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  },

  async getSettings(): Promise<WalletSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data
        ? JSON.parse(data)
        : {
            theme: "light",
            notificationsEnabled: true,
            autoVerifyCredentials: true,
            hapticEnabled: true,
          };
    } catch (error) {
      console.error("Error getting settings:", error);
      return {
        theme: "light",
        notificationsEnabled: true,
        autoVerifyCredentials: true,
        hapticEnabled: true,
      };
    }
  },

  async updateSetting<K extends keyof WalletSettings>(
    key: K,
    value: WalletSettings[K]
  ): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings[key] = value;
      await this.saveSettings(settings);
    } catch (error) {
      console.error("Error updating setting:", error);
      throw error;
    }
  },
};

// Verification Cache
export const verificationCache = {
  async setCached(jwtHash: string, result: any): Promise<void> {
    try {
      const cache = await this.getCache();
      cache[jwtHash] = {
        result,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.VERIFICATION_CACHE,
        JSON.stringify(cache)
      );
    } catch (error) {
      console.error("Error setting verification cache:", error);
      throw error;
    }
  },

  async getCached(jwtHash: string): Promise<any | null> {
    try {
      const cache = await this.getCache();
      const entry = cache[jwtHash];
      if (!entry) return null;

      // Cache valid for 24 hours
      const cacheAge = Date.now() - entry.cachedAt;
      if (cacheAge > 24 * 60 * 60 * 1000) {
        delete cache[jwtHash];
        await AsyncStorage.setItem(
          STORAGE_KEYS.VERIFICATION_CACHE,
          JSON.stringify(cache)
        );
        return null;
      }

      return entry.result;
    } catch (error) {
      console.error("Error getting verification cache:", error);
      return null;
    }
  },

  async getCache(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.VERIFICATION_CACHE);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error getting cache:", error);
      return {};
    }
  },

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.VERIFICATION_CACHE);
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw error;
    }
  },
};

// KYC Session Storage
export const kycSessionStorage = {
  async startSession(data: {
    kycId: string;
    walletDid: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string;
    startedAt: number;
  }): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      sessions.push(data);
      await AsyncStorage.setItem(
        STORAGE_KEYS.KYC_SESSIONS,
        JSON.stringify(sessions)
      );
    } catch (error) {
      console.error("Error starting KYC session:", error);
      throw error;
    }
  },

  async getSession(kycId: string): Promise<any | null> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.find((s) => s.kycId === kycId) || null;
    } catch (error) {
      console.error("Error getting KYC session:", error);
      return null;
    }
  },

  async getAllSessions(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.KYC_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting KYC sessions:", error);
      return [];
    }
  },

  async updateSession(
    kycId: string,
    updates: Record<string, any>
  ): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const updated = sessions.map((s) =>
        s.kycId === kycId ? { ...s, ...updates } : s
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.KYC_SESSIONS,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Error updating KYC session:", error);
      throw error;
    }
  },

  async deleteSession(kycId: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const filtered = sessions.filter((s) => s.kycId !== kycId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.KYC_SESSIONS,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error("Error deleting KYC session:", error);
      throw error;
    }
  },
};
