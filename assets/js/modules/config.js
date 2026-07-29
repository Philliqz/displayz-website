// Configuración central del sitio — un solo lugar para cambiar comportamiento sin tocar HTML.
export const CONFIG = {
  // 'mailto' funciona con cero backend (default). Cambiar a 'webhook' + FORM_ENDPOINT,
  // o a 'supabase-stub'/'sheets-stub' una vez esté esa integración lista — ver forms/.
  FORM_PROVIDER: 'mailto',
  FORM_ENDPOINT: '',
  CONTACT_EMAIL: 'ismaelkentish@gmail.com',
  WHATSAPP_URL: 'https://wa.me/50764498833',
  DATA_URL: 'database/empresas.json'
};
