// IntersectionObserver único y compartido para todo el sitio (.reveal on scroll).
// Otros módulos llaman a observe() sobre nodos que agregan dinámicamente, en vez de
// crear su propio observer.
let observer = null;

export function init() {
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
  }
  observe(document.querySelectorAll('.reveal'));
}

export function observe(items) {
  if (!items || !items.length) return;
  if (!observer) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  items.forEach((el) => observer.observe(el));
}
