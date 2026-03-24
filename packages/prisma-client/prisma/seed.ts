import { PrismaClient, OrgRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('Seeding Heimdal database...');

  // ── Bootstrap Heimdal Admin ──────────────────────────
  const bootstrapEmail = process.env.HEIMDAL_BOOTSTRAP_EMAIL || 'admin@heimdal.thimple.in';
  const bootstrapPassword = process.env.HEIMDAL_BOOTSTRAP_PASSWORD || 'changeme-on-first-login';

  const existingBootstrap = await prisma.user.findUnique({ where: { email: bootstrapEmail } });
  if (!existingBootstrap) {
    const hashedPassword = await bcrypt.hash(bootstrapPassword, BCRYPT_ROUNDS);
    await prisma.user.create({
      data: {
        email: bootstrapEmail,
        name: 'Heimdal Bootstrap Admin',
        password: hashedPassword,
        emailVerified: true,
        isHeimdalAdmin: true,
      },
    });
    console.log('  WARNING: Bootstrap admin created — CHANGE PASSWORD IMMEDIATELY');
    console.log(`  Email: ${bootstrapEmail}`);
  } else {
    console.log('  Bootstrap admin already exists, skipping');
  }

  // ── Organizations ──────────────────────────────────
  const thimple = await prisma.organization.upsert({
    where: { slug: 'thimple' },
    update: {},
    create: { name: 'Thimple', slug: 'thimple', plan: 'enterprise' },
  });

  const acme = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: { name: 'Acme Corp', slug: 'acme-corp', plan: 'pro' },
  });

  const demo = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: { name: 'Demo Organization', slug: 'demo-org', plan: 'starter' },
  });

  console.log(`  Organizations: ${thimple.name}, ${acme.name}, ${demo.name}`);

  // ── Admin User ─────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'andy@thimple.dev' },
    update: {},
    create: {
      email: 'andy@thimple.dev',
      name: 'Anindya Sengupta',
      emailVerified: true,
      isHeimdalAdmin: true,
    },
  });

  console.log(`  Admin user: ${admin.email}`);

  // ── Bootstrap admin org membership ───────────────────
  const bootstrapAdmin = await prisma.user.findUnique({ where: { email: bootstrapEmail } });
  if (bootstrapAdmin) {
    await prisma.orgMembership.upsert({
      where: { userId_orgId: { userId: bootstrapAdmin.id, orgId: thimple.id } },
      update: {},
      create: { userId: bootstrapAdmin.id, orgId: thimple.id, role: OrgRole.owner },
    });
  }

  // ── Org Memberships ────────────────────────────────
  for (const org of [thimple, acme, demo]) {
    await prisma.orgMembership.upsert({
      where: { userId_orgId: { userId: admin.id, orgId: org.id } },
      update: {},
      create: { userId: admin.id, orgId: org.id, role: OrgRole.owner },
    });
  }

  console.log('  Memberships: admin is owner of all orgs');

  // ── Applications ───────────────────────────────────
  const apps = await Promise.all([
    prisma.application.upsert({
      where: { appId: 'app_mimir_prod' },
      update: {},
      create: {
        orgId: thimple.id,
        name: 'Mimir Trading',
        appId: 'app_mimir_prod',
        appSecret: '$2b$10$placeholder_hashed_secret_mimir',
        description: 'Production trading platform',
      },
    }),
    prisma.application.upsert({
      where: { appId: 'app_mimir_staging' },
      update: {},
      create: {
        orgId: thimple.id,
        name: 'Mimir Staging',
        appId: 'app_mimir_staging',
        appSecret: '$2b$10$placeholder_hashed_secret_staging',
        description: 'Staging environment for Mimir',
      },
    }),
    prisma.application.upsert({
      where: { appId: 'app_acme_portal' },
      update: {},
      create: {
        orgId: acme.id,
        name: 'Acme Portal',
        appId: 'app_acme_portal',
        appSecret: '$2b$10$placeholder_hashed_secret_acme',
        description: 'Customer-facing portal',
      },
    }),
    prisma.application.upsert({
      where: { appId: 'app_acme_internal' },
      update: {},
      create: {
        orgId: acme.id,
        name: 'Acme Internal Tools',
        appId: 'app_acme_internal',
        appSecret: '$2b$10$placeholder_hashed_secret_internal',
        description: 'Internal admin tools',
      },
    }),
    prisma.application.upsert({
      where: { appId: 'app_demo_app' },
      update: {},
      create: {
        orgId: demo.id,
        name: 'Demo App',
        appId: 'app_demo_app',
        appSecret: '$2b$10$placeholder_hashed_secret_demo',
        description: 'Sandbox application for demos',
      },
    }),
  ]);

  console.log(`  Applications: ${apps.map((a) => a.name).join(', ')}`);

  // ── Roles (system roles per app) ───────────────────
  const roleNames = ['super-admin', 'admin', 'viewer'] as const;
  const roleDescriptions: Record<string, string> = {
    'super-admin': 'Full access to all resources',
    admin: 'Manage resources and users',
    viewer: 'Read-only access',
  };

  for (const app of apps) {
    let parentRoleId: string | undefined;
    for (const roleName of roleNames) {
      const role = await prisma.role.upsert({
        where: { appId_name: { appId: app.id, name: roleName } },
        update: {},
        create: {
          orgId: app.orgId,
          appId: app.id,
          name: roleName,
          description: roleDescriptions[roleName],
          isSystem: true,
          parentRoleId: parentRoleId ?? null,
        },
      });
      parentRoleId = role.id;
    }
  }

  console.log('  Roles: super-admin > admin > viewer (per app)');

  // ── Permissions ────────────────────────────────────
  const permKeys = [
    'portfolio:read',
    'portfolio:write',
    'trade:execute',
    'trade:read',
    'watchlist:read',
    'watchlist:manage',
    'user:read',
    'user:manage',
    'settings:read',
    'settings:manage',
  ];

  const mimirProd = apps[0];
  for (const key of permKeys) {
    await prisma.permission.upsert({
      where: { appId_key: { appId: mimirProd.id, key } },
      update: {},
      create: {
        orgId: mimirProd.orgId,
        appId: mimirProd.id,
        key,
        description: `Permission to ${key.replace(':', ' ')}`,
      },
    });
  }

  console.log(`  Permissions: ${permKeys.length} keys for ${mimirProd.name}`);

  // ── Assign super-admin role to admin user for Mimir Prod ──
  const superAdminRole = await prisma.role.findFirst({
    where: { appId: mimirProd.id, name: 'super-admin' },
  });

  if (superAdminRole) {
    await prisma.userAppRole.upsert({
      where: {
        userId_appId_roleId: {
          userId: admin.id,
          appId: mimirProd.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        appId: mimirProd.id,
        roleId: superAdminRole.id,
      },
    });
    console.log('  User-role: admin assigned super-admin on Mimir Prod');
  }

  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
