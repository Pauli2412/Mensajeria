import axios from "axios";

export async function chatIn(payload) {
  const url = process.env.N8N_LOGIN_WEBHOOK;
  const res = await axios.post(url, payload);
  return res.data;
}

export async function sendComplaint(payload) {
  const url = process.env.N8N_COMPLAINT_WEBHOOK;
  const res = await axios.post(url, payload);
  return res.data;
}

export async function sendWithdrawRequest(payload) {
  const url = process.env.N8N_WITHDRAW_WEBHOOK;
  const res = await axios.post(url, payload);
  return res.data;
}


export async function sendAdminResponse({ phone, text, agent }) {
  const r = await axios.post(N8N_ADMIN_RESPOND_WEBHOOK, {
    telefono: phone,
    mensaje: text,
    agente: agent || "admin",
  });
  return r.data;
}