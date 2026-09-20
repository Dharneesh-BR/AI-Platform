import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  MembershipStatus,
  PlatformRole,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

const envPath = resolve('.env');

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function updateEnvValue(key, value) {
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  let found = false;
  const nextLines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }

    return line;
  });

  if (!found) {
    nextLines.push(`${key}=${value}`);
  }

  writeFileSync(envPath, nextLines.join('\n'), 'utf8');
}

async function findOrCreateAdmin() {
  const adminEmail = requiredEnv('ADMIN_EMAIL').toLowerCase();
  const adminFirebaseUid = process.env.ADMIN_FIREBASE_UID?.trim();
  const adminDisplayName = process.env.ADMIN_DISPLAY_NAME?.trim() || 'Magnafic AI Admin';

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        displayName: existingUser.displayName || adminDisplayName,
        role: PlatformRole.SUPER_ADMIN,
        deletedAt: null,
      },
    });
  }

  if (!adminFirebaseUid) {
    throw new Error(
      'ADMIN_FIREBASE_UID is required unless the admin has already logged in once with Firebase.',
    );
  }

  return prisma.user.create({
    data: {
      firebaseUid: adminFirebaseUid,
      email: adminEmail,
      displayName: adminDisplayName,
      role: PlatformRole.SUPER_ADMIN,
    },
  });
}

async function main() {
  const organizationName = process.env.LIVE_ORGANIZATION_NAME?.trim() || 'Magnafic AI';
  const organizationSlug =
    process.env.LIVE_ORGANIZATION_SLUG?.trim() || slugify(organizationName);
  const organizationDescription =
    process.env.LIVE_ORGANIZATION_DESCRIPTION?.trim() ||
    'Live Magnafic AI workspace.';

  const admin = await findOrCreateAdmin();

  const organization = await prisma.organization.upsert({
    where: { slug: organizationSlug },
    create: {
      id: randomUUID(),
      name: organizationName,
      slug: organizationSlug,
      description: organizationDescription,
      settings: {
        live: true,
        seededAt: new Date().toISOString(),
      },
      createdBy: admin.id,
      updatedBy: admin.id,
    },
    update: {
      name: organizationName,
      description: organizationDescription,
      deletedAt: null,
      updatedBy: admin.id,
    },
  });

  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: admin.id,
      },
    },
    create: {
      organizationId: organization.id,
      userId: admin.id,
      role: PlatformRole.SUPER_ADMIN,
      status: MembershipStatus.ACTIVE,
      invitedAt: new Date(),
      joinedAt: new Date(),
      createdBy: admin.id,
      updatedBy: admin.id,
    },
    update: {
      role: PlatformRole.SUPER_ADMIN,
      status: MembershipStatus.ACTIVE,
      deletedAt: null,
      updatedBy: admin.id,
    },
  });

  if (process.env.UPDATE_ENV_ORGANIZATION_ID !== 'false') {
    updateEnvValue('NEXT_PUBLIC_ORGANIZATION_ID', organization.id);
  }

  console.info('Live seed complete:', {
    organizationId: organization.id,
    organizationSlug: organization.slug,
    adminEmail: admin.email,
    adminRole: admin.role,
    envUpdated: process.env.UPDATE_ENV_ORGANIZATION_ID !== 'false',
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
