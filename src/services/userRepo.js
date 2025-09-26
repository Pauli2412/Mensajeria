// src/services/userRepo.js
import e from 'express';
import { prisma } from '../dbClient.js';

// Crear o actualizar usuario
export async function upsertUser({ telefono, nombre, cuil, plataformas }) {
  return prisma.user.upsert({
    where: { telefono },
    update: { nombre, cuil, plataformas },
    create: { telefono, nombre, cuil, plataformas },
  });
}

// Buscar usuario por teléfono
export async function findUserByPhone(telefono) {
  return prisma.user.findUnique({
    where: { telefono },
    include: { conversaciones: true },
  });
}

// Guardar mensaje en historial de conversaciones
export async function saveMessage(telefono, rol, texto) {
  const user = await prisma.user.findUnique({ where: { telefono } });
  if (!user) throw new Error('Usuario no encontrado en BDD');

  return prisma.conversation.create({
    data: {
      userId: user.id,
      rol,
      mensaje: texto,
      estado: 'activo',
    },
  });
}

export async function uosertByPhone({ phone, name, cuil }) {
  return prisma.user.upsert({
    where: { phone },
    update: { name, cuil },
    create: { phone, name, cuil },
  });
}

export async function getUserByPhone(phone) {
  return prisma.user.findUnique({
    where: { phone },
    include: { conversations: true },
  });
}

export async function upsertUserByPhone({ phone, name, cuil }) {
  return prisma.user.upsert({
    where: { phone },
    update: { name, cuil },
    create: { phone, name, cuil },
  });
}   