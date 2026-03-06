# Heimdal

Centralized IAM Platform — Authentication, Authorization, and Entitlement Enforcement.

## Monorepo Structure

```
heimdal/
├── apps/
│   └── api/              # NestJS API (modular monolith)
├── packages/
│   ├── sdk/              # @heimdal/sdk — TypeScript SDK with React Native support
│   ├── shared/           # @heimdal/shared — Shared types, constants, utilities
│   └── prisma-client/    # @heimdal/prisma-client — Prisma schema and generated client
├── turbo.json            # TurboRepo pipeline config
├── tsconfig.base.json    # Shared TypeScript config
└── package.json          # Root workspace config
```

## Getting Started

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Start API in dev mode
npm run dev

# Format code
npm run format
```

## Branch Strategy

```
main (production) → heimdal.thimple.in
  staging (UAT) → staging.heimdal.thimple.in
    develop (integration)
      feature/* (individual tasks)
```

## Tech Stack

- **Runtime:** Node.js 20+, TypeScript 5.7
- **Framework:** NestJS 11
- **Database:** PostgreSQL 16 (Neon)
- **Cache:** Redis 7 (Upstash)
- **ORM:** Prisma 6
- **Build:** TurboRepo
- **CI/CD:** GitHub Actions
- **Hosting:** Render

## License

MIT
