import { useMemo } from 'react';
import {
  DecoButton,
  DecoModal,
  DecoBadge,
  decoToast,
} from '@components/primitives';
import { usePermissions } from '@api/hooks/usePermissions';
import {
  useRoleWithPermissions,
  useAssignPermissions,
  useRemovePermissionFromRole,
} from '@api/hooks/useRoles';
import type { Role } from '@/types/models';

interface RolePermissionsPanelProps {
  open: boolean;
  onClose: () => void;
  role: Role;
}

export function RolePermissionsPanel({
  open,
  onClose,
  role,
}: RolePermissionsPanelProps) {
  // Fetch full role data including direct + inherited permissions
  const { data: roleDetail, isLoading: roleLoading } = useRoleWithPermissions(
    role.id,
  );

  // Fetch all permissions for the same app
  const { data: allPermsData } = usePermissions(role.appId);
  const allPerms = allPermsData?.data ?? [];

  // Directly assigned permission IDs
  const directPermIds = useMemo(
    () =>
      new Set(
        (roleDetail?.rolePermissions ?? []).map((rp) => rp.permission.id),
      ),
    [roleDetail],
  );

  // Inherited permission IDs (from base role chain)
  const inheritedPermIds = useMemo(
    () => new Set((roleDetail?.inheritedPermissions ?? []).map((p) => p.id)),
    [roleDetail],
  );

  const effectiveCount = directPermIds.size + inheritedPermIds.size;

  const assignMutation = useAssignPermissions();
  const removeMutation = useRemovePermissionFromRole();

  const handleToggle = async (permId: string) => {
    // Can't toggle inherited permissions — they come from the base role
    if (inheritedPermIds.has(permId)) {
      decoToast.error('This permission is inherited from the base role. Edit the base role to change it.');
      return;
    }

    if (directPermIds.has(permId)) {
      try {
        await removeMutation.mutateAsync({
          roleId: role.id,
          permissionId: permId,
        });
        decoToast.success('Permission removed');
      } catch {
        decoToast.error('Failed to remove permission');
      }
    } else {
      try {
        await assignMutation.mutateAsync({
          roleId: role.id,
          permissionIds: [permId],
        });
        decoToast.success('Permission assigned');
      } catch {
        decoToast.error('Failed to assign permission');
      }
    }
  };

  const isLoading = assignMutation.isPending || removeMutation.isPending;

  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title={`Permissions — ${role.name}`}
      footer={
        <DecoButton variant="ghost" onClick={onClose}>
          Close
        </DecoButton>
      }
    >
      <div className="space-y-4">
        {/* Role context header */}
        <div className="rounded border border-deco-border-dim bg-deco-bg px-3 py-2.5">
          <span className="block font-mono text-[10px] text-deco-text-copper">
            ROLE
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-deco-amber">
              {role.name}
            </span>
            {role.isSystem && (
              <DecoBadge variant="amber" size="sm">
                SYSTEM
              </DecoBadge>
            )}
            {roleDetail?.baseRole && (
              <span className="font-mono text-[10px] text-deco-text-dim">
                inherits from{' '}
                <span className="text-deco-teal">{roleDetail.baseRole.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-deco-text-dim">
          <span>
            {effectiveCount} effective permissions
          </span>
          {inheritedPermIds.size > 0 && (
            <span className="text-deco-teal">
              ({directPermIds.size} direct + {inheritedPermIds.size} inherited)
            </span>
          )}
        </div>

        {/* Permission list */}
        {roleLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-deco-spin rounded-full border-2 border-deco-amber border-t-transparent" />
          </div>
        ) : allPerms.length === 0 ? (
          <div className="rounded border border-deco-border bg-deco-bg px-3 py-4 text-center font-mono text-[12px] text-deco-text-dim">
            No permissions exist for this application yet.
            <br />
            Create permissions on the Permissions page first.
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto space-y-1 pr-1">
            {allPerms.map((perm) => {
              const isDirect = directPermIds.has(perm.id);
              const isInherited = inheritedPermIds.has(perm.id);
              const isActive = isDirect || isInherited;

              return (
                <button
                  key={perm.id}
                  onClick={() => !isLoading && handleToggle(perm.id)}
                  disabled={isLoading || role.isSystem}
                  className={`flex w-full items-center gap-3 rounded border px-3 py-2 text-left transition-colors ${
                    isDirect
                      ? 'border-deco-amber/30 bg-deco-amber/8 text-deco-text'
                      : isInherited
                        ? 'border-deco-teal/30 bg-deco-teal/8 text-deco-text'
                        : 'border-deco-border bg-transparent text-deco-text-soft hover:border-deco-border-dim'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {/* Checkbox indicator */}
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                      isDirect
                        ? 'border-deco-amber bg-deco-amber text-[#0A0A0C]'
                        : isInherited
                          ? 'border-deco-teal bg-deco-teal text-[#0A0A0C]'
                          : 'border-deco-border bg-transparent text-transparent'
                    }`}
                  >
                    {isActive ? '✓' : ''}
                  </span>
                  <span className="font-mono text-[12px] font-bold">
                    {perm.key}
                  </span>
                  {isInherited && (
                    <DecoBadge variant="teal" size="sm">
                      inherited
                    </DecoBadge>
                  )}
                  {perm.description && (
                    <span className="ml-auto text-[11px] text-deco-text-dim">
                      {perm.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {role.isSystem && (
          <div className="rounded border border-deco-amber/20 bg-deco-amber/5 px-3 py-2 font-mono text-[11px] text-deco-amber">
            System role permissions cannot be modified.
          </div>
        )}

        {inheritedPermIds.size > 0 && (
          <div className="rounded border border-deco-teal/20 bg-deco-teal/5 px-3 py-2 font-mono text-[11px] text-deco-teal">
            Teal permissions are inherited from the base role chain and cannot be removed here.
          </div>
        )}
      </div>
    </DecoModal>
  );
}
