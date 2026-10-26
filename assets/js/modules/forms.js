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
    form.querySelectorAll('select.form-select').forEach(enhanceSelect);
  });
  // Botón de una tarjeta de servicio ("Lo quiero", "Cotizar"…): deja esa opción
  // elegida en el formulario; el enlace #contacto hace el resto.
  document.querySelectorAll('[data-servicio]').forEach((a) => {
    a.addEventListener('click', () => {
      const select = document.querySelector('form[data-contact-form] select[name="Tipo de solicitud"]');
      if (!select) return;
      select.value = a.dataset.servicio;
      select.dispatchEvent(new Event('change'));
    });
  });
}

// Desplegable con el estilo del sitio. El <select> real se queda oculto en el
// formulario: es el que viaja en FormData, y el botón y la lista solo lo reflejan.
function enhanceSelect(select) {
  const id = select.id;
  const opts = [...select.options];
  const wrap = document.createElement('div');
  wrap.className = 'dd';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dd-btn';
  btn.id = id + '-btn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  const list = document.createElement('ul');
  list.className = 'dd-list';
  list.id = id + '-list';
  list.setAttribute('role', 'listbox');
  list.tabIndex = -1;
  list.hidden = true;
  btn.setAttribute('aria-controls', list.id);
  const label = document.querySelector('label[for="' + id + '"]');
  if (label) {
    label.htmlFor = btn.id;
    label.id ||= id + '-label';
    list.setAttribute('aria-labelledby', label.id);
    // Etiqueta + texto del botón: el lector anuncia «¿Qué necesitas? Evento», no solo la etiqueta.
    btn.setAttribute('aria-labelledby', label.id + ' ' + btn.id);
  }

  const items = opts.map((o, i) => {
    const li = document.createElement('li');
    li.className = 'dd-opt';
    li.id = id + '-opt-' + i;
    li.setAttribute('role', 'option');
    li.dataset.value = o.value;
    const dot = document.createElement('i');
    if (o.dataset.c) dot.style.background = o.dataset.c;
    const txt = document.createElement('span');
    // La opción vacía queda en la lista para poder deshacer una elección.
    txt.append(Object.assign(document.createElement('b'), { textContent: o.value ? o.textContent : 'Sin elegir' }));
    if (o.dataset.d) txt.append(Object.assign(document.createElement('small'), { textContent: o.dataset.d }));
    li.append(dot, txt);
    li.addEventListener('click', () => { choose(o.value); close(true); });
    li.addEventListener('mousemove', () => setActive(li));
    list.appendChild(li);
    return li;
  });

  let active = null;
  function setActive(li) {
    items.forEach((x) => x.classList.toggle('is-active', x === li));
    active = li;
    if (li) list.setAttribute('aria-activedescendant', li.id);
  }
  function sync() {
    const o = select.selectedOptions[0] || opts[0];
    btn.textContent = o.textContent;
    btn.classList.toggle('has-value', !!select.value);
    items.forEach((li) => li.setAttribute('aria-selected', String(li.dataset.value === select.value)));
  }
  function choose(v) { select.value = v; sync(); }
  function open() {
    list.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    setActive(items.find((li) => li.dataset.value === select.value) || items[0]);
    list.focus();
  }
  function close(focusBtn) {
    if (list.hidden) return;
    list.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (focusBtn) btn.focus();
  }

  btn.addEventListener('click', () => (list.hidden ? open() : close(true)));
  btn.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); open(); }
  });
  list.addEventListener('keydown', (e) => {
    const i = items.indexOf(active);
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(items[Math.min(i + 1, items.length - 1)]); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(items[Math.max(i - 1, 0)]); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (active) choose(active.dataset.value); close(true); }
    else if (e.key === 'Escape' || e.key === 'Tab') { close(e.key === 'Escape'); }
  });
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(false); });
  select.addEventListener('change', sync);
  // form.reset() no dispara "change": se resincroniza después del reset.
  select.form?.addEventListener('reset', () => setTimeout(sync));

  select.hidden = true;
  select.before(wrap);
  wrap.append(btn, list, select);
  sync();
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
