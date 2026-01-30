import { registerRootComponent } from "expo";
import App from "./App";

// Try to load gesture handler if available (not available in Expo Go)
try {
  require('react-native-gesture-handler');
} catch (e) {
  console.log('Gesture handler not available in this environment');
}

registerRootComponent(App);
