#!/bin/bash
# KYC Vault Wallet Frontend - Quick Commands

# ============================================
# 🚀 DEVELOPMENT
# ============================================

# Start development server (all platforms)
dev() {
  cd apps/wallet-frontend
  pnpm dev
}

# Start on iOS (macOS only)
ios() {
  cd apps/wallet-frontend
  expo run:ios
}

# Start on iOS with specific simulator
ios-sim() {
  cd apps/wallet-frontend
  expo run:ios --simulator "$1"
}

# Start on Android
android() {
  cd apps/wallet-frontend
  expo run:android
}

# Start web browser
web() {
  cd apps/wallet-frontend
  expo start --web
}

# Start with tunnel (physical device)
tunnel() {
  cd apps/wallet-frontend
  expo start --tunnel
}

# ============================================
# 🧹 MAINTENANCE
# ============================================

# Clear all caches
clean() {
  cd apps/wallet-frontend
  rm -rf .expo
  rm -rf node_modules
  pnpm install
}

# Reset simulator state
reset-ios() {
  xcrun simctl erase all
}

# ============================================
# 📦 BUILDING
# ============================================

# Build Android APK
build-android() {
  cd apps/wallet-frontend
  eas build --platform android
}

# Build iOS IPA
build-ios() {
  cd apps/wallet-frontend
  eas build --platform ios
}

# Build both
build-all() {
  cd apps/wallet-frontend
  eas build --platform android --platform ios
}

# ============================================
# 📤 DEPLOYMENT
# ============================================

# Submit to App Store
submit-ios() {
  cd apps/wallet-frontend
  eas submit --platform ios
}

# Submit to Google Play
submit-android() {
  cd apps/wallet-frontend
  eas submit --platform android
}

# ============================================
# 🧪 TESTING
# ============================================

# Run unit tests
test() {
  cd apps/wallet-frontend
  pnpm test
}

# Run tests with coverage
test-coverage() {
  cd apps/wallet-frontend
  pnpm test --coverage
}

# ============================================
# 🔍 DEBUGGING
# ============================================

# Open React Native Debugger
debug() {
  react-native-debugger
}

# Check API connectivity
check-api() {
  curl -X GET http://localhost:3001/health
}

# ============================================
# 📚 DOCUMENTATION
# ============================================

# View README
docs() {
  open apps/wallet-frontend/README.md
}

# View implementation guide
guide() {
  open WALLET_FRONTEND_IMPLEMENTATION_GUIDE.md
}

# View summary
summary() {
  open WALLET_FRONTEND_IMPLEMENTATION_SUMMARY.md
}

# ============================================
# 🎯 COMMON WORKFLOWS
# ============================================

# Full development setup
setup() {
  echo "📦 Installing dependencies..."
  pnpm install
  
  echo "📝 Creating .env.local..."
  cp apps/wallet-frontend/.env.example apps/wallet-frontend/.env.local
  
  echo "✅ Setup complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Edit apps/wallet-frontend/.env.local"
  echo "  2. Run: pnpm --filter wallet-frontend dev"
  echo "  3. Scan QR code with Expo Go"
}

# Test complete flow
test-flow() {
  echo "🧪 Testing wallet creation..."
  curl -X POST http://localhost:3001/api/did \
    -H "Content-Type: application/json" \
    -d '{"didMethod": "did:key"}'
  
  echo ""
  echo "📱 Open Expo Go and test wallet creation"
}

# Production deployment checklist
deploy-checklist() {
  cat <<EOF
📋 Production Deployment Checklist

Before deploying to production:

API Configuration
  [ ] Update EXPO_PUBLIC_API_URL to production domain
  [ ] Verify SSL/TLS certificates
  [ ] Enable CORS on backend
  [ ] Set up API rate limiting

App Configuration
  [ ] Update app.json with production details
  [ ] Set correct bundle identifiers
  [ ] Configure signing certificates
  [ ] Update app version number

Security
  [ ] Review all error messages (no sensitive data)
  [ ] Enable code obfuscation
  [ ] Set log level to 'error'
  [ ] Verify no test data in app

Testing
  [ ] Test on iOS simulator
  [ ] Test on Android emulator
  [ ] Test on physical devices
  [ ] Test all user workflows
  [ ] Verify deep linking

Build & Release
  [ ] Build release APK/IPA
  [ ] Run automated tests
  [ ] Create release notes
  [ ] Submit to app stores
  [ ] Set up rollout strategy
  [ ] Monitor crash reports

Post-Release
  [ ] Monitor user reports
  [ ] Check analytics
  [ ] Monitor API logs
  [ ] Have rollback plan ready

EOF
}

# ============================================
# 💡 TIPS
# ============================================

# Show help
help() {
  cat <<EOF
KYC Vault Wallet Frontend - Quick Commands

Usage: source scripts/commands.sh
       command-name [arguments]

Development Commands:
  dev              Start Expo dev server
  ios              Run on iOS simulator
  android          Run on Android emulator
  web              Run in web browser
  tunnel           Run with tunnel (physical device)

Building Commands:
  build-android    Build Android APK
  build-ios        Build iOS IPA
  build-all        Build both platforms

Testing Commands:
  test             Run unit tests
  test-coverage    Run tests with coverage
  check-api        Check backend API

Utilities:
  clean            Clean caches and reinstall
  debug            Open React Native Debugger
  reset-ios        Reset iOS simulator state

Documentation:
  docs             View README
  guide            View implementation guide
  summary          View implementation summary

Workflows:
  setup            Complete development setup
  test-flow        Test complete flow
  deploy-checklist Show deployment checklist

Examples:
  dev              # Start development
  ios              # Run on simulator
  ios-sim "iPhone 15"  # Run on specific simulator
  test             # Run tests
  check-api        # Test backend connection

EOF
}

# ============================================
# MAIN
# ============================================

if [ $# -eq 0 ]; then
  help
else
  "$@"
fi
