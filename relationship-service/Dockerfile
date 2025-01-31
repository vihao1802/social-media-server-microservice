FROM node:20.16-alpine

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

# Expose the port the application listens on
EXPOSE 8105

# Command to run the application
CMD ["npm", "run", "start:prod"]
