// Placeholder listo para conectar Supabase (tabla "leads" + supabase-js, o un REST
// insert directo). Falla explícitamente si se selecciona sin terminar de configurar,
// para no perder envíos en silencio — forms.js siempre cae de vuelta a mailto si esto
// rechaza, así que el usuario nunca ve un formulario roto.
export function submit() {
  return Promise.reject(new Error(
    'FORM_PROVIDER "supabase-stub" seleccionado pero no configurado todavía — ver README.md, sección Formularios.'
  ));
}
