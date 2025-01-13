# Use Node.js base image
# syntax=docker/dockerfile:1
FROM node:20.16-alpine AS builder

# RUN apt-get update -y
# RUN apt-get install -y openssl
# Set working directory in the container

WORKDIR /app

# Copy package files
COPY package*.json /app/


# Install dependencies
RUN npm install --omit=dev


# Copy the rest of the application code
COPY ./ /app

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Production Stage
FROM node:20.16-alpine

# Set working directory
WORKDIR /app

# Copy dependencies from the build stage
COPY --from=builder /app/package.json ./package.json

# Copy dependencies from the build stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the built application code from the build stage
COPY --from=builder /app/dist ./dist

# Expose the port the application listens on
EXPOSE 8103

# Command to run the application
CMD ["npm", "run", "start:prod"]
