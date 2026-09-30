import axios, { AxiosError } from "axios";

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  statusCode?: number;
  details?: any;
}

export class ErrorHandler {
  private static readonly ERROR_MESSAGES: Record<string, string> = {
    // Network errors
    ECONNABORTED: "Request timeout. Please check your connection.",
    ENOTFOUND: "Unable to connect to server. Check your internet connection.",
    ECONNREFUSED: "Server is not responding. Please try again later.",
    ECONNRESET: "Connection was reset. Please try again.",

    // API errors
    UNAUTHORIZED: "Your session has expired. Please log in again.",
    FORBIDDEN: "You don't have permission to access this resource.",
    NOT_FOUND: "The requested resource was not found.",
    BAD_REQUEST: "Invalid request. Please check your input.",
    CONFLICT: "This resource already exists.",
    UNPROCESSABLE_ENTITY: "The request could not be processed.",
    TOO_MANY_REQUESTS: "Too many requests. Please wait and try again.",
    INTERNAL_SERVER_ERROR: "Server error. Please try again later.",
    SERVICE_UNAVAILABLE: "Service is temporarily unavailable. Please try again later.",

    // KYC errors
    KYC_NOT_FOUND: "KYC session not found. Please start a new verification.",
    KYC_EXPIRED: "KYC session has expired. Please start a new verification.",
    KYC_ALREADY_VERIFIED: "Your KYC verification is already complete.",
    KYC_VERIFICATION_FAILED: "KYC verification could not be completed. Please try again.",
    DOCUMENT_INVALID: "One or more documents are invalid or unreadable.",
    DOCUMENT_EXPIRED: "One or more documents have expired.",

    // Credential errors
    CREDENTIAL_NOT_FOUND: "Credential not found.",
    CREDENTIAL_EXPIRED: "Credential has expired.",
    CREDENTIAL_REVOKED: "Credential has been revoked.",
    CREDENTIAL_VERIFICATION_FAILED: "Credential verification failed.",
    INVALID_CREDENTIAL: "Invalid credential format.",

    // Presentation errors
    PRESENTATION_FAILED: "Failed to create presentation.",
    PRESENTATION_REJECTED: "Verifier rejected the presentation.",
    INVALID_PRESENTATION: "Invalid presentation format.",

    // DID errors
    DID_CREATION_FAILED: "Failed to create DID. Please try again.",
    INVALID_DID: "Invalid DID format.",
    DID_NOT_FOUND: "DID not found.",

    // Storage errors
    STORAGE_ERROR: "Failed to access local storage.",
    INSUFFICIENT_STORAGE: "Insufficient storage space available.",

    // Validation errors
    VALIDATION_ERROR: "Validation failed. Please check your input.",
    MISSING_REQUIRED_FIELDS: "Some required fields are missing.",
    INVALID_EMAIL: "Invalid email address format.",
    INVALID_PHONE: "Invalid phone number format.",
    INVALID_DATE: "Invalid date format.",

    // Generic errors
    UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
    CANCELLED: "Operation was cancelled.",
  };

  static handle(error: any): AppError {
    console.error("[ErrorHandler] Processing error:", error);

    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return this.handleStandardError(error);
    }

    // Handle custom app errors
    if (this.isAppError(error)) {
      return error;
    }

