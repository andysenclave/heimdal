# ADR-001: Modular Monolith Architecture

**Status:** Accepted
**Date:** 2026-03-03
**Decision Makers:** Andy (Architect)

## Context

Heimdal needs to serve as a centralized IAM platform supporting multiple consumer applications. The team is solo (Andy + AI). We need clear module boundaries without the operational overhead of microservices.

## Decision

Use a **modular monolith** architecture with NestJS 11. Six modules (auth, org, entitlement, guard, cms, audit) run in a single process with clear boundaries. Each module owns its controllers, services, and will own its Prisma models.

## Rationale

- Solo team — microservice overhead (service mesh, distributed tracing, inter-service auth) is unjustified
- NestJS module system provides strong boundary enforcement via dependency injection
- Module boundaries map cleanly to future microservice extraction if needed
- Single deployment simplifies CI/CD, monitoring, and debugging

## Consequences

- All modules share the same database and Prisma client
- Scaling is vertical (bigger instance) not horizontal per-module
- Module extraction to microservices is preserved via clean interfaces

## Reversibility

**Yes.** Module boundaries are designed for extraction. Each module's service layer can become an independent service with its own database.
