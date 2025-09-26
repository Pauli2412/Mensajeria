// src/services/syncService.js
import axios from "axios";
import prisma from "./db.js";

const BASE_USUARIOS_URL = process.env.N8N_BASEUSUARIOS_WEBHOOK;

/**
 * Sincroniza usuarios desde Google Sheets (BaseUsuarios) hacia Postgres
 */
export async function syncSheets() {
  try {
    console.log("🔄 Iniciando sincronización con BaseUsuarios...");

    // ✅ Debe ser GET, no POST
    const resp = await axios.get(BASE_USUARIOS_URL);
    const data = resp.data;

    if (!Array.isArray(data)) {
      console.warn("⚠️ Respuesta inesperada de BaseUsuarios:", data);
      return;
    }

    for (const u of data) {
      const nombre = u.Nombre || null;

      // ✅ El campo se llama "Teléfono" con tilde
      let tel = u["Teléfono"] || null;
      if (!tel) continue;

      // Normalizamos (quitamos espacios y guiones)
      tel = tel.toString().replace(/\s+/g, "").replace(/-/g, "");

      const cuil = u.Cuil ? String(u.Cuil) : null;
      const plataforma = u.Plataforma || null;

      await prisma.user.upsert({
        where: { phone: tel },
        update: { nombre, cuil, plataformas: plataforma },
        create: { phone: tel, nombre, cuil, plataformas: plataforma }
      });
    }

    console.log(`✅ Sincronización completada: ${data.length} usuarios procesados`);
  } catch (err) {
    console.error("❌ Error en syncSheets:", err.message);
  }
}
