import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findAdminByUser } from './adminsheets.js';
import prisma from './db.js';   // ✅ importamos prisma

import dotenv from "dotenv";
dotenv.config();
console.log("DEBUG ENV ADMIN_USERS_JSON:", process.env.ADMIN_USERS_JSON);

const fromEnv = (() => {
  try { return JSON.parse(process.env.ADMIN_USERS_JSON || '[]'); }
  catch { return []; }
})();

export async function authAdmin(user, pass) {
  // 1) Buscar en Postgres (tabla Admin)
  const fromDb = await prisma.admin.findUnique({ where: { user } });
  if (fromDb && await bcrypt.compare(pass, fromDb.passHash)) {
    return { user: fromDb.user, rol: fromDb.rol, email: fromDb.email };
  }

  // 2) Buscar en Sheets
  const fromSheet = await findAdminByUser(user);
  if (fromSheet && await bcrypt.compare(pass, fromSheet.passHash)) {
    return { user: fromSheet.user, rol: fromSheet.rol, email: fromSheet.email };
  }

  // 3) Fallback: variable de entorno
  const envRec = fromEnv.find(u => (u.user||'').toLowerCase() === user.toLowerCase());
  if (envRec && await bcrypt.compare(pass, envRec.passHash)) {
    return { user: envRec.user, rol: envRec.rol, email: envRec.email || '' };
  }

  return null;
}

export function signToken(payload) {
  return jwt.sign(payload, process.env.ADMIN_JWT_SECRET, { expiresIn: '12h' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, process.env.ADMIN_JWT_SECRET); }
  catch { return null; }
}
