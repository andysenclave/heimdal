import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DecoButton, DecoInput, DecoCard, DecoBadge, decoToast } from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { useGuardCheck } from '@api/hooks/useGuardCheck';
import type { GuardCheckResult } from '@api/hooks/useGuardCheck';

// --- Schema ---

const guardCheckSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  appId: z.string().min(1, 'App ID is required'),
  permission: z
    .string()
    .min(1, 'Permission is required')
    .regex(/^[a-z]+:[a-z]+$/, 'Must match domain:action format'),
  resource: z.string().optional(),
});

type GuardCheckForm = z.infer<typeof guardCheckSchema>;

// --- Result Panel ---

function ResultPanel({ result, isPending }: { result?: GuardCheckResult; isPending: boolean }) {
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-6 w-6 rounded-full border-2 border-deco-amber border-t-transparent animate-deco-spin" />
        <p className="mt-3 font-mono text-xs text-deco-text-dim">Evaluating guard...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-3xl text-deco-text-dim">&#9670;</span>
        <p className="mt-3 font-display text-sm font-bold text-deco-text-soft">No check performed</p>
        <p className="mt-1 font-mono text-[11px] text-deco-text-dim">
          Fill in the form and click Check Guard to see results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Verdict */}
      <div className="flex items-center justify-center">
        <DecoBadge
          variant={result.allowed ? 'green' : 'red'}
          className="px-5 py-1.5 text-base"
        >
          {result.allowed ? 'ALLOWED' : 'DENIED'}
        </DecoBadge>
      </div>

      {/* Evaluation time */}
      <div className="flex items-center justify-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-deco-wide text-deco-text-copper">
          Evaluation
        </span>
        <span className="font-mono text-sm font-bold text-deco-amber">
          {result.evaluationMs}ms
        </span>
      </div>

      {/* Separator */}
      <div className="border-t border-deco-border" />

      {/* Resolved Roles */}
      <div className="space-y-2">
        <h4 className="font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
          Resolved Roles
        </h4>
        {result.resolvedRoles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {result.resolvedRoles.map((role) => (
              <DecoBadge key={role} variant="teal" size="sm">
                {role}
              </DecoBadge>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[11px] italic text-deco-text-dim">No roles resolved</p>
        )}
      </div>

      {/* Matched Permissions */}
      <div className="space-y-2">
        <h4 className="font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
          Matched Permissions
        </h4>
        {result.matchedPermissions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {result.matchedPermissions.map((perm) => (
              <DecoBadge key={perm} variant="purple" size="sm">
                {perm}
              </DecoBadge>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[11px] italic text-deco-text-dim">
            No permissions matched
          </p>
        )}
      </div>
    </div>
  );
}

// --- Page ---

export default function GuardTester() {
  const guardCheck = useGuardCheck();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuardCheckForm>({
    resolver: zodResolver(guardCheckSchema),
    defaultValues: {
      userId: '',
      appId: '',
      permission: '',
      resource: '',
    },
  });

  const onSubmit = async (data: GuardCheckForm) => {
    try {
      await guardCheck.mutateAsync({
        userId: data.userId,
        appId: data.appId,
        permission: data.permission,
        resource: data.resource || undefined,
      });
    } catch {
      decoToast.error('Guard check failed');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Guard Tester"
        subtitle="Test permission checks against the guard engine"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left panel — Input Form */}
        <DecoCard title="Guard Check Request">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <DecoInput
              label="User ID"
              placeholder="user_cuid001"
              mono
              {...register('userId')}
              error={errors.userId?.message}
            />
            <DecoInput
              label="App ID"
              placeholder="app_ck7f801"
              mono
              {...register('appId')}
              error={errors.appId?.message}
            />
            <DecoInput
              label="Permission"
              placeholder="domain:action"
              mono
              {...register('permission')}
              error={errors.permission?.message}
            />
            <DecoInput
              label="Resource ID"
              placeholder="Optional resource identifier"
              mono
              {...register('resource')}
              error={errors.resource?.message}
              hint="Optional — scope the check to a specific resource"
            />
            <DecoButton
              type="submit"
              disabled={guardCheck.isPending}
              className="w-full"
            >
              {guardCheck.isPending ? 'Checking...' : 'Check Guard'}
            </DecoButton>
          </form>
        </DecoCard>

        {/* Right panel — Result Display */}
        <DecoCard title="Guard Decision">
          <ResultPanel result={guardCheck.data} isPending={guardCheck.isPending} />
        </DecoCard>
      </div>
    </div>
  );
}
