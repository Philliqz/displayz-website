import { CONFIG } from './config.js';
import * as mailto from './forms/adapter-mailto.js';
import * as webhook from './forms/adapter-webhook.js';
import * as supabaseStub from './forms/adapter-supabase-stub.js';
import * as sheets from './forms/adapter-sheets.js';

const ADAPTERS = {
  mailto,
  webhook,
  'supabase-stub': supabaseStub,
  sheets
};

export function init() {
  document.querySelectorAll('form[data-contact-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      handleSubmit(e, form, () => form.reset());
    });
  });
}

function showStatus(form, message, variant) {
  const status = form.querySelector('[data-form-status]');
  if (!status) return;
  status.textContent = message;
  status.className = 'form-status form-status--' + variant;
}

export function handleSubmit(e, form, onSuccess) {
  e.preventDefault();
  const data = new FormData(form);
  if (data.get('Sitio Web')) {
    // Honeypot: campo oculto que un humano nunca llena. Si viene lleno es un
    // bot — se descarta en silencio (sin avisarle que fue detectado) en vez
    // de contaminar la hoja de leads reales.
    onSuccess();
    showStatus(form, 'Listo, recibimos tu mensaje. Te respondemos en menos de 24 horas.', 'success');
    return;
  }
  const adapter = ADAPTERS[CONFIG.FORM_PROVIDER] || mailto;
  adapter.submit(data, CONFIG)
    .then(() => {
      onSuccess();
      showStatus(form, 'Listo, recibimos tu mensaje. Te respondemos en menos de 24 horas.', 'success');
    })
    .catch(() => {
      mailto.submit(data, CONFIG).then(() => {
        onSuccess();
        showStatus(form, 'No pudimos enviarlo directo, así que abrimos tu correo con el mensaje ya listo — solo dale enviar.', 'fallback');
      });
    });
}
