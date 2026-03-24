import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    inviteCode: z
      .string()
      .min(1, 'Invite code is required')
      .regex(/^HMD-[A-HJ-NP-Z2-9]{5}$/, 'Invalid invite code format'),
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  plan: z.string().optional(),
});

export type CreateOrgFormData = z.infer<typeof createOrgSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  parentRoleId: z.string().optional(),
});

export type CreateRoleFormData = z.infer<typeof createRoleSchema>;

export const createPermissionSchema = z.object({
  key: z.string().regex(/^[a-z]+:[a-z]+$/, 'Must match domain:action format (lowercase)'),
  description: z.string().optional(),
});

export type CreatePermissionFormData = z.infer<typeof createPermissionSchema>;

export const registerAppSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export type RegisterAppFormData = z.infer<typeof registerAppSchema>;
