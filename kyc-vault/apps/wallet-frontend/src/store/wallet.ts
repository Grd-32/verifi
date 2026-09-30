import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { v4 as uuidv4 } from "uuid";

interface DID {
  id: string;
  did: string;
  method: "ion" | "key" | "ethr";
  createdAt: string;
  label?: string;
}

interface StoredCredential {
  id: string;
  did: string;
  type: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  data: Record<string, unknown>;
  verified: boolean;
  revoked: boolean;
}

interface WalletStore {
  dids: DID[];
  activeDid: DID | null;
  credentials: StoredCredential[];
  createDid: (method: DID["method"]) => Promise<void>;
  setActiveDid: (did: DID) => void;
  addCredential: (credential: StoredCredential) => Promise<void>;
  revokeCredential: (credentialId: string) => void;
  getCredentials: (did: string) => StoredCredential[];
  backupSeed: () => Promise<string>;
  restoreSeed: (seed: string) => Promise<void>;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  dids: [],
  activeDid: null,
  credentials: [],

  createDid: async (method) => {
    // Call veramo agent API
    const response = await fetch("http://localhost:3001/api/did", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ didMethod: `did:${method}` }),
    });

    const result = await response.json();
    const newDid: DID = {
      id: uuidv4(),
      did: result.data.id,
      method,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      dids: [...state.dids, newDid],
      activeDid: newDid,
    }));

    // Securely store seed
    if (result.data.keys) {
      await SecureStore.setItemAsync(
        `did_${newDid.id}_seed`,
        JSON.stringify(result.data.keys)
      );
    }
  },

  setActiveDid: (did) => {
    set({ activeDid: did });
  },

  addCredential: async (credential) => {
    set((state) => ({
      credentials: [...state.credentials, credential],
    }));

    // Securely store credential
    await SecureStore.setItemAsync(
      `credential_${credential.id}`,
      JSON.stringify(credential)
    );
  },

  revokeCredential: (credentialId) => {
    set((state) => ({
      credentials: state.credentials.map((c) =>
        c.id === credentialId ? { ...c, revoked: true } : c
      ),
    }));
  },

  getCredentials: (did) => {
    const { credentials } = get();
    return credentials.filter((c) => c.did === did);
  },

  backupSeed: async () => {
    const { activeDid } = get();
    if (!activeDid) throw new Error("No active DID");

    const seed = await SecureStore.getItemAsync(`did_${activeDid.id}_seed`);
    return seed || "";
  },

  restoreSeed: async (seed) => {
    const newDid: DID = {
      id: uuidv4(),
      did: `did:key:${uuidv4()}`,
      method: "key",
      createdAt: new Date().toISOString(),
    };

    await SecureStore.setItemAsync(
      `did_${newDid.id}_seed`,
      seed
    );

    set((state) => ({
      dids: [...state.dids, newDid],
      activeDid: newDid,
    }));
  },
}));
