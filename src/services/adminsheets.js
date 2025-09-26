import { google } from 'googleapis';

function sheetsClient() {
  const jwt = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets.readonly']
  );
  return google.sheets({ version: 'v4', auth: jwt });
}

export async function findAdminByUser(user) {
  if (!process.env.ADMINS_SHEET_ID) return null;
  const sheets = sheetsClient();
  const range = `${process.env.ADMINS_SHEET_NAME || 'Admins'}!A:Z`;
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.ADMINS_SHEET_ID, range });
  const rows = data.values || [];
  if (rows.length < 2) return null;
  const header = rows[0];
  const map = (r)=>Object.fromEntries(header.map((h,i)=>[h.trim(), (r[i]||'').trim()]));
  for (const r of rows.slice(1)) {
    const o = map(r);
    if ((o['USUARIO']||'').toLowerCase() === user.toLowerCase()) {
      return {
        user: o['USUARIO'], passHash: o['PASSWORD_HASH'],
        rol: o['ROL'] || 'admin', email: o['EMAIL'] || ''
      };
    }
  }
  return null;
}

export async function readSheetRange(rangeA1) {
  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: rangeA1,
  });
  const rows = res.data.values || [];
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i] ?? "");
    return obj;
  });
}

export async function listReclamos() {
  // Hoja "Reclamos" con columnas: Telefono | Mensaje | Fecha
  return readSheetRange("Reclamos!A:C");
}

export async function listRetiros() {
  // Hoja "Retiros" con columnas: Telefono | Monto | Fecha
  return readSheetRange("Retiros!A:C");
}