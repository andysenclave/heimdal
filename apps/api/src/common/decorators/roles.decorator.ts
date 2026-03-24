import { SetMetadata } from '@nestjs/common';
import type { HeimdalRole } from '@heimdal/shared';

export const ROLES_KEY = 'heimdal_roles';
export const Roles = (...roles: HeimdalRole[]) => SetMetadata(ROLES_KEY, roles);
