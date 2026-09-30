import { create } from "zustand";
import { StoredCredential, WalletSettings, VerificationRequest } from "../types";

export interface WalletState {
  did: string | null;
  alias: string | null;
  isInitialized: boolean;
  credentials: StoredCredential[];
  settings: WalletSettings;
  loading: boolean;
  error: string | null;

  // Actions
  setDID: (did: string) => void;
  setAlias: (alias: string) => void;
  setInitialized: (initialized: boolean) => void;
  addCredential: (credential: StoredCredential) => void;
  removeCredential: (id: string) => void;
  updateCredential: (id: string, updates: Partial<StoredCredential>) => void;
  setCredentials: (credentials: StoredCredential[]) => void;
  updateSettings: (settings: Partial<WalletSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  did: null,
  alias: null,
  isInitialized: false,
  credentials: [],
  settings: {
    theme: "light",
    notificationsEnabled: true,
    autoVerifyCredentials: true,
    hapticEnabled: true,
  },
  loading: false,
  error: null,

  setDID: (did: string) => set({ did }),
  setAlias: (alias: string) => set({ alias }),
  setInitialized: (initialized: boolean) => set({ isInitialized: initialized }),

  addCredential: (credential: StoredCredential) =>
    set((state) => ({
      credentials: [...state.credentials, credential],
    })),

  removeCredential: (id: string) =>
    set((state) => ({
      credentials: state.credentials.filter((c) => c.id !== id),
    })),

  updateCredential: (id: string, updates: Partial<StoredCredential>) =>
    set((state) => ({
      credentials: state.credentials.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  setCredentials: (credentials: StoredCredential[]) =>
    set({ credentials }),

  updateSettings: (newSettings: Partial<WalletSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  reset: () =>
    set({
      did: null,
      alias: null,
      isInitialized: false,
      credentials: [],
      error: null,
    }),
}));

export interface PresentationState {
  currentRequest: VerificationRequest | null;
  selectedCredentials: string[];
  submitting: boolean;
  result: any | null;
  error: string | null;

  // Actions
  setCurrentRequest: (request: VerificationRequest | null) => void;
  selectCredential: (id: string) => void;
  deselectCredential: (id: string) => void;
  setSelectedCredentials: (ids: string[]) => void;
  setSubmitting: (submitting: boolean) => void;
  setResult: (result: any) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const usePresentationStore = create<PresentationState>((set) => ({
  currentRequest: null,
  selectedCredentials: [],
  submitting: false,
  result: null,
  error: null,

  setCurrentRequest: (request: VerificationRequest | null) =>
    set({ currentRequest: request }),

  selectCredential: (id: string) =>
    set((state) => ({
      selectedCredentials: [...state.selectedCredentials, id],
    })),

  deselectCredential: (id: string) =>
    set((state) => ({
      selectedCredentials: state.selectedCredentials.filter((cid) => cid !== id),
    })),

  setSelectedCredentials: (ids: string[]) =>
    set({ selectedCredentials: ids }),

  setSubmitting: (submitting: boolean) => set({ submitting }),
  setResult: (result: any) => set({ result }),
  setError: (error: string | null) => set({ error }),

  reset: () =>
    set({
      currentRequest: null,
      selectedCredentials: [],
      submitting: false,
      result: null,
      error: null,
    }),
}));
