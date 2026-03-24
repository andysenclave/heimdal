# ADR-003: Tenant Isolation Strategy

**Status:** Accepted
**Date:** 2026-03-03
**Decision Makers:** Andy (Architect)

## Context

Heimdal is multi-tenant. Every organization must be isolated — users in org A must never see org B's data. We need to enforce this at the data layer.

## Decision

Use **row-level tenant isolation** with `orgId` on all tenant-scoped tables. Enforce via Prisma middleware that automatically injects `orgId` filters on all queries for tenant-scoped models.

## Approach

1. All tenant-scoped entities have an `orgId` column with a foreign key to Organization
2. A NestJS middleware extracts `orgId` from the authenticated JWT
3. A Prisma middleware (HD-017) intercepts all queries and injects `WHERE orgId = ?`
4. Direct queries without `orgId` are rejected

## Consequences

- Every tenant-scoped query carries orgId overhead
- Prisma middleware adds a thin layer of latency
- Cross-org queries (for super-admin) require explicit bypass
- Schema migrations must always consider orgId on new tenant tables

## Reversibility

**Partially.** Moving to schema-per-tenant or database-per-tenant is a major migration. Row-level isolation is the pragmatic starting point.
