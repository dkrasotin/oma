# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# For development, keep dev dependencies and use start:dev
# For production, remove dev dependencies and use start:prod
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm ci --only=production && npm run start:prod; else npm run start:dev; fi"] 