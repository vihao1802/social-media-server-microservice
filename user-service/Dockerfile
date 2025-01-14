# Use Node.js base image
# syntax=docker/dockerfile:1
FROM node:20.16-alpine

# RUN apt-get update -y
# RUN apt-get install -y openssl
# Set working directory in the container

WORKDIR /app

# Copy package files
COPY package*.json ./


# Install dependencies
RUN npm install --omit=dev


# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# # Copy dependencies from the build stage
# COPY /app/package.json ./package.json

# # Copy dependencies from the build stage
# COPY /app/node_modules ./node_modules

# # Copy the built application code from the build stage
# COPY /app/dist ./dist

# Expose the port the application listens on
EXPOSE 8103

# Command to run the application
CMD ["npm", "run", "start:prod"]
