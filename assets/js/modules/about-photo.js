// Elige una de las 3 fotos de "Sobre mí" al azar, una por sesión de visita.
// sessionStorage y no localStorage: la foto debe quedarse fija mientras el visitante
// navega (recargas, volver atrás) y volver a sortearse en la próxima visita.
// Las tres comparten la relación 3/4 del CSS, que es la nativa de los archivos, así
// que ninguna se recorta y no hace falta un encuadre distinto por foto.
const FOTOS = [
  { src: 'assets/images/about-sentado.jpg', alt: 'Ismael Kentish, fundador de Displayz.Studio, sentado en un banco alto rojo sosteniendo un gimbal con cámara' },
  { src: 'assets/images/about-espalda.jpg', alt: 'Ismael Kentish, fundador de Displayz.Studio, de espaldas mirando por encima del hombro hacia la cámara' },
  { src: 'assets/images/about-retrato.jpg', alt: 'Retrato de medio cuerpo de Ismael Kentish, fundador de Displayz.Studio, sosteniendo un gimbal con cámara' }
];

const CLAVE = 'displayz:about-foto';

export function init() {
  const img = document.querySelector('.about-photo');
  if (!img) return;

  const foto = elegirFoto();
  img.alt = foto.alt;
  // El src se asigna aquí y no en el HTML a propósito: con un src fijo el navegador
  // descargaría una foto que quizá no se use y se vería el salto al reemplazarla.
  img.src = foto.src;
}

function elegirFoto() {
  const sorteada = FOTOS[Math.floor(Math.random() * FOTOS.length)];
  try {
    // Se guarda el src y no un índice: si mañana cambia el orden del array, un índice
    // viejo apuntaría a otra foto, mientras que un src que ya no existe simplemente
    // no encuentra match y se vuelve a sortear.
    const guardada = FOTOS.find((f) => f.src === sessionStorage.getItem(CLAVE));
    if (guardada) return guardada;
    sessionStorage.setItem(CLAVE, sorteada.src);
  } catch (e) {
    // Modo privado estricto o storage bloqueado: se sortea igual, solo se pierde
    // la estabilidad entre recargas. La sección nunca queda sin foto.
  }
  return sorteada;
}
