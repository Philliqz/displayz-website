// Adaptador por defecto — funciona con cero backend. Construye un link mailto: con
// los campos del formulario y navega a él (abre el cliente de correo del usuario).
export function submit(formData, config) {
  const lines = [];
  formData.forEach((value, key) => { if (value) lines.push(`${key}: ${value}`); });
  const subject = encodeURIComponent('Nuevo contacto desde Displayz.Studio');
  const body = encodeURIComponent(lines.join('\n'));
  window.location.href = `mailto:${config.CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  return Promise.resolve();
}
