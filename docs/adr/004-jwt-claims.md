# ADR-004: JWT Claim Structure

**Status:** Accepted (Locked)
**Date:** 2026-03-03
**Decision Makers:** Andy (Architect)

## Context

The SDK and guard service depend on a stable JWT claim structure. All consumer applications parse these claims. Changes after launch break consumers.

## Decision

Lock the JWT claim structure as follows:

```json
{
  "sub": "user_abc123",
  "iss": "heimdal",
  "aud": "app_mimir_staging",
  "org": "org_thimple",
  "roles": ["user"],
  "sessionId": "ses_def456",
  "exp": 1709136000,
  "iat": 1709132400,
  "jti": "tok_xyz789"
}
```

**TTL:** 15 minutes. Refresh token: 7 days.

## Rationale

- `sub`: Standard JWT claim for user identity
- `iss`/`aud`: Standard issuer/audience for validation
- `org`: Tenant context — every request is org-scoped
- `roles`: Array of role names in the app context (from `aud`)
- `sessionId`: Links to server-side session for revocation
- `jti`: Unique token ID for audit trail

## Consequences

- Adding new claims requires SDK version bump and consumer migration
- Roles array may grow — keep role names short
- 15-min TTL means frequent refresh calls — acceptable for security

## Reversibility

**No.** This is a locked contract. Changes require versioned migration.
