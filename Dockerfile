# Use Node.js 22.12.0 specifically
FROM node:22.12.0-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Set the server URL for client build
ENV VITE_SERVER_URL=https://trivia-production-5dc4.up.railway.app

# Build the application
RUN yarn build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the server
CMD ["yarn", "start"]