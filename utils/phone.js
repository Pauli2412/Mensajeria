export function normalizePhone(raw = '') {
  return (raw || '').toString().replace(/\D/g, '');
}
