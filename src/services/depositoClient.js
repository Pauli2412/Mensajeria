import axios from 'axios';

const msBase = (process.env.MS_DEPOSITO_URL || '').replace(/\/$/, '');

export async function getHistoryByPhone(phone) {
  if (!msBase) throw Object.assign(new Error('MS_DEPOSITO_URL no configurado'), { status: 500 });
  const { data } = await axios.get(`${msBase}/historial`, {
    params: { telefono: phone },
    timeout: 15000
  });
  return data;
}
