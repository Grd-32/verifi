#!/usr/bin/env node

/**
 * Wallet Frontend - Camera Module Check
 * Verifies expo-camera and other native modules are properly installed
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║       Wallet Frontend - Module Installation Check          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Check 1: Package.json dependencies
console.log('✓ Checking package.json dependencies...\n');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredModules = [
  'expo',
  'expo-camera',
  'expo-document-picker',
  'expo-file-system',
  'expo-secure-store',
  'react',
  'react-native',
  'react-native-gesture-handler',
  'react-native-get-random-values',
  'react-native-safe-area-context',
  'react-native-screens',
  'zustand',
  'axios',
  '@react-navigation/native',
  '@react-navigation/stack',
  '@react-navigation/bottom-tabs',
  '@react-native-async-storage/async-storage',
];

const missingModules = [];
const installedModules = [];

requiredModules.forEach(module => {
  if (packageJson.dependencies[module]) {
    installedModules.push(`  ✅ ${module}: ${packageJson.dependencies[module]}`);
  } else {
    missingModules.push(`  ❌ ${module}: NOT INSTALLED`);
  }
});

installedModules.forEach(mod => console.log(mod));
if (missingModules.length > 0) {
  missingModules.forEach(mod => console.log(mod));
}

console.log(`\nModules Installed: ${installedModules.length}/${requiredModules.length}\n`);

// Check 2: app.json configuration
console.log('✓ Checking app.json configuration...\n');

const appJsonPath = path.join(__dirname, 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const hasPlugins = appJson.expo.plugins && appJson.expo.plugins.length > 0;
  const hasPermissions = appJson.expo.permissions && appJson.expo.permissions.length > 0;
  const hasAndroidConfig = appJson.expo.android;
  
  console.log(`  ${hasPlugins ? '✅' : '❌'} Plugins configured: ${hasPlugins}`);
  console.log(`  ${hasPermissions ? '✅' : '❌'} Permissions set: ${hasPermissions}`);
  console.log(`  ${hasAndroidConfig ? '✅' : '❌'} Android config: ${hasAndroidConfig ? 'Yes' : 'No'}`);
  
  if (hasPlugins) {
    appJson.expo.plugins.forEach(plugin => {
      const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
      console.log(`       └─ ${pluginName}`);
    });
  }
} else {
  console.log('  ❌ app.json not found!');
}

console.log('\n');

// Check 3: Source files
console.log('✓ Checking critical source files...\n');

const sourceFiles = [
  'src/services/api.ts',
  'src/services/errorHandler.ts',
  'src/services/toastService.ts',
  'src/services/storage.ts',
  'src/hooks/index.ts',
  'src/screens/QRScannerScreen.tsx',
  'src/screens/KYCUploadScreen.tsx',
  'src/screens/CredentialListScreen.tsx',
];

sourceFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const stats = exists ? fs.statSync(filePath) : null;
  const size = stats ? (stats.size / 1024).toFixed(1) : '0';
  console.log(`  ${exists ? '✅' : '❌'} ${file} ${exists ? `(${size}KB)` : '(MISSING)'}`);
});

console.log('\n');

// Check 4: Node modules
console.log('✓ Checking node_modules installation...\n');

const nodeModulesPath = path.join(__dirname, 'node_modules');
const hasNodeModules = fs.existsSync(nodeModulesPath);

if (hasNodeModules) {
  const expoPath = path.join(nodeModulesPath, 'expo');
  const camerePath = path.join(nodeModulesPath, 'expo-camera');
  
  console.log(`  ✅ node_modules exists`);
  console.log(`  ${fs.existsSync(expoPath) ? '✅' : '❌'} expo installed`);
  console.log(`  ${fs.existsSync(camerePath) ? '✅' : '❌'} expo-camera installed`);
} else {
  console.log('  ❌ node_modules NOT found - run: npm install');
}

console.log('\n');

// Summary
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                       SUMMARY                              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const allGood = installedModules.length === requiredModules.length && 
                hasNodeModules && 
                fs.existsSync(appJsonPath);

if (allGood) {
  console.log('✅ All dependencies are properly installed!\n');
  console.log('Next steps:');
  console.log('  1. npm install (if not already done)');
  console.log('  2. npx expo start --clear');
  console.log('  3. Press "a" for Android or "i" for iOS');
  console.log('  4. Test the app in emulator/simulator\n');
} else {
  console.log('⚠️  Some dependencies are missing!\n');
  console.log('Fix steps:');
  console.log('  1. Run: npm install');
  console.log('  2. If still issues: rm -r node_modules && npm install');
  console.log('  3. Then: npx expo start --clear\n');
}

console.log('Camera Setup:');
console.log('  • See CAMERA_SETUP.md for troubleshooting');
console.log('  • If camera errors occur, use Expo Go app on physical device');
console.log('  • Or test non-camera screens first\n');

console.log('═══════════════════════════════════════════════════════════════\n');
