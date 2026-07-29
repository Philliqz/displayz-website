import { CONFIG } from './config.js';
import * as mailto from './forms/adapter-mailto.js';
import * as webhook from './forms/adapter-webhook.js';
import * as supabaseStub from './forms/adapter-supabase-stub.js';
import * as sheetsStub from './forms/adapter-sheets-stub.js';

const ADAPTERS = {
  mailto,
  webhook,
  'supabase-stub': supabaseStub,
  'sheets-stub': sheetsStub
};

export function init() {
  document.querySelectorAll('form[data-contact-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      handleSubmit(e, form, () => form.reset());
    });
  });
}

export function handleSubmit(e, form, onSuccess) {
  e.preventDefault();
  const data = new FormData(form);
  const adapter = ADAPTERS[CONFIG.FORM_PROVIDER] || mailto;
  adapter.submit(data, CONFIG)
    .then(onSuccess)
    .catch(() => { mailto.submit(data, CONFIG).then(onSuccess); });
}
