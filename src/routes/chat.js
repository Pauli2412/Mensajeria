// src/routes/chat.js
import { Router } from "express";
import prisma from "../services/db.js";

const r = Router();

/**
 * POST /chat-user
 * Guarda interacción user ↔ bot en la DB
 */
r.post("/chat-user", async (req, res) => {
  try {
    const { telefono, userMessage, botReply, options } = req.body;

    if (!telefono || !userMessage || !botReply) {
      return res.status(400).json({ status: "error", error: "telefono, userMessage y botReply requeridos" });
    }

    // 1. Buscar o crear usuario
    let user = await prisma.user.findUnique({ where: { phone: telefono } });
    if (!user) {
      user = await prisma.user.create({ data: { phone: telefono } });
    }

    // 2. Buscar o crear conversación activa
    let conversation = await prisma.conversation.findFirst({
      where: { userId: user.id, estado: "abierta" },
      orderBy: { createdAt: "desc" }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId: user.id, estado: "abierta" }
      });
    }

    // 3. Guardar mensajes
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        rol: "user",
        contenido: userMessage
      }
    });

    let contenidoBot = botReply;
    if (options && Array.isArray(options) && options.length > 0) {
      contenidoBot += `\nOpciones: ${options.join(" | ")}`;
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        rol: "bot",
        contenido: contenidoBot
      }
    });

    // 4. Responder al frontend
    res.json({
      status: "ok",
      conversationId: conversation.id,
      reply: botReply,
      options: options || []
    });

  } catch (e) {
    console.error("❌ Error en /chat-user:", e);
    res.status(500).json({ status: "error", error: e.message });
  }
});

r.get("/user/:telefono/history", async (req, res) => {
  try {
    const { telefono } = req.params;
    const user = await prisma.user.findUnique({ where: { phone: telefono } });
    if (!user) return res.json({ ok:true, conversations: [] });

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        mensajes: { orderBy: { createdAt: 'asc' } },
      },
    });

    res.json({ ok:true, conversations });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
});

export default r;
