import { SetMetadata } from '@nestjs/common';

export const ORG_SCOPED_KEY = 'org_scoped';

/**
 * Marks an endpoint as org-scoped.
 * For heimdal-admins: orgId comes from query/param/body (they can operate on any org).
 * For org-admins: orgId is forced from their JWT claim (they can only operate on their org).
 * The guard sets request.resolvedOrgId which controllers should prefer over query params.
 */
export const OrgScoped = () => SetMetadata(ORG_SCOPED_KEY, true);
