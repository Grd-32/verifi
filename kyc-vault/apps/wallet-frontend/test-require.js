// Test basic module loading
console.log("Testing module loading...");

try {
  console.log("1. Requiring expo...");
  const expo = require('expo');
  console.log("✓ Expo loaded");
} catch (e) {
  console.error("✗ Expo error:", e.message);
}

try {
  console.log("2. Requiring react-native...");
  const rn = require('react-native');
  console.log("✓ React Native loaded");
} catch (e) {
  console.error("✗ React Native error:", e.message);
}

try {
  console.log("3. Requiring zustand...");
  const zustand = require('zustand');
  console.log("✓ Zustand loaded");
} catch (e) {
  console.error("✗ Zustand error:", e.message);
}

try {
  console.log("4. Requiring react-native-get-random-values...");
  const grv = require('react-native-get-random-values');
  console.log("✓ react-native-get-random-values loaded");
} catch (e) {
  console.error("✗ react-native-get-random-values error:", e.message);
}

console.log("All basic modules tested!");
