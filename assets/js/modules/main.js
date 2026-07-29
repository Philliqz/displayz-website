import * as Nav from './nav.js';
import * as Animations from './animations.js';
import * as HeroVideo from './hero-video.js';
import * as Forms from './forms.js';
import * as Lightbox from './lightbox.js';
import * as VideoModal from './video-modal.js';
import * as Portfolio from './portfolio.js';
import * as PortfolioPreview from './portfolio-preview.js';
import * as Router from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  Animations.init();
  HeroVideo.init();
  Forms.init();
  Lightbox.init();
  VideoModal.init();
  Portfolio.init();
  PortfolioPreview.init();
  Router.init();
});
