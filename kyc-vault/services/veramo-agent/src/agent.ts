import {
  createAgent,
  IResolver,
  IAgentOptions,
  IDataStore,
  IKeyManager,
  IDIDManager,
  ICredentialIssuer,
  ICredentialVerifier,
} from "@veramo/core";
import { CredentialPlugin } from "@veramo/credential-w3c";
import { DIDResolverPlugin } from "@veramo/did-resolver";
import { DIDManager } from "@veramo/did-manager";
import { KeyManager } from "@veramo/key-manager";
import { KeyManagementSystem } from "@veramo/kms-local";
import { DataStore, Entities, KeyStore, PrivateKeyStore, DIDStore } from "@veramo/data-store";
import { KeyDIDProvider } from "@veramo/did-provider-key";
import { Resolver } from "did-resolver";
import { getResolver as getKeyDidResolver } from "key-did-resolver";
import { DataSource } from "typeorm";

export async function createVeramoAgent() {
  // Return a stub agent for dashboard mode (database initialization is optional)
  try {
    // Create TypeORM DataSource for Veramo
    const dbConnection = new DataSource({
      name: "kyc-vault-db",
      type: (process.env.DB_TYPE === "postgres" ? "postgres" : "better-sqlite3") as any,
      database: process.env.DB_TYPE === "postgres" ? process.env.DB_NAME : process.env.DB_PATH || "./kyc-vault.sqlite",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      synchronize: true,
      entities: Entities,
    } as any);

    // Initialize the database connection
    await dbConnection.initialize();

    // Create a resolver that can handle did:key using the proper resolver library
    const resolver = new Resolver({
      ...getKeyDidResolver(),
    });

    // Create separate stores for Veramo 6
    const keyStore = new KeyStore(dbConnection);
    const privateKeyStore = new PrivateKeyStore(dbConnection);
    const didStore = new DIDStore(dbConnection);
    const dataStore = new DataStore(dbConnection);

    // Create Key Management System with private key store
    const kms = new KeyManagementSystem(privateKeyStore);

    // Create the Veramo agent with all required plugins
    const agent = createAgent<
      IResolver &
        IAgentOptions &
        IDataStore &
        IKeyManager &
        IDIDManager &
        ICredentialIssuer &
        ICredentialVerifier
    >({
      plugins: [
        // Key management - handles key generation and storage
        new KeyManager({
          store: keyStore,
          kms: {
            local: kms,
          },
        }),
        // DID management - handles DID creation and storage
        new DIDManager({
          store: didStore,
          defaultProvider: "did:key",
          providers: {
            "did:key": new KeyDIDProvider({
              defaultKms: "local",
            }),
          },
        }),
        // DID resolution plugin
        new DIDResolverPlugin({
          resolver: resolver,
        }),
        // Credential plugin for W3C VC support
        new CredentialPlugin(),
        // DataStore plugin for credential/presentation persistence
        dataStore,
      ],
    });

    return agent;
  } catch (error) {
    // If database initialization fails, return a stub agent for dashboard mode
    console.warn("⚠ Database initialization failed, running in dashboard-only mode");
    
    // Return a minimal stub agent
    return createAgent<IResolver>({
      plugins: [
        new DIDResolverPlugin({
          resolver: new Resolver({
            ...getKeyDidResolver(),
          }),
        }),
      ],
    });
  }
}
