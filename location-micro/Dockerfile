# Stage 1: Build phase
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy only necessary files from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose app port (e.g., 3003 for location-micro)
EXPOSE 3003

# Start the NestJS app
CMD ["node", "dist/main"]
