import { prisma } from './db.js';

export async function upsertPlatformAccount(userId, platform, platformUsername) {
  return prisma.platformAccount.upsert({
    where: { userId_platform: { userId, platform } },
    create: { userId, platform, platformUsername },
    update: { platformUsername },
  });
}
