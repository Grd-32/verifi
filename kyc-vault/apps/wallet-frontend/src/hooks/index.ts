import React, { useState, useCallback } from "react";
import { ErrorHandler } from "../services/errorHandler";
import toastService from "../services/toastService";

export interface UseAsyncState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Custom hook for handling async operations with error handling and loading states
 */
export const useAsync = <T,>(asyncFunction: () => Promise<T>, showToast: boolean = true) => {
  const [state, setState] = useState<UseAsyncState>({
    loading: false,
    error: null,
    success: false,
  });

  const execute = useCallback(
    async (onSuccess?: (data: T) => void, onError?: (error: Error) => void) => {
      setState({ loading: true, error: null, success: false });

      try {
        const data = await asyncFunction();
        setState({ loading: false, error: null, success: true });

        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (error) {
        const appError = ErrorHandler.handle(error);
        const errorMessage = appError.userMessage;

        setState({
          loading: false,
          error: errorMessage,
          success: false,
        });

        if (showToast) {
          toastService.error("Error", errorMessage);
        }

        if (onError) {
          onError(new Error(errorMessage));
        }

        throw new Error(errorMessage);
      }
    },
    [asyncFunction, showToast]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

/**
 * Custom hook for validating form inputs
 */
export const useFormValidation = (initialValues: Record<string, string>) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const setFieldError = (field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validate = (validationRules: Record<string, (value: string) => string | null>) => {
    const newErrors: Record<string, string> = {};

    Object.entries(validationRules).forEach(([field, validator]) => {
      const error = validator(values[field] || "");
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldError,
    validate,
    reset,
  };
};

/**
 * Custom hook for timeout operations
 */
export const useTimeout = (callback: () => void, delay: number | null) => {
  const [id, setId] = useState<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (delay !== null) {
      const timeoutId = setTimeout(callback, delay);
      setId(timeoutId);
    }
  }, [callback, delay]);

  const clear = useCallback(() => {
    if (id) {
      clearTimeout(id);
      setId(null);
    }
  }, [id]);

  return { start, clear };
};

/**
 * Custom hook for debouncing values
 */
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
