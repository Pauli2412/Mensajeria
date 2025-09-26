import { Router } from 'express';
import { chatIn, sendComplaint, sendWithdrawRequest } from '../services/n8nClient.js';
import { getHistoryByPhone } from '../services/depositoClient.js';
import { logMessage } from '../services/chatStore.js';
import { upsertUserByPhone } from '../services/userRepo.js';
import { ensureOpenConversation, addMessage } from '../services/conversationRepo.js';
import prisma  from "../services/db.js";


const r = Router();

r.post("/login", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ ok: false, error: "phone requerido" });
    }

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone }
    });

    res.json({ ok: true, user });
  } catch (e) {
    console.error("❌ Error en /login:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

r.post("/retiro", async (req, res) => {
  try {
    const { phone, monto, plataforma } = req.body;
    if (!phone || !monto || !plataforma) {
      return res.status(400).json({ ok: false, error: "phone, monto, plataforma requeridos" });
    }

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone }
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

r.get('/historial', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ ok:false, error:'phone requerido' });

    const user = await prisma.user.findUnique({ where: { phone } });
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


r.post('/reclamo', async (req, res, next) => {
  try {
    const { phone, text, meta } = req.body || {};
    if (!phone || !text) {
      return res.status(400).json({ ok:false, error:'phone y text requeridos' });
    }

    // 📌 Aseguramos que el usuario exista
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone }
    });

    // 📌 Guardamos el reclamo en la BDD
    const complaint = await prisma.complaint.create({
      data: {
        userId: user.id,
        mensaje: text,
        estado: "pendiente"
      }
    });

    // 📌 Log interno
    logMessage(phone, 'me', `[RECLAMO] ${text}`);

    // 📌 También lo mandamos a n8n
    const resp = await sendComplaint({ phone, text, meta });

    res.json({ ok:true, complaint, n8n: resp });
  } catch (e) {
    console.error("❌ Error en /reclamo:", e);
    res.status(500).json({ ok:false, error: e.message });
  }
});




export default r;
