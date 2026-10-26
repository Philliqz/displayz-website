import * as Nav from './nav.js';
import * as Animations from './animations.js';
import * as Forms from './forms.js';
import * as Lightbox from './lightbox.js';
import * as VideoModal from './video-modal.js';
import * as Portfolio from './portfolio.js';
import * as Featured from './featured.js';
import * as Router from './router.js';
import * as Phone3D from './phone3d.js';

document.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  Animations.init();
  Forms.init();
  Lightbox.init();
  VideoModal.init();
  Portfolio.init();
  Featured.init();
  Router.init();
  Phone3D.init();
});
