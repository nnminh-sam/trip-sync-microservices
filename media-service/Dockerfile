# Stage 1: Install dependencies and build the app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies (only package*.json for better cache)
COPY package.json package-lock.json ./
COPY secret.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy only the built files and production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/secret.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Start the app
CMD ["node", "dist/main"]
