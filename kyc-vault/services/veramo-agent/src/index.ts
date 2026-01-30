import express, { Express, Request, Response } from "express";
import cors from "cors";
import { createVeramoAgent } from "./agent";
import { v4 as uuidv4 } from "uuid";
import { readFileSync } from "fs";
import { join } from "path";
import {
  VerifiableCredential,
  VerifiablePresentation,
  DIDDocument,
  ApiResponse,
} from "@kyc-vault/common-types";

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let veramoAgent: any;
let adminDashboard: string;

// Load admin dashboard
try {
  adminDashboard = readFileSync(join(__dirname, "..", "public", "admin.html"), "utf-8");
} catch {
  try {
    adminDashboard = readFileSync(join(__dirname, "..", "..", "public", "admin.html"), "utf-8");
  } catch {
    adminDashboard = "<h1>Dashboard not found</h1>";
  }
}

/**
 * Health check endpoint
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "veramo-agent",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Admin dashboard
 */
app.get("/admin", (req: Request, res: Response) => {
  res.type("text/html").send(adminDashboard);
});

app.get("/", (req: Request, res: Response) => {
  res.type("text/html").send(adminDashboard);
});

/**
 * POST /api/did
 * Create a new DID
 */
app.post("/api/did", async (req: Request, res: Response) => {
  try {
    const { didMethod = "did:ion" } = req.body;

    const identifier = await veramoAgent.didManagerCreate({
      provider: didMethod,
      alias: `wallet-${uuidv4().substring(0, 8)}`,
    });

    const response: ApiResponse<DIDDocument> = {
      success: true,
      data: identifier as DIDDocument,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: "DID_CREATION_ERROR",
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/did/:did
 * Resolve a DID
 */
app.get("/api/did/:did", async (req: Request, res: Response) => {
  try {
    const { did } = req.params;

    const didDocument = await veramoAgent.resolve(did);

    const response: ApiResponse<DIDDocument> = {
      success: true,
      data: didDocument,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        code: "DID_RESOLUTION_ERROR",
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/vc/issue
 * Issue a verifiable credential
 */
app.post("/api/vc/issue", async (req: Request, res: Response) => {
  try {
    const { issuerDid, subjectDid, schemaId, claims, credentialType } =
      req.body;

    const credential = await veramoAgent.createVerifiableCredential({
      credential: {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://schema.org",
        ],
        type: [credentialType || "VerifiableCredential"],
        issuer: issuerDid,
        credentialSubject: {
          id: subjectDid,
          ...claims,
        },
        issuanceDate: new Date().toISOString(),
      },
      proofFormat: "jwt",
    });

    const response: ApiResponse<VerifiableCredential> = {
      success: true,
      data: credential as VerifiableCredential,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: "VC_ISSUANCE_ERROR",
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/vc/verify
 * Verify a credential or presentation
 */
app.post("/api/vc/verify", async (req: Request, res: Response) => {
  try {
    const { credential, presentation } = req.body;

    const result = await veramoAgent.verifyCredential({
      credential: credential || presentation,
    });

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: "VERIFICATION_ERROR",
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/vc/present
 * Create a verifiable presentation
 */
app.post("/api/vc/present", async (req: Request, res: Response) => {
  try {
    const { holderDid, credentials, audience, challenge } = req.body;

    const presentation = await veramoAgent.createVerifiablePresentation({
      presentation: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiablePresentation"],
        verifiableCredential: credentials,
        holder: holderDid,
      },
      proofFormat: "jwt",
      challenge,
      audience,
    });

    const response: ApiResponse<VerifiablePresentation> = {
      success: true,
      data: presentation as VerifiablePresentation,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: "PRESENTATION_ERROR",
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Initialize and start server
 */
async function startServer() {
  try {
    veramoAgent = await createVeramoAgent();
    console.log("✓ Veramo agent initialized");

    app.listen(port, () => {
      console.log(`✓ Veramo Agent API running on port ${port}`);
      console.log(`  Dashboard: http://localhost:${port}/admin`);
      console.log(`  Docs: http://localhost:${port}/docs`);
    });
  } catch (error) {
    console.error("Failed to start Veramo Agent:", error);
    process.exit(1);
  }
}

startServer();

export default app;
