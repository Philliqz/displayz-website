import * as Nav from './nav.js';
import * as Animations from './animations.js';
import * as HeroMenu from './hero-menu.js';
import * as Modal from './modal.js';
import * as Forms from './forms.js';
import * as Lightbox from './lightbox.js';
import * as VideoModal from './video-modal.js';
import * as Portfolio from './portfolio.js';
import * as PortfolioPreview from './portfolio-preview.js';
import * as Router from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  Animations.init();
  HeroMenu.init();
  Modal.init();
  Forms.init();
  Lightbox.init();
  VideoModal.init();
  Portfolio.init();
  PortfolioPreview.init();
  Router.init();
});
