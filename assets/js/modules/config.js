// Configuración central del sitio — un solo lugar para cambiar comportamiento sin tocar HTML.
export const CONFIG = {
  // 'mailto' funciona con cero backend (default). 'sheets' manda cada envío a una
  // Google Sheet (ver SHEETS_ENDPOINT abajo). 'webhook'/'supabase-stub' quedan
  // listos para cuando haga falta — ver forms/.
  FORM_PROVIDER: 'sheets',
  FORM_ENDPOINT: '',
  SHEETS_ENDPOINT: 'https://script.google.com/macros/s/AKfycbzryuJMPNT3OMXpa9EW9kgPXxzTpuu54sbMsZsyGTexNpJnBKGuJ2zCdT2Lu2Q_1Ld5/exec',
  CONTACT_EMAIL: 'ismaelkentish@gmail.com',
  WHATSAPP_URL: 'https://wa.me/50764498833',
  DATA_URL: 'database/empresas.json'
};
