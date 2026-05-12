#!/bin/bash

# Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed.' >&2
  exit 1
fi

# Build the image if it doesn't exist
if [[ "$(docker images -q osm-scanner 2> /dev/null)" == "" ]]; then
  echo "Building sandboxed scanner image..."
  docker build -t osm-scanner .
fi

# Load API key from .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Handle the scan
echo "OpenSourceMalware Sandboxed Scanner"
echo "1) Scan local project"
echo "2) Scan specific repository (URL)"
read -p "Choose an option: " OPTION

if [ "$OPTION" == "1" ]; then
    read -p "Enter the absolute path to the project: " SCAN_PATH
    if [ ! -d "$SCAN_PATH" ]; then
        echo "Error: Directory does not exist."
        exit 1
    fi
    # Mount the project directory as read-only for safety
    docker run --rm -v "$SCAN_PATH:/scan:ro" -e OSM_API_KEY="$OSM_API_KEY" osm-scanner --path /scan
elif [ "$OPTION" == "2" ]; then
    read -p "Enter the repository URL: " REPO_URL
    docker run --rm -e OSM_API_KEY="$OSM_API_KEY" osm-scanner --repo "$REPO_URL"
else
    echo "Invalid option."
    exit 1
fi
