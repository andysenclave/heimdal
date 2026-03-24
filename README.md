<p align="center">
  <img src="docs/assets/heimdal-logo.png" alt="Heimdal" width="120" />
</p>

<h1 align="center">Heimdal</h1>

<p align="center">
  <strong>Identity, Access & Entitlement platform by <a href="https://thimple.in">Thimple</a></strong><br/>
  <em>One API to authenticate users, enforce roles, and guard every resource.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## What is Heimdal?

Heimdal is a **multi-tenant IAM platform** that gives your apps authentication, role-based access control (RBAC), and real-time permission enforcement — out of the box.

> Think Auth0 meets custom RBAC, purpose-built for your product ecosystem.

**Ship auth once. Enforce permissions everywhere.**

```
Your App  -->  POST /guard/check  -->  Heimdal  -->  { allowed: true }
```

---

## Admin Dashboard

<!-- Replace with actual screenshots after running the admin UI -->

| Dashboard | Role Management |
|:---------:|:---------------:|
| ![Dashboard](docs/assets/screenshot-dashboard.png) | ![Roles](docs/assets/screenshot-roles.png) |

> *Screenshots: Admin panel with Obsidian Deco design system. Dark mode, stat cards, RBAC hierarchy visualization.*
>
> **To capture:** Run `npm run dev`, navigate to `localhost:5173`, and screenshot the Dashboard + Roles pages.

---

## Architecture

```
                          +-----------------------------+
                          |       Heimdal Platform      |
                          +-----------------------------+
                          |                             |
              +-----------+-----------+   +-------------+----------+
              |    Admin Panel        |   |     Public SDK         |
              |  (React 19 + Vite)   |   |  (@heimdal/sdk)        |
              |  localhost:5173       |   |  npm install @heimdal  |
              +-----------+-----------+   +-------------+----------+
                          |                             |
                          v                             v
              +-------------------------------------------------+
              |              NestJS API (Modular Monolith)       |
              |                  localhost:8000                   |
              +-------------------------------------------------+
              |  Auth  | Org | App | Entitlement | Guard | SDK   |
              |  Invite | Audit | Dashboard | CMS (planned)     |
              +-------------------------------------------------+
                          |                    |
                  +-------+-------+    +-------+-------+
                  | PostgreSQL 16 |    |   Redis 7     |
                  |    (Neon)     |    |  (Upstash)    |
                  +---------------+    +---------------+
```

### How a Guard Check Works

```
Client Request
     |
     v
 POST /guard/check
 { resource: "trade:execute" }
     |
     v
+--[ JWT Validation ]--+
|  Verify signature     |
|  Check expiry         |
|  Extract claims       |
+----------+-----------+
           |
           v
+--[ Permission Resolution ]--+
|  Resolve user roles          |
|  Walk role hierarchy         |
|  Collect permissions         |
|  (direct + inherited)        |
+----------+------------------+
           |
           v
+--[ Access Binding Match ]--+
|  Match resource pattern     |
|  Check entitlements         |
+----------+-----------------+
           |
           v
 { allowed: true/false,
   matchedPermissions: [...],
   decisionId: "dec_..." }
```

---

## Monorepo Structure

