import { Router } from 'express';
import { listBaseUsuarios, listNuevosUsuarios } from '../services/adminSheets.js';
import { prisma } from '../services/db.js';
import { upsertUserByPhone } from '../services/userRepo.js';
import { upsertPlatformAccount } from '../services/platformAccountRepo.js';

const r = Router();

r.post('/sync-sheets', async (req, res, next) => {
  const run = await prisma.syncRun.create({ data: { kind: 'BASE_USERS' }});
  try {
    const base = await listBaseUsuarios(); // lee BaseUsuarios
    // Esperado: [{ Nombre, Teléfono, CUIL, Plataforma }, ...]
    for (const row of base) {
      const user = await upsertUserByPhone({ phone: row.Teléfono, name: row.Nombre, cuil: row.CUIL || row.Cuil });
      if (row.Plataforma && row['NOMBRE USUARIO']) {
        await upsertPlatformAccount(user.id, row.Plataforma, row['NOMBRE USUARIO']);
      }
    }
    await prisma.syncRun.update({ where: { id: run.id }, data: { status: 'OK', finishedAt: new Date() }});
    res.json({ ok:true, count: base.length });
  } catch (e) {
    await prisma.syncRun.update({ where: { id: run.id }, data: { status: 'ERROR', finishedAt: new Date(), details: { error: e.message } }});
    next(e);
  }
});

export default r;
