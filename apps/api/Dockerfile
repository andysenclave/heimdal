# Heimdal API — Production Multi-stage Dockerfile
# Stage 1: Install deps | Stage 2: Build | Stage 3: Run (minimal image)

# ─── Stage 1: Dependencies ─────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy workspace root configs
COPY package.json package-lock.json turbo.json tsconfig.base.json ./

# Copy workspace package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/prisma-client/package.json ./packages/prisma-client/

# Install all workspace dependencies (production + dev for build)
RUN npm ci

# ─── Stage 2: Build ────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app

# Copy all source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate Prisma client + build all packages in dependency order
RUN npx turbo run build --filter=@heimdal/api

# Prune dev dependencies after build
RUN npm prune --omit=dev

# ─── Stage 3: Production runtime ───────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S heimdal && \
    adduser -S heimdal -u 1001 -G heimdal

# Copy built artifacts + production node_modules
COPY --from=build --chown=heimdal:heimdal /app/node_modules ./node_modules
COPY --from=build --chown=heimdal:heimdal /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=heimdal:heimdal /app/apps/api/package.json ./apps/api/
COPY --from=build --chown=heimdal:heimdal /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=heimdal:heimdal /app/packages/shared/package.json ./packages/shared/
COPY --from=build --chown=heimdal:heimdal /app/packages/sdk/dist ./packages/sdk/dist
COPY --from=build --chown=heimdal:heimdal /app/packages/sdk/package.json ./packages/sdk/
COPY --from=build --chown=heimdal:heimdal /app/packages/prisma-client/dist ./packages/prisma-client/dist
COPY --from=build --chown=heimdal:heimdal /app/packages/prisma-client/package.json ./packages/prisma-client/
COPY --from=build --chown=heimdal:heimdal /app/packages/prisma-client/prisma ./packages/prisma-client/prisma
COPY --from=build --chown=heimdal:heimdal /app/package.json ./

USER heimdal

ENV NODE_ENV=production
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
