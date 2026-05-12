# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm install

# Copy source and config
COPY . .

# Compile TypeScript
RUN npx tsc

# Stage 2: Runtime
FROM node:20-slim

# Install git for internal cloning
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the compiled code and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Expose the bind-mounted projects directory from the app working directory too.
RUN ln -s /projects /app/projects

# Set the environment variable for the API key
ENV OSM_API_KEY=""

# Create a non-privileged user and give them access to the app and projects
RUN useradd -m scanneruser
RUN chown -R scanneruser:scanneruser /app
USER scanneruser

# Fix: Always use node as the entrypoint to handle arguments correctly
ENTRYPOINT ["node", "dist/index.js"]

# Default to scanning the projects volume
CMD ["--path", "/projects"]