```
heimdal/
├── apps/
│   ├── api/                 # NestJS API — the brain
│   └── admin/               # React admin panel — the face
├── packages/
│   ├── shared/              # @heimdal/shared — types, constants, validators
│   ├── prisma-client/       # @heimdal/prisma-client — schema + generated client
│   └── sdk/                 # @heimdal/sdk — public TypeScript SDK
├── docs/
│   ├── adr/                 # Architecture Decision Records (5 locked decisions)
│   ├── coding-prompts/      # 18 engineering decision guides
│   └── api/                 # OpenAPI specs
├── resources/               # Sprint plans, handoffs, mockups
├── .github/                 # CI pipeline + AI PR agent
├── turbo.json               # TurboRepo pipeline config
└── docker-compose.yml       # One-command local dev stack
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Node.js 20+ | LTS, stable, ecosystem |
| **Language** | TypeScript 5.7 (strict) | Type safety everywhere |
| **API Framework** | NestJS 11 | Modular, DI, guards, pipes, decorators |
| **Database** | PostgreSQL 16 | ACID, JSON, row-level security ready |
| **ORM** | Prisma 6 | Type-safe queries, migrations, studio |
| **Cache** | Redis 7 | Sessions, rate limiting (planned) |
| **Frontend** | React 19 + Vite | Fast dev, React Query, Zod validation |
| **Design** | Obsidian Deco | Custom design system with CSS tokens |
| **Build** | TurboRepo | Monorepo orchestration, caching |
| **CI/CD** | GitHub Actions | Lint, type-check, build, test, Docker |
| **PR Review** | CodiumAI PR Agent | AI-powered code review on every PR |
| **Hosting** | Render (planned) | PaaS, auto-deploy from git |

---

## API Modules

| Module | Routes | Purpose |
|--------|--------|---------|
| **Auth** | `POST /auth/signup, login, refresh, logout` | JWT auth, email verification, session management |
| **Org** | `GET/POST/PATCH/DELETE /admin/orgs` | Multi-tenant organization management |
| **Application** | `GET/POST/PATCH/DELETE /admin/apps` | App registration, secret management |
| **Entitlement** | `CRUD /admin/roles, /admin/permissions` | Roles with hierarchy, `domain:action` permissions |
| **Invite** | `POST/GET/DELETE /admin/invites` | Invite-gated onboarding (HMD-XXXXX codes) |
| **Guard** | `POST /guard/check` | Real-time permission enforcement |
| **SDK** | `POST /sdk/:appId/register, login, refresh` | End-user auth for downstream apps |
| **Audit** | `GET /admin/audit/logs` | Immutable event log for compliance |
| **Dashboard** | `GET /admin/dashboard/stats` | Aggregated platform metrics |

---

## Data Model

```
Organization (multi-tenant root)
  |
  +-- Application (app-scoped RBAC)
  |     |
  |     +-- Role (hierarchical, inheritable)
  |     |     +-- RolePermission (many-to-many)
  |     |
  |     +-- Permission (domain:action format)
  |     |
  |     +-- AccessBinding (permission -> resource pattern)
  |     |
  |     +-- UserAppRole (user -> role in app context)
  |     |
  |     +-- AppMembership (SDK end-users)
  |
  +-- OrgMembership (admin users: owner/admin/member)
  |
  +-- Invite (HMD-XXXXX, 48h expiry)
  |
  +-- AuditLog (immutable events)

User (identity)
  +-- Session (refresh tokens, 7-day TTL)
```

**IDs:** CUIDs with semantic prefixes (`user_`, `org_`, `app_`, `role_`, `perm_`)
**Permissions:** `domain:action` format validated by `/^[a-z]+:[a-z]+$/`
**Roles:** Hierarchical — child roles inherit all parent permissions

---

## Getting Started

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| PostgreSQL | 14+ | `pg_isready` |
| Redis | 7+ | `redis-cli ping` |
| Git | 2.40+ | `git --version` |

### 1. Clone & Install

```bash
git clone https://github.com/andysenclave/heimdal.git
cd heimdal
npm install
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit with your local values:
DATABASE_URL=postgresql://heimdal:heimdal_dev@localhost:5432/heimdal
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRY=15m
REFRESH_TTL=7
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=8000
```

### 3. Set Up Database

```bash
# Option A: Docker (recommended for fresh setup)
docker-compose up -d postgres redis

# Option B: Local PostgreSQL + Redis
brew services start postgresql@14
brew services start redis

# Create the database
createdb -U heimdal heimdal

# Push schema & generate client
cd packages/prisma-client
npx prisma db push
npx prisma generate

# Seed test data
npx prisma db seed
```

### 4. Start Development

```bash
# Start everything (API + Admin UI)
npm run dev