    // Handle unknown errors
    return {
      code: "UNKNOWN_ERROR",
      message: String(error),
      userMessage: this.ERROR_MESSAGES.UNKNOWN_ERROR,
    };
  }

  private static handleAxiosError(error: AxiosError): AppError {
    const statusCode = error.response?.status;
    const responseData = error.response?.data as any;
    const errorCode = responseData?.code || responseData?.error || "UNKNOWN_ERROR";

    // Network-level errors
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return {
          code: "TIMEOUT",
          message: error.message,
          userMessage: this.ERROR_MESSAGES.ECONNABORTED,
          statusCode: 408,
        };
      }

      if (error.request && !error.response) {
        return {
          code: "NO_RESPONSE",
          message: error.message,
          userMessage: "No response from server. Check your connection.",
          statusCode: 0,
        };
      }
    }

    // HTTP status code errors
    const userMessage =
      responseData?.message ||
      this.ERROR_MESSAGES[`HTTP_${statusCode}`] ||
      this.getMessageForStatusCode(statusCode) ||
      this.ERROR_MESSAGES[errorCode] ||
      this.ERROR_MESSAGES.UNKNOWN_ERROR;

    return {
      code: errorCode,
      message: error.message,
      userMessage,
      statusCode,
      details: responseData,
    };
  }

  private static handleStandardError(error: Error): AppError {
    const message = error.message.toLowerCase();

    // Detect specific error types from message
    if (message.includes("kyc")) {
      return {
        code: "KYC_ERROR",
        message: error.message,
        userMessage: "KYC verification failed. Please try again.",
      };
    }

    if (message.includes("credential")) {
      return {
        code: "CREDENTIAL_ERROR",
        message: error.message,
        userMessage: "Credential operation failed. Please try again.",
      };
    }

    if (message.includes("did")) {
      return {
        code: "DID_ERROR",
        message: error.message,
        userMessage: "DID operation failed. Please try again.",
      };
    }

    if (message.includes("timeout")) {
      return {
        code: "TIMEOUT",
        message: error.message,
        userMessage: this.ERROR_MESSAGES.ECONNABORTED,
      };
    }

    return {
      code: "ERROR",
      message: error.message,
      userMessage: this.ERROR_MESSAGES.UNKNOWN_ERROR,
    };
  }

  private static getMessageForStatusCode(statusCode?: number): string | null {
    const statusMessages: Record<number, string> = {
      400: this.ERROR_MESSAGES.BAD_REQUEST,
      401: this.ERROR_MESSAGES.UNAUTHORIZED,
      403: this.ERROR_MESSAGES.FORBIDDEN,
      404: this.ERROR_MESSAGES.NOT_FOUND,
      409: this.ERROR_MESSAGES.CONFLICT,
      422: this.ERROR_MESSAGES.UNPROCESSABLE_ENTITY,
      429: this.ERROR_MESSAGES.TOO_MANY_REQUESTS,
      500: this.ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      503: this.ERROR_MESSAGES.SERVICE_UNAVAILABLE,
    };

    return statusMessages[statusCode || 0] || null;
  }

  private static isAppError(error: any): error is AppError {
    return (
      error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error &&
      "userMessage" in error
    );
  }

  /**
   * Get a user-friendly error message
   */
  static getUserMessage(error: any): string {
    const appError = this.handle(error);
    return appError.userMessage;
  }

  /**
   * Get error code for analytics
   */
  static getErrorCode(error: any): string {
    const appError = this.handle(error);
    return appError.code;
  }

  /**
   * Log error for debugging
   */
  static logError(error: any, context?: string): void {
    const appError = this.handle(error);
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ${context || "Error"}: ${appError.code}`, {
      message: appError.message,
      userMessage: appError.userMessage,
      statusCode: appError.statusCode,
      details: appError.details,
    });
  }

  /**
   * Validate credential data
   */
  static validateCredential(credential: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!credential) {
      errors.push("Credential data is empty");
      return { valid: false, errors };
    }

    if (!credential.id) {
      errors.push("Missing credential ID");
    }

    if (!credential.jwt && !credential.credential) {
      errors.push("Missing credential JWT or credential data");
    }

    if (!credential.issuedAt) {
      errors.push("Missing issue date");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate DID format
   */
  static validateDID(did: string): { valid: boolean; error?: string } {
    if (!did) {
      return { valid: false, error: "DID cannot be empty" };
    }

    if (!did.startsWith("did:")) {
      return { valid: false, error: "DID must start with 'did:'" };
    }

    if (did.length < 10) {
      return { valid: false, error: "DID format is invalid" };
    }

    return { valid: true };
  }

  /**
   * Validate email
   */
  static validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: this.ERROR_MESSAGES.INVALID_EMAIL };
    }
    return { valid: true };
  }

  /**
   * Validate form field
   */
  static validateFormField(
    value: string,
    fieldName: string,
    options?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
    }
  ): { valid: boolean; error?: string } {
    if (options?.required && !value?.trim()) {
      return {
        valid: false,
        error: `${fieldName} is required`,
      };
    }

    if (options?.minLength && value.length < options.minLength) {
      return {
        valid: false,
        error: `${fieldName} must be at least ${options.minLength} characters`,
      };
    }

    if (options?.maxLength && value.length > options.maxLength) {
      return {
        valid: false,
        error: `${fieldName} must be at most ${options.maxLength} characters`,
      };
    }

    if (options?.pattern && !options.pattern.test(value)) {
      return {
        valid: false,
        error: `${fieldName} format is invalid`,
      };
    }

    return { valid: true };
  }
}

export default ErrorHandler;
