FROM node:18-slim

# Build arguments
ARG NODE_ENV=production

WORKDIR /usr/src/app

# Set environment variables
ENV PROJECT_ID=civil-forge-403609
ENV NODE_ENV=${NODE_ENV}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodejs
USER nodejs

EXPOSE 8080

# Use node directly to ensure proper signal handling
CMD [ "node", "src/server.js" ]