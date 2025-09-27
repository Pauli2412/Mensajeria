import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// URL del webhook de n8n que devuelve los usuarios de BaseUsuarios
const BASE_USUARIOS_WEBHOOK = process.env.N8N_BASEUSUARIOS_WEBHOOK;
// ejemplo en .env:
// N8N_BASEUSUARIOS_WEBHOOK=https://infinitycta.app.n8n.cloud/webhook-test/base-usuarios

export async function syncUsersFromSheets() {
  try {
    console.log("[SYNC] Iniciando sincronización con Google Sheets...");

    // 1. Traer usuarios desde n8n
    const { data: usuarios } = await axios.get(BASE_USUARIOS_WEBHOOK);

    if (!Array.isArray(usuarios)) {
      console.error("[SYNC] El webhook no devolvió un array.");
      return;
    }

    for (const u of usuarios) {
      const telefono = (u.Telefono || "").replace(/\D/g, ""); // limpiar
      if (!telefono) continue;

      // 2. Upsert (si existe actualiza, si no crea)
      await prisma.user.upsert({
        where: { telefono },
        update: {
          nombre: u.Nombre || null,
          cuil: u.CUIL || null,
          plataformas: u.Plataforma || null,
        },
        create: {
          telefono,
          nombre: u.Nombre || null,
          cuil: u.CUIL || null,
          plataformas: u.Plataforma || null,
        },
      });
    }

    console.log(`[SYNC] ${usuarios.length} usuarios procesados.`);
  } catch (err) {
    console.error("[SYNC] Error al sincronizar:", err.message);
  }
}
