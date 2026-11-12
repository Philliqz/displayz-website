import * as Nav from './nav.js?v=20261101-2';
import * as Animations from './animations.js';
import * as Forms from './forms.js';
import * as Lightbox from './lightbox.js';
import * as VideoModal from './video-modal.js?v=20261112-2';
import * as Portfolio from './portfolio.js?v=20261112-2';
import * as Featured from './featured.js?v=20261112-2';
import * as AboutPhoto from './about-photo.js';
import * as Phone3D from './phone3d.js?v=20261101-2';
import * as Consent from './consent.js';
import * as Eventos from './eventos.js?v=20261112-2';

document.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  Animations.init();
  Forms.init();
  Lightbox.init();
  VideoModal.init();
  Portfolio.init();
  Featured.init();
  AboutPhoto.init();
  Phone3D.init();
  Consent.init();
  Eventos.init();
});
