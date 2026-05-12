#!/bin/bash

# Ensure we are in the scanner directory
cd "$(dirname "$0")"

echo "OpenSourceMalware Scanner"
echo "1) Scan local project path"
echo "2) Scan specific repository (URL)"
read -p "Choose an option: " OPTION

if [ "$OPTION" == "1" ]; then
    read -p "Enter the path to the project you want to scan (default: .): " SCAN_PATH
    SCAN_PATH=${SCAN_PATH:-.}
    echo "Starting scan for: $SCAN_PATH"
    npx ts-node src/index.ts --path "$SCAN_PATH"
elif [ "$OPTION" == "2" ]; then
    read -p "Enter the repository URL (e.g., https://github.com/user/repo): " REPO_URL
    if [ -z "$REPO_URL" ]; then
        echo "Error: Repository URL is required."
        exit 1
    fi
    echo "Starting scan for repository: $REPO_URL"
    npx ts-node src/index.ts --repo "$REPO_URL"
else
    echo "Invalid option."
    exit 1
fi
