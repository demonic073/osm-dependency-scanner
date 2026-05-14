#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}      OSM Scanner Local Runner        ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo "Select scan mode:"
echo "1) Scan a Specific Local Project"
echo "2) Scan Remote Repository URL"
echo "3) Exit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Local Project Scan${NC}"
        read -p "Enter the name of the project folder (inside ./projects): " project_name
        
        # Construct the path
        TARGET_PATH="./projects/$project_name"

        # Check if the directory exists
        if [ -d "$TARGET_PATH" ]; then
            echo -e "${GREEN}Scanning: $TARGET_PATH${NC}"
            node dist/index.js --path "$TARGET_PATH"
        else
            echo -e "${RED}Error: Directory '$TARGET_PATH' not found.${NC}"
            echo "Please ensure the folder exists inside the './projects' directory."
        fi
        ;;
    2)
        echo -e "${YELLOW}Remote Repository Scan${NC}"
        read -p "Enter Repository URL (e.g., https://github.com/user/repo.git): " repo_url
        if [ -z "$repo_url" ]; then
            echo -e "${RED}Error: No URL provided.${NC}"
            exit 1
        fi
        echo -e "${GREEN}Scanning remote repository: $repo_url${NC}"
        node dist/index.js --repo "$repo_url"
        ;;
    3)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option. Exiting.${NC}"
        exit 1
        ;;
esac
