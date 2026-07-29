// Envía el formulario a un Google Apps Script publicado como Web App, que agrega
// una fila nueva a una Google Sheet. Usa Content-Type: text/plain a propósito —
// Apps Script no responde bien al preflight CORS que dispara application/json desde
// el navegador; text/plain evita el preflight (Apps Script igual puede leer el body
// como JSON con JSON.parse(e.postData.contents)).
export function submit(formData, config) {
  if (!config.SHEETS_ENDPOINT) {
    return Promise.reject(new Error('CONFIG.SHEETS_ENDPOINT no está configurado.'));
  }
  const payload = {};
  formData.forEach((value, key) => { payload[key] = value; });
  payload.fecha = new Date().toISOString();

  return fetch(config.SHEETS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).then((res) => {
    if (!res.ok) throw new Error('Google Sheets webhook respondió ' + res.status);
  });
}
