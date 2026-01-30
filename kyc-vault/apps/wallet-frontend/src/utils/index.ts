import 'react-native-get-random-values';

// UUID v4 implementation for React Native (no external dependency)
export const generateId = (): string => {
  const hex = (): string => {
    return Math.floor(Math.random() * 16).toString(16);
  };
  
  const segment = (count: number): string => {
    let result = '';
    for (let i = 0; i < count; i++) {
      result += hex();
    }
    return result;
  };
  
  return `${segment(8)}-${segment(4)}-4${segment(3)}-${(Math.floor(Math.random() * 4) + 8).toString(16)}${segment(3)}-${segment(12)}`;
};

export const getJWTHash = (jwt: string): string => {
  // Simple hash from JWT (first 16 chars of payload)
  return jwt.split(".")[1]?.substring(0, 16) || "unknown";
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const isExpired = (timestamp: number): boolean => {
  return Date.now() > timestamp * 1000;
};

export const formatDID = (did: string, length: number = 16): string => {
  if (did.length <= length) return did;
  const start = did.substring(0, 8);
  const end = did.substring(did.length - length / 2);
  return `${start}...${end}`;
};

export const parseJWT = (token: string): any => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT format");

    const decoded = Buffer.from(parts[1], "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error parsing JWT:", error);
    return null;
  }
};

export const extractClaimsFromCredential = (credential: string): Record<string, any> => {
  try {
    const payload = parseJWT(credential);
    if (!payload || !payload.vc) return {};

    const credentialSubject = payload.vc.credentialSubject || {};
    return credentialSubject;
  } catch (error) {
    console.error("Error extracting claims:", error);
    return {};
  }
};

export const getCredentialType = (jwt: string): string => {
  try {
    const payload = parseJWT(jwt);
    if (!payload || !payload.vc || !payload.vc.type) return "Unknown";

    const types = payload.vc.type;
    if (Array.isArray(types)) {
      // Find the specific type (not just VerifiableCredential)
      return types.find((t: string) => t !== "VerifiableCredential") || "VerifiableCredential";
    }
    return types;
  } catch (error) {
    return "Unknown";
  }
};

export const validateDID = (did: string): boolean => {
  // Simple DID validation
  return did.startsWith("did:") && did.length > 10;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const claimsToDisplayFormat = (
  claims: Record<string, any>
): Record<string, string> => {
  const formatted: Record<string, string> = {};

  for (const [key, value] of Object.entries(claims)) {
    // Format key from camelCase to Title Case
    const formattedKey = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    // Format value
    if (typeof value === "object") {
      formatted[formattedKey] = JSON.stringify(value);
    } else if (typeof value === "boolean") {
      formatted[formattedKey] = value ? "Yes" : "No";
    } else {
      formatted[formattedKey] = String(value);
    }
  }

  return formatted;
};

export const handleDeepLink = (url: string): { screen: string; params: any } | null => {
  try {
    // Handle kyc-vault:// and https:// schemes
    let urlObj: URL;

    if (url.startsWith("kyc-vault://")) {
      const path = url.replace("kyc-vault://", "");
      urlObj = new URL(`https://dummy.com/${path}`);
    } else {
      urlObj = new URL(url);
    }

    const pathname = urlObj.pathname;
    const requestId = urlObj.searchParams.get("requestId");

    if (pathname.includes("verify")) {
      if (!requestId || !isValidUUID(requestId)) {
        throw new Error("Invalid request ID format");
      }
      return {
        screen: "PresentationRequest",
        params: { requestId },
      };
    }

    return null;
  } catch (error) {
    console.error("Error handling deep link:", error);
    return null;
  }
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object") {
    if ("message" in error) {
      return error.message;
    }
    if ("data" in error && typeof error.data === "object" && "message" in error.data) {
      return error.data.message;
    }
  }
  return "An unexpected error occurred";
};
