// Memoria simple de conversaciones y “takeover” humano
const transcripts = new Map();   // phone -> [{role, text, ts}]
const status = new Map();        // phone -> { humanOverride: boolean }

export function logMessage(phone, role, text) {
  const arr = transcripts.get(phone) || [];
  arr.push({ role, text, ts: Date.now() });
  transcripts.set(phone, arr);
}
export function getTranscript(phone) {
  return transcripts.get(phone) || [];
}
export function listConversations() {
  return Array.from(transcripts.keys()).map(k => {
    const t = transcripts.get(k) || [];
    const last = t.length ? t[t.length-1].text : '';
    const st = status.get(k) || { humanOverride: false };
    return { phone: k, last, ...st };
  });
}
export function setHumanOverride(phone, on) {
  const st = status.get(phone) || {};
  st.humanOverride = !!on;
  status.set(phone, st);
}
