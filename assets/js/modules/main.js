import * as Nav from './nav.js?v=20261101-2';
import * as Animations from './animations.js';
import * as Forms from './forms.js';
import * as Lightbox from './lightbox.js';
import * as VideoModal from './video-modal.js';
import * as Portfolio from './portfolio.js';
import * as Featured from './featured.js';
import * as AboutPhoto from './about-photo.js';
import * as Phone3D from './phone3d.js?v=20261101-2';
import * as Consent from './consent.js';

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
});
