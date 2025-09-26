import { verifyToken } from '../services/adminAuth.js';

export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.rol !== 'admin') return res.status(401).json({ ok:false, error:'unauthorized' });
  req.admin = payload;
  next();
}
