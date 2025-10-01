import { Router } from 'express';
import { chatIn, sendComplaint, sendWithdrawRequest } from '../services/n8nClient.js';
import { upsertUserByPhone } from '../services/userRepo.js';
import { ensureOpenConversation, addMessage } from '../services/conversationRepo.js';
import prisma from "../services/db.js";

const r = Router();

function normalizePhone(phone) {
  return (phone || "").replace(/\D/g, ""); 
}

// 📌 LOGIN
r.post("/login", async (req, res) => {
  try {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ ok: false, reply: "⚠️ Teléfono requerido" });

    phone = normalizePhone(phone);

    const user = await prisma.user.findFirst({ where: { phone } });

    if (user) {
      return res.json({
        ok: true,
        reply: "✅ Usuario detectado",
        usuario: {
          nombre: user.nombre,
          telefono: user.phone,
          cuil: user.cuil,
          plataformas: user.plataformas ? user.plataformas.split(",") : [],
        },
      });
    }

    return res.json({
      ok: false,
      reply: "⚠️ No encontramos tu usuario. ¿Deseas registrarte?",
      options: ["Iniciar registro", "Cancelar"],
    });
  } catch (e) {
    console.error("❌ Error en /login:", e);
    res.status(500).json({ ok: false, reply: e.message });
  }
});

// 📌 RETIRO
r.post("/retiro", async (req, res) => {
  try {
    const { phone, monto, plataforma } = req.body;
    if (!phone || !monto || !plataforma) {
      return res.status(400).json({ ok: false, error: "phone, monto, plataforma requeridos" });
    }

    const cleanPhone = normalizePhone(phone);

    const user = await prisma.user.upsert({
      where: { phone: cleanPhone },
      update: {},
      create: { phone: cleanPhone }
    });

    const retiro = await prisma.deposit.create({
      data: { userId: user.id, monto, estado: "pendiente" }
    });

    res.json({ ok: true, retiro });
  } catch (e) {
    console.error("❌ Error en /retiro:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 📌 HISTORIAL
r.get('/historial', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ ok:false, error:'phone requerido' });

    const cleanPhone = normalizePhone(phone);
    const user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (!user) return res.json({ ok:true, history: [] });

    const deposits = await prisma.deposit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ ok:true, history: deposits });
  } catch (e) {
    console.error("❌ Error en /historial:", e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

// 📌 RECLAMO
r.post('/reclamo', async (req, res) => {
  try {
    const { phone, text, meta } = req.body || {};
    if (!phone || !text) {
      return res.status(400).json({ ok:false, error:'phone y text requeridos' });
    }

    const cleanPhone = normalizePhone(phone);

    const user = await prisma.user.upsert({
      where: { phone: cleanPhone },
      update: {},
      create: { phone: cleanPhone }
    });

    const complaint = await prisma.complaint.create({
      data: {
        userId: user.id,
        mensaje: text,
        estado: "pendiente"
      }
    });

    // antes: logMessage(phone, 'me', `[RECLAMO] ${text}`);
    // ahora guardamos también en conversación opcional
    await prisma.message.create({
      data: {
        conversationId: await ensureOpenConversation(user.id),
        rol: "user",
        contenido: `[RECLAMO] ${text}`
      }
    });

    const resp = await sendComplaint({ phone: cleanPhone, text, meta });

    res.json({ ok:true, complaint, n8n: resp });
  } catch (e) {
    console.error("❌ Error en /reclamo:", e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

export default r;
