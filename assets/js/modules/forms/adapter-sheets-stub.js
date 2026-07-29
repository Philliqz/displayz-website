// Placeholder para Google Sheets vía Google Apps Script publicado como webhook.
// Mismo contrato que los demás adaptadores: submit(formData, config) => Promise.
export function submit() {
  return Promise.reject(new Error(
    'FORM_PROVIDER "sheets-stub" seleccionado pero no configurado todavía — ver README.md, sección Formularios.'
  ));
}
