# OpenSourceMalware Scanner

A powerful supply chain attack scanner that identifies malicious dependencies and repositories using real-time data from [OpenSourceMalware.com](https://opensourcemalware.com/).

**Docker is the primary path on Linux. macOS users should use the local Node.js path via `setup.sh` and `scan.sh` — Docker bind mounts are unreliable on macOS.**

## 📌 Overview

This scanner is intended for source code repositories that use common package managers and dependency manifests. It currently scans:

- Node.js / npm projects from `package.json`
- Python / PyPI projects from `requirements.txt`
- Go projects from `go.mod`
- Rust projects from `Cargo.toml`

Use it when you want to check a local project folder or remote repository for known malicious dependencies reported by OpenSourceMalware.com.

## 🚀 Handoff Quick Start

This repository is intended to be handed off as a Git repo. A new user should be able to clone it, set one environment variable, build the Docker image, and start scanning.

### Prerequisites

- Git
- Docker Engine
- Docker Compose (`docker compose` or `docker-compose`)
- An OpenSourceMalware API key

### 1. Clone the Repository

```bash
git clone <your-repo-url> osm-dependency-scanner
cd osm-dependency-scanner
```

### 2. Configure the API Key

Copy `.env.example` to `.env`, then set your API key:

```bash
cp .env.example .env
```

```env
OSM_API_KEY=your_api_key_here
```

### 3. Build and Start the Scanner

```bash
./manage.sh rebuild
```

### 4. Run a Scan

Clone or copy the project you want to scan into the local `projects/` directory first:

```bash
git clone https://github.com/user/repo.git projects/my-app
```

Scan everything under `projects/`:

```bash
./manage.sh scan
```

Scan a single project folder such as `projects/my-app`:

```bash
./manage.sh scan my-app
```

Scan a remote repository URL:

```bash
./manage.sh repo "https://github.com/user/repo"
```

### Included Test Projects

This repository includes two local test projects under `projects/` for validating the scanner:

- `projects/test-project`
  A benign sample project for confirming clean detections across supported ecosystems.
- `projects/malicious-test-project`
  A sample project with known malicious dependencies for confirming positive detection behavior.

You can use them directly:

```bash
./manage.sh scan test-project
./manage.sh scan malicious-test-project
```

For real usage, clone your own repository into `projects/` and scan that folder with `./manage.sh scan <project>`.

## 🖼 Screenshot Example	s

Clean scan example for `projects/test-project`:

![Clean scan example for test-project](img/test.png)

Infected scan example for `projects/malicious-test-project`:

![Infected scan example for malicious-test-project](img/test2.png)

## 📦 Repository Setup

For handoff, keep the repository in this shape:

- `manage.sh`
  Main operator entrypoint for build, container lifecycle, and scans.
- `docker-compose.yml`
  Defines the long-running scanner container and mounts `./projects` to `/projects`.
- `.env`
  Supplies `OSM_API_KEY` to the container.
- `.env.example`
  Template for creating `.env` during setup.
- `projects/`
  Drop local repositories or extracted source trees here before scanning. This folder also includes `test-project` and `malicious-test-project` as scanner test fixtures.
- `src/`
  TypeScript source for the scanner.
- `dist/`
  Compiled JavaScript executed inside the container.

If you are handing this repo to another engineer, include:

- A valid `README.md`
- `.env.example` or equivalent setup instructions for `OSM_API_KEY`
- Any sample projects in `projects/` only if they are safe to redistribute

## 🛠 Usage via Docker

### `manage.sh` Command Reference

`manage.sh` is the main entrypoint for running the scanner through Docker Compose.

```bash
./manage.sh
```

Running it with no arguments opens an interactive menu with the same actions as the subcommands below.

Available commands:

```bash
./manage.sh -h
./manage.sh --help
./manage.sh start
./manage.sh build
./manage.sh rebuild
./manage.sh scan
./manage.sh scan <project>
./manage.sh repo <url>
./manage.sh status
./manage.sh shell
./manage.sh stop
```

- `./manage.sh -h` or `./manage.sh --help`
  Shows built-in command help and examples.
- `./manage.sh start`
  Starts the background `scanner` container with `docker compose up -d`.
- `./manage.sh build`
  Builds the scanner image without recreating the running container.
- `./manage.sh rebuild`
  Recreates the scanner container and rebuilds the image. Use this after changing Docker, Node.js, or TypeScript sources.
- `./manage.sh scan`
  Scans everything mounted under `projects/`.
- `./manage.sh scan <project>`
  Scans only `projects/<project>`.
- `./manage.sh repo <url>`
  Scans a repository URL through the OpenSourceMalware API.
- `./manage.sh status`
  Shows the current Docker Compose container status.
- `./manage.sh shell`
  Opens a Bash shell inside the running scanner container.
- `./manage.sh stop`
  Stops and removes the scanner container with `docker compose down`.

### 1. Scan a Repository URL
Run the scanner inside the container:
```bash
./manage.sh repo "https://github.com/user/repo"
```

### 2. Scan Local Code (Sandboxed)
Simply place your project folder inside the local `projects/` directory, then run:

```bash
./manage.sh scan
```

To scan a specific subfolder such as `projects/my-app`:

```bash
./manage.sh scan my-app
```

To test the scanner with the included fixtures:

```bash
./manage.sh scan test-project
./manage.sh scan malicious-test-project
```

The manager starts a background scanner container and mounts your local `projects/` folder into it at `/projects`. You can copy or clone projects into `projects/` on your host machine, and the running scanner container will see them immediately.

### Exit Codes

- Exit code `0`: scan completed and no malicious packages or repositories were detected.
- Exit code `1`: malicious content was detected, or the scanner hit an operational error such as a missing API key or invalid path.

For scan commands, a non-zero exit code is expected when malicious packages are found.

## 🍎 macOS Local Setup (Recommended for Mac)

Docker bind mounts on macOS can prevent the scanner container from reading the `projects/` directory. Use the local Node.js path instead.

### Prerequisites

- Node.js (v18+)
- npm
- An OpenSourceMalware API key

### 1. Clone and Enter the Repo

```bash
git clone <your-repo-url> osm-dependency-scanner
cd osm-dependency-scanner
```

### 2. Configure the API Key

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
OSM_API_KEY=your_api_key_here
```

The scanner reads `OSM_API_KEY` from your environment, so also export it in your shell if needed:

```bash
export $(grep -v '^#' .env | xargs)
```

### 3. Install and Build with `setup.sh`

```bash
./setup.sh
```

Select option **2) Install/Setup (macOS - Local Node.js)**.

This runs `npm install` and compiles the TypeScript source to `dist/`.

### 4. Scan with `scan.sh`

```bash
./scan.sh
```

Two modes available:

**Scan a local project folder** (choose option 1):

Prompts for a folder name inside `./projects/`. For example, if you have `projects/my-app`, enter `my-app`.

```
Enter the name of the project folder (inside ./projects): my-app
```

**Scan a remote repository URL** (choose option 2):

```
Enter Repository URL (e.g., https://github.com/user/repo.git): https://github.com/user/repo
```

### Cleanup

Run `./setup.sh` again and select option **4) Uninstall/Cleanup (macOS - Local Node.js)** to remove `node_modules/` and `dist/`.

---

## 🔍 How It Works

1. **Self-Contained Build:** When you run `./manage.sh rebuild`, Docker installs all dependencies and compiles the TypeScript code *inside* the container. Nothing is installed on your host machine.
2. **Isolation:** The scanner runs as a non-privileged user inside the sandbox.
3. **Detection:** The scanner identifies dependency files (`package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`).
4. **API Query:** It queries `api.opensourcemalware.com` for real-time threat data.
5. **Reporting:** Results are color-coded and detailed.

---
Data provided by [OpenSourceMalware.com](https://opensourcemalware.com/)

## 🛡 Security Note
This tool is for **scanning and analysis only**. It does not download or execute any packages. For the best security, always run scans in a sandboxed environment when dealing with potentially malicious projects.

---
Data provided by [OpenSourceMalware.com](https://opensourcemalware.com/)
