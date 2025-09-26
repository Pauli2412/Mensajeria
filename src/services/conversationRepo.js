import  prisma  from './db.js';

export async function ensureOpenConversation(userId) {
  let conv = await prisma.conversation.findFirst({
    where: { userId, status: { in: [ 'NEW', 'OPEN', 'WAITING_USER', 'WAITING_ADMIN', 'NEW_USER_PENDING' ] } },
    orderBy: { updatedAt: 'desc' },
  });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { userId, status: 'OPEN' },
    });
  }
  return conv;
}

export async function addMessage(conversationId, sender, text, metadata) {
  return prisma.message.create({
    data: { conversationId, rol: sender, contenido: text }
  });
}


export async function setConversationStatus(conversationId, status) {
  return prisma.conversation.update({ where: { id: conversationId }, data: { status } });
}

export async function getTranscriptByPhone(phone) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return [];
  const convs = await prisma.conversation.findMany({
    where: { userId: user.id },
    include: { messages: true },
    orderBy: { createdAt: 'desc' },
  });
  return convs;
}

/**
 * Busca un usuario por teléfono o lo crea si no existe
 */
export async function createOrGetUser(phone) {
  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({ data: { phone } });
  }
  return user;
}

/**
 * Busca una conversación abierta o crea una nueva
 */
export async function createOrGetConversation(phone) {
  const user = await createOrGetUser(phone);

  let conv = await prisma.conversation.findFirst({
    where: { userId: user.id, status: 'open' },
    orderBy: { createdAt: 'desc' },
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: { userId: user.id, status: 'open' },
    });
  }

  return conv;
}

/**
 * Guarda un mensaje en la conversación
 */
export async function logMessage(phone, role, text) {
  const conv = await createOrGetConversation(phone);
  const msg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      role,
      text,
    },
  });
  return msg;
}

/**
 * Obtiene transcript de una conversación
 */
export async function getTranscript(phone) {
  const conv = await createOrGetConversation(phone);
  const msgs = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: 'asc' },
  });
  return msgs;
}

/**
 * Lista todas las conversaciones de un usuario
 */
export async function listConversations(phone) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return [];
  return prisma.conversation.findMany({
    where: { userId: user.id },
    include: { messages: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Marca conversación como intervenida por humano
 */
export async function setHumanOverride(phone, active = true) {
  const conv = await createOrGetConversation(phone);
  return prisma.conversation.update({
    where: { id: conv.id },
    data: { humanOverride: active },
  });
}
