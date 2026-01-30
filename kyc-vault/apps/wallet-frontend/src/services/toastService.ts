import { Alert } from "react-native";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

/**
 * Toast service for displaying notifications to users
 * Uses native React Native Alerts (can be replaced with react-native-toast-notifications)
 */
export const toastService = {
  /**
   * Show a success toast
   */
  success(title: string, message?: string, duration?: number) {
    this.show({
      type: "success",
      title,
      message: message || "",
      duration,
    });
  },

  /**
   * Show an error toast
   */
  error(title: string, message?: string, duration?: number) {
    this.show({
      type: "error",
      title,
      message: message || "",
      duration,
    });
  },

  /**
   * Show a warning toast
   */
  warning(title: string, message?: string, duration?: number) {
    this.show({
      type: "warning",
      title,
      message: message || "",
      duration,
    });
  },

  /**
   * Show an info toast
   */
  info(title: string, message?: string, duration?: number) {
    this.show({
      type: "info",
      title,
      message: message || "",
      duration,
    });
  },

  /**
   * Show a generic toast
   */
  show(toast: Toast) {
    const { type, title, message } = toast;

    // Use Alert for notifications
    const displayMessage = message ? `${title}\n\n${message}` : title;

    if (type === "success") {
      Alert.alert("✓ " + title, message);
    } else if (type === "error") {
      Alert.alert("✕ " + title, message);
    } else if (type === "warning") {
      Alert.alert("⚠ " + title, message);
    } else {
      Alert.alert("ℹ " + title, message);
    }

    // Log for debugging
    console.log(`[Toast] ${type.toUpperCase()}: ${title}`, message);
  },

  /**
   * Confirm action with dialog
   */
  confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = "Confirm",
    cancelText: string = "Cancel"
  ) {
    Alert.alert(title, message, [
      {
        text: cancelText,
        onPress: onCancel,
        style: "cancel",
      },
      {
        text: confirmText,
        onPress: onConfirm,
      },
    ]);
  },

  /**
   * Confirm destructive action
   */
  confirmDestructive(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    action: string = "Delete"
  ) {
    Alert.alert(title, message, [
      {
        text: "Cancel",
        onPress: onCancel,
        style: "cancel",
      },
      {
        text: action,
        onPress: onConfirm,
        style: "destructive",
      },
    ]);
  },
};

export default toastService;
