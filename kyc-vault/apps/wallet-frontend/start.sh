#!/bin/bash

# Wallet Frontend - Start Script
# Usage: ./start.sh [option]
# Options: web, android, ios, tunnel

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  KYC Vault - Wallet Frontend Startup   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install
    echo -e "${GREEN}✅ Dependencies installed${NC}\n"
fi

# Determine which platform to use
PLATFORM=${1:-default}

case $PLATFORM in
    web)
        echo -e "${BLUE}Starting Expo Web Server...${NC}"
        npx expo start --web
        ;;
    android)
        echo -e "${BLUE}Starting Expo for Android Emulator...${NC}"
        npx expo start --clear
        echo -e "${YELLOW}Press 'a' when prompt appears to start Android emulator${NC}"
        ;;
    ios)
        echo -e "${BLUE}Starting Expo for iOS Simulator...${NC}"
        npx expo start --clear
        echo -e "${YELLOW}Press 'i' when prompt appears to start iOS simulator${NC}"
        ;;
    tunnel)
        echo -e "${BLUE}Starting Expo with Tunnel Mode...${NC}"
        echo -e "${YELLOW}Scan QR code with Expo Go app (works on cellular)${NC}"
        npx expo start --tunnel
        ;;
    default|"")
        echo -e "${BLUE}Starting Expo Development Server...${NC}"
        echo -e "${YELLOW}Options:${NC}"
        echo "  'a' - Android Emulator (recommended)"
        echo "  'i' - iOS Simulator (Mac only)"
        echo "  'w' - Web Browser (no camera)"
        echo "  'scan' - Expo Go (scan QR with phone)"
        echo ""
        npx expo start --clear
        ;;
    *)
        echo -e "${YELLOW}Unknown platform: $PLATFORM${NC}"
        echo "Supported options: web, android, ios, tunnel"
        exit 1
        ;;
esac

