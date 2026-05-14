#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}      OSM Scanner Management         ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo "Select an option:"
echo "1) Install/Setup (Linux - Docker)"
echo "2) Install/Setup (macOS - Local Node.js)"
echo "3) Uninstall/Cleanup (Linux - Docker)"
echo "4) Uninstall/Cleanup (macOS - Local Node.js)"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo -e "${GREEN}Starting Linux Docker Setup...${NC}"
        docker-compose up -d --build
        echo -e "${GREEN}Done! Container is running.${NC}"
        ;;
    2)
        echo -e "${GREEN}Starting macOS Local Setup...${NC}"
        echo "Installing dependencies..."
        npm install
        echo "Compiling TypeScript..."
        npm run build || npx tsc
        echo -e "${GREEN}Done! You can now run: node dist/index.js --path ./projects${NC}"
        ;;
    3)
        echo -e "${RED}Starting Linux Docker Cleanup...${NC}"
        docker-compose down
        echo -e "${GREEN}Done! Containers stopped and removed.${NC}"
        ;;
    4)
        echo -e "${RED}Starting macOS Local Cleanup...${NC}"
        echo "Removing node_modules and dist folder..."
        rm -rf node_modules/
        rm -rf dist/
        echo -e "${GREEN}Done! Local environment cleaned.${NC}"
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option. Please run the script again.${NC}"
        exit 1
        ;;
esac