# Or start individually:
cd apps/api && npm run dev       # API on http://localhost:8000
cd apps/admin && npm run dev     # Admin on http://localhost:5173
```

### 5. Verify

```bash
# Health check
curl http://localhost:8000/api/v1/health

# API docs (Swagger)
open http://localhost:8000/docs

# Admin panel
open http://localhost:5173
```

### Test Credentials

| Email | Password | Role |
|-------|----------|------|
| `andy@thimple.dev` | `Thimple@123` | Platform admin, verified |
| `alice@thimple.dev` | `Thimple@123` | Org owner, verified |
| `bob@thimple.dev` | `Thimple@123` | Org owner, unverified |

---

## Development Commands

```bash
# Build & Quality
npm run build            # Build all packages (dependency-aware)
npm run test             # Run all tests
npm run lint             # ESLint across all packages
npm run type-check       # TypeScript strict checks
npm run format           # Prettier formatting

# Database (from packages/prisma-client/)
npx prisma studio        # Visual DB browser
npx prisma db push       # Apply schema changes
npx prisma generate      # Regenerate Prisma client
npx prisma db seed       # Seed test data

# Docker
docker-compose up        # PostgreSQL + Redis + API
docker-compose down      # Stop all services
```

---

## Branch Strategy

```
main (production)           heimdal.thimple.in
  |
  staging (UAT)             staging.heimdal.thimple.in
    |
    develop (integration)
      |
      HD-XXX-feature        Feature branches
```

**Commit format:** `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:` (imperative, lowercase)
**Branch format:** `HD-{number}-{short-description}`

---

## CI/CD Pipeline

Every pull request triggers:

```
PR Opened
  |
  +--[ Lint ]---------> ESLint strict
  +--[ Type-check ]---> tsc --noEmit
  |
  +--[ Build ]--------> NestJS + Vite (depends on above)
  |
  +--[ Test ]---------> Jest with coverage (depends on build)
  |
  +--[ Docker ]-------> Image build (develop branch only)
  |
  +--[ PR Agent ]-----> AI review + description + improvements
```

---

## Security Model

| Layer | Mechanism |
|-------|-----------|
| **Authentication** | JWT (15min) + refresh token rotation (7d, SHA-256 hashed) |
| **Route Protection** | Global `JwtAuthGuard` with `@Public()` opt-out |
| **Org Isolation** | `OrgScopeGuard` + `OrgMembershipGuard` chain |
| **SDK Isolation** | `AppSecretGuard` validates `X-App-Secret` header |
| **Admin vs SDK** | JWT `aud` claim separates admin tokens from app tokens |
| **Passwords** | bcryptjs (pure JS, no native deps) |
| **Invite-gated** | Signup requires invite code or creates personal org |

**Guard execution order:** JWT validation -> Role check -> Org scope -> Org membership

---

## Architecture Decisions

All significant decisions documented in `docs/adr/`:

| ADR | Decision | Status |
|-----|----------|--------|
| 001 | Modular monolith over microservices | **Locked** |
| 002 | Custom JWT auth over BetterAuth | Accepted |
| 003 | Tenant isolation via OrgMembership | Accepted |
| 004 | JWT claims shape (`HeimdalJwtClaims`) | **Locked** |
| 005 | Permission format (`domain:action`) | **Locked** |

---

## Engineering Docs

Heimdal ships with **18 coding decision guides** in `docs/coding-prompts/` covering:

- When to extract hooks, create components, place files
- How to design DTOs, write Prisma queries, scaffold modules
- Error handling patterns, state management, data flow architecture
- Testing strategies (unit, integration, E2E)
- Permission design and theming conventions

These guides serve as the team's living style guide and onboarding accelerator.

---

## License

MIT - [Thimple](https://thimple.in)

---

<p align="center">
  <em>Built with obsessive attention to architecture by the Thimple team.</em><br/>
  <strong>Heimdal sees everything. Heimdal guards everything.</strong>
</p>
