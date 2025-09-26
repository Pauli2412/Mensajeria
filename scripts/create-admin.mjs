// scripts/create-admin.mjs
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const USER = process.env.USER || process.argv[2];
  const PASS = process.env.PASS || process.argv[3];
  const ROL  = process.env.ROL  || 'superadmin';
  const EMAIL = process.env.EMAIL || null;

  if (!USER || !PASS) {
    console.error('Uso: USER=<usuario> PASS=<clave> node scripts/create-admin.mjs');
    process.exit(1);
  }

  const passHash = await bcrypt.hash(PASS, 10);

  // upsert: crea si no existe; si existe, actualiza hash/rol/email
  const admin = await prisma.admin.upsert({
    where: { user: USER },
    create: { user: USER, passHash, rol: ROL, email: EMAIL },
    update: { passHash, rol: ROL, email: EMAIL },
  });

  console.log('OK admin guardado:', { user: admin.user, rol: admin.rol, email: admin.email || '' });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
