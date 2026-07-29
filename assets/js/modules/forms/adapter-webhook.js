// Envía el formulario como JSON a config.FORM_ENDPOINT (Google Apps Script, API REST,
// Zapier/Make webhook, etc.). Requiere que FORM_ENDPOINT esté configurado.
export function submit(formData, config) {
  const payload = {};
  formData.forEach((value, key) => { payload[key] = value; });
  return fetch(config.FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
