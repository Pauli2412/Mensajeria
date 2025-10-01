import { Router } from "express";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { listConversations, getTranscript, logMessage, setHumanOverride } from "../services/chatStore.js";
import { sendAdminResponse } from "../services/n8nClient.js";
import { listReclamos, listRetiros } from "../services/adminsheets.js";
import { authAdmin, signToken } from "../services/adminAuth.js";

const r = Router();

// GET /admin/chats
r.get("/chats", requireAdmin, (req, res) => {
  res.json({ ok:true, chats: listConversations() });
});

// GET /admin/transcript
r.get("/transcript", requireAdmin, (req, res) => {
  const { phone } = req.query || {};
  if (!phone) return res.status(400).json({ ok:false, error:"phone requerido" });
  res.json({ ok:true, phone, transcript: getTranscript(phone) });
});

// NUEVO: GET /admin/reclamos
r.get("/reclamos", requireAdmin, async (req, res, next) => {
  try {
    const reclamos = await listReclamos();
    res.json({ ok:true, reclamos });
  } catch (e) { next(e); }
});

// NUEVO: GET /admin/retiros
r.get("/retiros", requireAdmin, async (req, res, next) => {
  try {
    const retiros = await listRetiros();
    res.json({ ok:true, retiros });
  } catch (e) { next(e); }
});

/**
 * POST /admin/login  -> JWT
 */
r.post('/login', async (req, res) => {
  const { user, pass } = req.body || {};
  if (!user || !pass) return res.status(400).json({ ok:false, error:'user y pass requeridos' });
  const adm = await authAdmin(user, pass);
  if (!adm) return res.status(401).json({ ok:false, error:'credenciales inválidas' });
  const token = signToken({ user: adm.user, rol: adm.rol, email: adm.email });
  res.json({ ok:true, token, admin:{ user: adm.user, rol: adm.rol } });
});

/**
 * GET /admin/conversations
 * Lista conversaciones con:
 * - usuario (id, phone, nombre)
 * - último mensaje
 * - estado
 * - cantidad de mensajes
 */
r.get('/conversations', requireAdmin, async (req, res) => {
  try {
    const convs = await prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, phone: true, nombre: true } },
        mensajes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, rol: true, contenido: true, createdAt: true },
        },
        _count: { select: { mensajes: true } },
      },
    });

    // normalizo "ultimoMensaje"
    const data = convs.map(c => ({
      id: c.id,
      estado: c.estado,
      createdAt: c.createdAt,
      user: c.user,
      totalMensajes: c._count.mensajes,
      ultimoMensaje: c.mensajes[0] ? formatMessage(c.mensajes[0]) : null,
    }));

    res.json({ ok: true, conversations: data });
  } catch (e) {
    console.error('❌ /admin/conversations:', e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

/**
 * GET /admin/conversations/:id
 * Devuelve todos los mensajes (asc) y datos del usuario.
 */
r.get('/conversations/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, phone: true, nombre: true } },
        mensajes: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) return res.status(404).json({ ok:false, error:'conversación no encontrada' });

    res.json({ ok:true, conversation: {
      id: conv.id,
      estado: conv.estado,
      createdAt: conv.createdAt,
      user: conv.user,
      mensajes: conv.mensajes.map(formatMessage),

    }});
  } catch (e) {
    console.error('❌ /admin/conversations/:id:', e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

/**
 * POST /admin/respond
 * Body: { conversationId, mensaje }
 * - Inserta mensaje rol=admin
 * - Notifica a n8n (para reenviar al usuario)
 */
r.post('/respond', requireAdmin, async (req, res) => {
  try {
    const { conversationId, mensaje } = req.body || {};
    if (!conversationId || !mensaje) {
      return res.status(400).json({ ok:false, error:'conversationId y mensaje requeridos' });
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { user: { select: { phone: true } } },
    });
    if (!conv) return res.status(404).json({ ok:false, error:'conversación no encontrada' });

    const msg = await prisma.message.create({
      data: {
        conversationId,
        rol: 'admin',
        contenido: mensaje,
      },
    });

    // notificar a n8n -> reenviar al usuario
    let n8n = null;
    try {
      n8n = await sendAdminResponse({
        phone: conv.user.phone,
        text: mensaje,
        agent: req.admin?.user || 'admin',
      });
    } catch (e) {
      // si n8n falla, igual devolvemos el mensaje insertado
      console.error('⚠️ Error notificando a n8n:', e.message);
    }

    res.json({ ok:true, message: formatMessage(msg), n8n });
  } catch (e) {
    console.error('❌ /admin/respond:', e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

/**
 * POST /admin/conversations/:id/close
 * Marca la conversación como cerrada
 */
r.post('/conversations/:id/close', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const conv = await prisma.conversation.update({
      where: { id },
      data: { estado: 'cerrada' },
    });
    res.json({ ok:true, conversation: conv });
  } catch (e) {
    console.error('❌ /admin/conversations/:id/close:', e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

r.get('/pending-users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { estado: "pendiente" },
      select: { id: true, phone: true, nombre: true, cuil: true, plataformas: true, estado: true },
    });
    res.json({ ok: true, users });
  } catch (e) {
    console.error("❌ /admin/pending-users:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

r.post('/approve-user', requireAdmin, async (req, res) => {
  try {
    const { userId, accion } = req.body || {};
    if (!userId || !accion) {
      return res.status(400).json({ ok: false, error: "userId y accion requeridos" });
    }

    const nuevoEstado = accion === "aprobar" ? "activo" : "rechazado";
    const user = await prisma.user.update({
      where: { id: userId },
      data: { estado: nuevoEstado },
    });

    res.json({ ok: true, userId: user.id, estado: user.estado });
  } catch (e) {
    console.error("❌ /admin/approve-user:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});



export default r;

