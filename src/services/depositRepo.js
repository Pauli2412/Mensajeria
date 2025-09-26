import { prisma } from './db.js';

export async function recordDeposit({ userId, platform, amount, telepagosRef, payerPhone, payerCuil, status }) {
  return prisma.deposit.create({
    data: { userId, platform, amount, telepagosRef, payerPhone, payerCuil, status: status || 'RECEIVED' },
  });
}

export async function getDepositHistory(userId) {
  return prisma.deposit.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
