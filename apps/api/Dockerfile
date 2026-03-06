# Heimdal API — Development Dockerfile
# Multi-stage build for production will come in Week 4

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/prisma-client/package.json ./packages/prisma-client/

RUN npm ci --workspace=@heimdal/api --workspace=@heimdal/shared --workspace=@heimdal/sdk --workspace=@heimdal/prisma-client

# Copy source
COPY tsconfig.base.json ./
COPY turbo.json ./
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/

# Build
RUN npx turbo run build --filter=@heimdal/api

# Run
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
