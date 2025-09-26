import { google } from 'googleapis';
import { prisma } from '../db/prisma.js';

const SHEET_ID = process.env.SHEETS_ID; // tu spreadsheet
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function syncSheets() {
  console.log('🔄 Iniciando sync con Google Sheets...');

  // --- BaseUsuarios ---
  const baseRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'BaseUsuarios!A2:E',
  });

  const baseRows = baseRes.data.values || [];
  for (const row of baseRows) {
    const [nombre, telefono, cuil, plataforma] = row;
    if (!telefono) continue;

    await prisma.user.upsert({
      where: { phone: telefono },
      update: { name: nombre, cuil },
      create: { name: nombre, phone: telefono, cuil },
    });

    if (plataforma) {
      await prisma.platformAccount.upsert({
        where: { unique_user_platform: { userPhone: telefono, platform: plataforma } },
        update: {},
        create: { userPhone: telefono, platform: plataforma },
      });
    }
  }

  // --- NuevosUsuarios ---
  const nuevosRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'NuevosUsuarios!A2:E',
  });

  const nuevosRows = nuevosRes.data.values || [];
  for (const row of nuevosRows) {
    const [nombre, telefono, cuil, plataformas] = row;
    if (!telefono) continue;

    await prisma.user.upsert({
      where: { phone: telefono },
      update: {},
      create: { name: nombre, phone: telefono, cuil, estado: 'pendiente' },
    });
  }

  console.log('✅ Sync con Google Sheets completado.');
}
