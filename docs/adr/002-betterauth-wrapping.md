# ADR-002: BetterAuth as Auth Foundation

**Status:** Accepted
**Date:** 2026-03-03
**Decision Makers:** Andy (Architect)

## Context

Heimdal needs authentication (signup, login, session management, JWT issuance). Building from scratch is expensive and error-prone. We evaluated Lucia, Keycloak, and BetterAuth.

## Decision

Use **BetterAuth** with Prisma adapter for the auth foundation. Wrap it inside Heimdal's auth module to control the API surface and extend with custom hooks.

## Alternatives Considered

- **Lucia:** Lighter but less batteries-included. No built-in refresh tokens or session management.
- **Keycloak:** Full-featured but heavyweight Java service. Overkill for solo team, complicates deployment.
- **Custom:** Maximum control but high effort and security risk.

## Rationale

- BetterAuth provides email/password auth, session management, and hooks out of the box
- Prisma adapter integrates with our existing ORM
- Custom hooks (afterSignup, afterLogin, afterLogout) allow us to inject Heimdal business logic
- JWT customization is possible via middleware

## Consequences

- Dependent on BetterAuth's API and update cycle
- Must audit BetterAuth source in Week 1 to confirm hook/JWT customization support
- If hooks are insufficient, fall back to middleware-based JWT enrichment (Risk R1)

## Reversibility

**Yes.** BetterAuth is wrapped inside the auth module. Replacing it affects only the auth module internals, not the public API surface.
