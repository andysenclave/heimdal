import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DecoButton,
  DecoInput,
  DecoSelect,
  DecoModal,
  DecoToggle,
  decoToast,
} from '@components/primitives';
import {
  useUpdateOrganization,
} from '@api/hooks/useOrganizations';
import type { UpdateOrgPayload } from '@api/hooks/useOrganizations';
import type { Organization } from '@/types/models';

const editOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  plan: z.string().optional(),
  isActive: z.boolean(),
});

type EditOrgForm = z.infer<typeof editOrgSchema>;

const PLAN_OPTIONS = [
  { value: '', label: 'No plan' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

export function EditOrgModal({
  open,
  onClose,
  org,
}: {
  open: boolean;
  onClose: () => void;
  org: Organization;
}) {
  const updateOrg = useUpdateOrganization();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditOrgForm>({
    resolver: zodResolver(editOrgSchema),
    defaultValues: {
      name: org.name,
      slug: org.slug,
      plan: org.plan || '',
      isActive: org.isActive,
    },
  });

  const onSubmit = async (data: EditOrgForm) => {
    const payload: UpdateOrgPayload & { id: string } = {
      id: org.id,
      name: data.name,
      slug: data.slug,
      plan: data.plan || null,
      isActive: data.isActive,
    };
    try {
      await updateOrg.mutateAsync(payload);
      decoToast.success('Organization updated');
      onClose();
    } catch {
      decoToast.error('Failed to update organization');
    }
  };

  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title="Edit Organization"
      footer={
        <>
          <DecoButton variant="ghost" onClick={onClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={updateOrg.isPending}>
            {updateOrg.isPending ? 'Saving...' : 'Save Changes'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DecoInput
          label="Name"
          {...register('name')}
          error={errors.name?.message}
        />
        <DecoInput
          label="Slug"
          mono
          {...register('slug')}
          error={errors.slug?.message}
        />
        <DecoSelect label="Plan" {...register('plan')} error={errors.plan?.message}>
          {PLAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </DecoSelect>
        <div className="flex items-center justify-between rounded border border-deco-border-dim bg-deco-bg px-3 py-3">
          <div>
            <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
              Active
            </span>
            <span className="text-[12px] text-deco-text-dim">
              Inactive organizations cannot use the API
            </span>
          </div>
          <DecoToggle
            checked={watch('isActive')}
            onChange={(v) => setValue('isActive', v)}
          />
        </div>
      </form>
    </DecoModal>
  );
}
