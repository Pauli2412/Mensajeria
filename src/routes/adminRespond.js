// src/routes/adminRespond.js
import { Router } from "express";
import axios from "axios";
import prisma from "../services/db.js";

const r = Router();

const N8N_ADMIN_RESPOND_WEBHOOK = process.env.N8N_ADMIN_RESPOND_WEBHOOK;

// ✅ POST /api/admin/respond
r.post("/respond", async (req, res) => {
  try {
    const { telefono, mensaje } = req.body;

    if (!telefono || !mensaje) {
      return res.status(400).json({ ok: false, error: "telefono y mensaje requeridos" });
    }

    // Guardar en la base de datos como mensaje admin
    const user = await prisma.user.findUnique({ where: { phone: telefono } });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    let conv = await prisma.conversation.findFirst({
      where: { userId: user.id, estado: "abierta" },
      orderBy: { createdAt: "desc" },
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: { userId: user.id, estado: "abierta" },
      });
    }

    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        rol: "admin",
        contenido: mensaje,
      },
    });

    // Enviar el mensaje a n8n
    const n8nResp = await axios.post(N8N_ADMIN_RESPOND_WEBHOOK, {
      telefono,
      mensaje,
    });

    res.json({
      status: "admin_message",
      reply: mensaje,
      rol: "admin",
      n8n: n8nResp.data,
      messageId: msg.id,
    });
  } catch (e) {
    console.error("❌ Error en /api/admin/respond:", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default r;
