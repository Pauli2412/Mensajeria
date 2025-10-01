// routes/adminUsers.js
import { Router } from "express";
import bcrypt from "bcrypt";
import prisma from "../services/db.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const r = Router();

/**
 * POST /admin/users
 * Crear un nuevo AdminUser
 * Body: { user, pass, email, role }
 */
r.post("/users", requireAdmin, async (req, res) => {
  try {
    const { user, pass, email, role } = req.body || {};
    if (!user || !pass) {
      return res.status(400).json({ ok:false, error:"user y pass requeridos" });
    }

    // solo superadmin puede crear
    if (req.admin?.rol !== "superadmin") {
      return res.status(403).json({ ok:false, error:"No autorizado" });
    }

    const passHash = await bcrypt.hash(pass, 10);

    const adm = await prisma.adminUser.create({
      data: {
        user,
        passHash,
        email: email || null,
        role: role || "admin"
      }
    });

    res.json({ ok:true, admin: { id: adm.id, user: adm.user, role: adm.role } });
  } catch (e) {
    console.error("❌ error creando admin:", e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

export default r;
