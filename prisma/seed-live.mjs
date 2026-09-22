import 'dotenv/config';
import prismaClientPackage from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { PlatformRole, PrismaClient } = prismaClientPackage;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the live database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
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
  const admin = await findOrCreateAdmin();

  console.info('Live seed complete:', {
    adminEmail: admin.email,
    adminRole: admin.role,
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
