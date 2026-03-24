import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DecoButton,
  DecoInput,
  DecoSelect,
  DecoModal,
  decoToast,
} from '@components/primitives';
import {
  useCreateOrganization,
} from '@api/hooks/useOrganizations';
import type { CreateOrgPayload } from '@api/hooks/useOrganizations';

const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  plan: z.string().optional(),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;

const PLAN_OPTIONS = [
  { value: '', label: 'No plan' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CreateOrgModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createOrg = useCreateOrganization();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: '', slug: '', plan: '' },
  });

  const nameValue = watch('name');

  const onSubmit = async (data: CreateOrgForm) => {
    const payload: CreateOrgPayload = {
      name: data.name,
      slug: data.slug,
      plan: data.plan || null,
    };
    try {
      await createOrg.mutateAsync(payload);
      decoToast.success('Organization created');
      reset();
      onClose();
    } catch {
      decoToast.error('Failed to create organization');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    register('name').onChange(e);
    setValue('slug', slugify(e.target.value));
  };

  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title="Create Organization"
      footer={
        <>
          <DecoButton variant="ghost" onClick={onClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={createOrg.isPending}>
            {createOrg.isPending ? 'Creating...' : 'Create'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DecoInput
          label="Name"
          placeholder="My Organization"
          {...register('name')}
          onChange={handleNameChange}
          error={errors.name?.message}
        />
        <DecoInput
          label="Slug"
          placeholder="my-organization"
          mono
          value={watch('slug') || slugify(nameValue || '')}
          {...register('slug')}
          error={errors.slug?.message}
          hint="URL-safe identifier, auto-generated from name"
        />
        <DecoSelect label="Plan" {...register('plan')} error={errors.plan?.message}>
          {PLAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </DecoSelect>
      </form>
    </DecoModal>
  );
}
