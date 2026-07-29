/* Displayz Studio — site scripts (no build step, no backend required) */
(function () {
  'use strict';

  /* ============ Config ============
     Leave FORM_ENDPOINT empty to submit via mailto (default, works with zero backend).
     Set it to a Google Apps Script / REST / Firebase / Supabase URL to switch to fetch()
     without touching any HTML. */
  var CONFIG = {
    FORM_ENDPOINT: '',
    CONTACT_EMAIL: 'ismaelkentish@gmail.com',
    WHATSAPP_URL: 'https://wa.me/50764498833'
  };

  /* ============ Navigation ============ */
  var Nav = {
    init: function () {
      var path = (window.location.pathname.split('/').pop() || 'index.html');
      document.querySelectorAll('.nav-link').forEach(function (link) {
        var href = link.getAttribute('href');
        if (href === path) link.classList.add('is-active');
      });
      this.initMobileToggle();
    },
    initMobileToggle: function () {
      var siteNav = document.querySelector('.site-nav');
      var toggle = document.querySelector('.nav-toggle');
      if (!siteNav || !toggle) return;
      function close() {
        siteNav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
      toggle.addEventListener('click', function () {
        var open = siteNav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      siteNav.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', close);
      });
      document.addEventListener('click', function (e) {
        if (!siteNav.contains(e.target)) close();
      });
    }
  };

  /* ============ Scroll-reveal animations ============ */
  var Animations = {
    observer: null,
    init: function () {
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              Animations.observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 });
      }
      this.observe(document.querySelectorAll('.reveal'));
    },
    observe: function (items) {
      if (!items || !items.length) return;
      if (!this.observer) {
        items.forEach(function (el) { el.classList.add('is-visible'); });
        return;
      }
      var observer = this.observer;
      items.forEach(function (el) { observer.observe(el); });
    }
  };

  /* ============ Hero "Hablemos de tu marca" dropdown ============ */
  var HeroMenu = {
    init: function () {
      var menu = document.getElementById('hero-contact-menu');
      if (!menu) return;
      var trigger = menu.querySelector('.hero-contact-trigger');
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        menu.classList.toggle('is-open');
      });
      document.addEventListener('click', function (e) {
        if (!menu.contains(e.target)) menu.classList.remove('is-open');
      });
    }
  };

  /* ============ Modal (floating contact form) ============ */
  var Modal = {
    init: function () {
      var overlay = document.getElementById('contact-modal');
      if (!overlay) return;
      var openers = document.querySelectorAll('[data-open-modal]');
      var closers = overlay.querySelectorAll('[data-close-modal]');
      var panel = overlay.querySelector('.modal-panel');
      var form = overlay.querySelector('.modal-form');
      var success = overlay.querySelector('.modal-success');

      function open(e) {
        if (e) e.preventDefault();
        overlay.classList.add('is-open');
        form.classList.remove('is-hidden');
        success.classList.remove('is-visible');
        var heroMenu = document.getElementById('hero-contact-menu');
        if (heroMenu) heroMenu.classList.remove('is-open');
      }
      function close(e) {
        if (e) e.preventDefault();
        overlay.classList.remove('is-open');
      }

      openers.forEach(function (btn) { btn.addEventListener('click', open); });
      closers.forEach(function (btn) { btn.addEventListener('click', close); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      panel.addEventListener('click', function (e) { e.stopPropagation(); });

      form.addEventListener('submit', function (e) {
        Forms.handleSubmit(e, form, function () {
          form.classList.add('is-hidden');
          success.classList.add('is-visible');
        });
      });

      var toPortfolio = overlay.querySelector('[data-goto-portfolio]');
      if (toPortfolio) {
        toPortfolio.addEventListener('click', function (e) {
          e.preventDefault();
          close();
          setTimeout(function () {
            if (document.getElementById('portafolio')) {
              document.getElementById('portafolio').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              window.location.href = 'index.html#portafolio';
            }
          }, 50);
        });
      }
    }
  };

  /* ============ Contact / lead forms ============ */
  var Forms = {
    init: function () {
      document.querySelectorAll('form[data-contact-form]').forEach(function (form) {
        form.addEventListener('submit', function (e) {
          Forms.handleSubmit(e, form, function () {
            form.reset();
          });
        });
      });
    },
    handleSubmit: function (e, form, onSuccess) {
      e.preventDefault();
      var data = new FormData(form);

      if (CONFIG.FORM_ENDPOINT) {
        var payload = {};
        data.forEach(function (v, k) { payload[k] = v; });
        fetch(CONFIG.FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function () { onSuccess(); })
          .catch(function () { Forms.fallbackMailto(data); onSuccess(); });
        return;
      }

      Forms.fallbackMailto(data);
      onSuccess();
    },
    fallbackMailto: function (formData) {
      var lines = [];
      formData.forEach(function (value, key) { if (value) lines.push(key + ': ' + value); });
      var subject = encodeURIComponent('Nuevo contacto desde Displayz.Studio');
      var body = encodeURIComponent(lines.join('\n'));
      window.location.href = 'mailto:' + CONFIG.CONTACT_EMAIL + '?subject=' + subject + '&body=' + body;
    }
  };

  /* ============ Lightbox (gallery image viewer) ============ */
  var Lightbox = {
    images: [],
    index: 0,
    init: function () {
      var overlay = document.getElementById('lightbox');
      if (!overlay) return;
      this.overlay = overlay;
      this.imgEl = overlay.querySelector('.lightbox-img');
      var self = this;

      document.querySelectorAll('[data-lightbox-group]').forEach(function (group) {
        var imgs = Array.prototype.slice.call(group.querySelectorAll('img:not([data-clone])'));
        imgs.forEach(function (img, i) {
          img.addEventListener('click', function () {
            self.images = imgs.map(function (im) { return { src: im.src, alt: im.alt }; });
            self.open(i);
          });
        });
      });

      overlay.querySelectorAll('[data-close-lightbox]').forEach(function (btn) {
        btn.addEventListener('click', function () { self.close(); });
      });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) self.close(); });

      var prev = overlay.querySelector('.lightbox-prev');
      var next = overlay.querySelector('.lightbox-next');
      if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); self.step(-1); });
      if (next) next.addEventListener('click', function (e) { e.stopPropagation(); self.step(1); });

      document.addEventListener('keydown', function (e) {
        if (!overlay.classList.contains('is-open')) return;
        if (e.key === 'Escape') self.close();
        if (e.key === 'ArrowLeft') self.step(-1);
        if (e.key === 'ArrowRight') self.step(1);
      });
    },
    open: function (i) {
      this.index = i;
      this.render();
      this.overlay.classList.add('is-open');
    },
    close: function () { this.overlay.classList.remove('is-open'); },
    step: function (delta) {
      this.index = (this.index + delta + this.images.length) % this.images.length;
      this.render();
    },
    render: function () {
      var cur = this.images[this.index];
      if (!cur) return;
      this.imgEl.src = cur.src;
      this.imgEl.alt = cur.alt;
    }
  };

  /* ============ Video player modal (no files stored in repo — embeds only) ============ */
  var VideoModal = {
    init: function () {
      var overlay = document.getElementById('video-modal');
      if (!overlay) return;
      var frame = overlay.querySelector('iframe');
      var self = this;
      document.querySelectorAll('[data-video-embed]').forEach(function (trigger) {
        trigger.addEventListener('click', function () {
          frame.src = trigger.getAttribute('data-video-embed');
          overlay.classList.add('is-open');
        });
      });
      overlay.querySelectorAll('[data-close-video]').forEach(function (btn) {
        btn.addEventListener('click', function () { self.close(overlay, frame); });
      });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) self.close(overlay, frame); });
    },
    close: function (overlay, frame) {
      overlay.classList.remove('is-open');
      frame.src = '';
    }
  };

  /* ============ Portfolio loader (reads /portfolio/manifest.json + each company's data.json) ============
     To add a new client: create a folder in /portfolio, add a data.json (see README), add its
     slug to /portfolio/manifest.json. No HTML/CSS/JS changes needed. */
  var Portfolio = {
    init: function () {
      var section = document.querySelector('[data-portfolio-section]');
      if (!section) return;
      var sectionKey = section.getAttribute('data-portfolio-section'); // "video" | "fotografia" | "diseno"
      var container = section.querySelector('[data-portfolio-companies]');
      var emptyState = section.querySelector('[data-portfolio-empty]');

      fetch('portfolio/manifest.json')
        .then(function (res) { return res.json(); })
        .then(function (manifest) {
          var slugs = manifest.companies || [];
          return Promise.all(slugs.map(function (slug) {
            return fetch('portfolio/' + slug + '/data.json')
              .then(function (res) { return res.json(); })
              .catch(function () { return null; });
          }));
        })
        .then(function (companies) {
          var visible = companies.filter(function (c) { return c && c.media && c.media[sectionKey] && c.media[sectionKey].length; });
          for (var vi = visible.length - 1; vi > 0; vi--) {
            var vj = Math.floor(Math.random() * (vi + 1));
            var vtmp = visible[vi]; visible[vi] = visible[vj]; visible[vj] = vtmp;
          }
          if (!visible.length) {
            if (emptyState) emptyState.style.display = 'block';
            return;
          }
          if (emptyState) emptyState.style.display = 'none';
          visible.forEach(function (company) {
            container.appendChild(Portfolio.renderCompany(company, sectionKey));
          });
          Animations.observe(container.querySelectorAll('.reveal'));
          Lightbox.init();
          VideoModal.init();
        })
        .catch(function () {
          if (emptyState) emptyState.style.display = 'block';
        });
    },
    renderCompany: function (company, sectionKey) {
      var wrap = document.createElement('div');
      wrap.className = 'brand-section reveal';

      var header = document.createElement('div');
      header.className = 'brand-header';

      var block = document.createElement('div');
      block.className = 'brand-block';
      var logo = document.createElement('img');
      logo.className = 'brand-logo';
      logo.src = 'portfolio/' + company.slug + '/' + (company.logo || company.thumbnail || '');
      logo.alt = company.name + ' — logo';
      var info = document.createElement('div');
      info.className = 'brand-info';
      var name = document.createElement('h2');
      name.className = 'brand-name';
      name.textContent = company.name;
      info.appendChild(name);
      if (company.description) {
        var desc = document.createElement('p');
        desc.className = 'brand-desc';
        desc.textContent = company.description;
        info.appendChild(desc);
      }
      block.appendChild(logo);
      block.appendChild(info);
      header.appendChild(block);

      var actions = document.createElement('div');
      actions.className = 'brand-actions';
      if (company.instagram) {
        var ig = document.createElement('a');
        ig.className = 'brand-ig-btn';
        ig.href = company.instagram;
        ig.target = '_blank';
        ig.rel = 'noopener';
        ig.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="2"></rect><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="2"></circle><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"></circle></svg> Instagram';
        actions.appendChild(ig);
      }
      actions.appendChild(Portfolio.makeLikeBtn(company.slug));
      header.appendChild(actions);
      wrap.appendChild(header);

      var items = (company.media && company.media[sectionKey]) || [];
      wrap.appendChild(Portfolio.renderGallery(items, sectionKey, company));
      return wrap;
    },
    makeLikeBtn: function (slug) {
      var likedKey = 'displayz-like-' + slug;
      var countKey = 'displayz-likes-' + slug;
      var liked = localStorage.getItem(likedKey) === '1';
      var count = parseInt(localStorage.getItem(countKey), 10);
      if (isNaN(count)) count = liked ? 1 : 0;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'brand-like-btn' + (liked ? ' is-liked' : '');
      btn.setAttribute('aria-label', 'Me gusta');
      function render() {
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20s-7-4.35-9.5-8.5C.7 8 2.3 4.5 6 4.5c2 0 3.3 1 4.5 2.5C11.7 5.5 13 4.5 15 4.5c3.7 0 5.3 3.5 3.5 7C18 15.65 12 20 12 20z" stroke="currentColor" stroke-width="2" fill="' + (liked ? 'currentColor' : 'none') + '"/></svg><span>' + count + '</span>';
      }
      render();
      btn.addEventListener('click', function () {
        liked = true;
        count += 1;
        btn.classList.add('is-liked');
        localStorage.setItem(likedKey, '1');
        localStorage.setItem(countKey, String(count));
        render();
      });
      return btn;
    },
    renderGallery: function (items, sectionKey, company) {
      var isVideo = sectionKey === 'video';
      items = items.slice();
      for (var i = items.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = items[i]; items[i] = items[j]; items[j] = tmp;
      }
      function makeImg(item, isClone) {
        var img = document.createElement('img');
        img.className = 'gallery-img';
        img.draggable = false;
        if (isClone) img.setAttribute('data-clone', '');
        if (isVideo) {
          img.src = 'portfolio/' + company.slug + '/' + item.thumbnail;
          img.alt = item.title || company.name + ' — video';
          img.setAttribute('data-video-embed', item.embed);
        } else {
          img.src = 'portfolio/' + company.slug + '/' + item.file;
          img.alt = item.alt || company.name;
        }
        return img;
      }
      var outer = document.createElement('div');
      outer.className = 'gallery-carousel';
      if (isVideo) outer.classList.add('gallery-video');
      if (!isVideo) outer.setAttribute('data-lightbox-group', '');
      var track = document.createElement('div');
      track.className = 'gallery-track';
      items.forEach(function (item) { track.appendChild(makeImg(item, false)); });
      var prevBtn = document.createElement('button');
      prevBtn.className = 'gallery-nav-btn prev'; prevBtn.type = 'button'; prevBtn.setAttribute('aria-label', 'Anterior');
      prevBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var nextBtn = document.createElement('button');
      nextBtn.className = 'gallery-nav-btn next'; nextBtn.type = 'button'; nextBtn.setAttribute('aria-label', 'Siguiente');
      nextBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      outer.appendChild(track);
      outer.appendChild(prevBtn);
      outer.appendChild(nextBtn);
      if (items.length > 3) {
        Portfolio.setupCarousel(track, prevBtn, nextBtn);
      } else {
        outer.classList.add('is-static');
        if (isVideo && items.length === 1) outer.classList.add('is-single');
      }
      return outer;
    },
    setupCarousel: function (track, prevBtn, nextBtn) {
      var startX = 0, startScroll = 0, moved = false;
      function step() { return track.querySelector('.gallery-img').getBoundingClientRect().width + 16; }
      function maxScroll() { return track.scrollWidth - track.clientWidth; }
      nextBtn.addEventListener('click', function () {
        if (track.scrollLeft >= maxScroll() - 4) track.scrollTo({ left: 0, behavior: 'smooth' });
        else track.scrollBy({ left: step(), behavior: 'smooth' });
      });
      prevBtn.addEventListener('click', function () {
        if (track.scrollLeft <= 4) track.scrollTo({ left: maxScroll(), behavior: 'smooth' });
        else track.scrollBy({ left: -step(), behavior: 'smooth' });
      });
      track.addEventListener('dragstart', function (e) { e.preventDefault(); });
      function onMove(e) {
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        track.scrollLeft = startScroll - dx;
      }
      function endDrag() {
        track.classList.remove('is-dragging');
        track.style.scrollBehavior = 'smooth';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
      }
      track.addEventListener('pointerdown', function (e) {
        moved = false; startX = e.clientX; startScroll = track.scrollLeft;
        track.classList.add('is-dragging');
        track.style.scrollBehavior = 'auto';
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
        e.preventDefault();
      });
      track.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
      }, true);
    }
  };

  /* ============ Home portfolio-card thumbnail rotator ============
     Reads portfolio/manifest.json + each company's data.json and drops up to 3 rotating
     background thumbnails into each .portfolio-item-thumbs slot. Stays empty automatically
     when a section (e.g. video) has no content yet — picks it up the moment content is added. */
  var PortfolioPreview = {
    init: function () {
      var slots = document.querySelectorAll('[data-portfolio-thumbs]');
      if (!slots.length) return;
      fetch('portfolio/manifest.json')
        .then(function (res) { return res.json(); })
        .then(function (manifest) {
          var slugs = manifest.companies || [];
          return Promise.all(slugs.map(function (slug) {
            return fetch('portfolio/' + slug + '/data.json')
              .then(function (res) { return res.json(); })
              .catch(function () { return null; });
          }));
        })
        .then(function (companies) {
          companies = companies.filter(Boolean);
          slots.forEach(function (slot) {
            var key = slot.getAttribute('data-portfolio-thumbs');
            var images = [];
            companies.forEach(function (c) {
              var items = c.media && c.media[key];
              if (!items || !items.length) return;
              var item = items[0];
              var file = key === 'video' ? item.thumbnail : item.file;
              if (file) images.push('portfolio/' + c.slug + '/' + file);
            });
            images.slice(0, 3).forEach(function (src, i) {
              var div = document.createElement('div');
              div.className = 'portfolio-item-thumb';
              div.style.backgroundImage = 'url(' + src + ')';
              div.style.animationDelay = (-i * 4) + 's';
              slot.appendChild(div);
            });
          });
        })
        .catch(function () {});
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    Nav.init();
    Animations.init();
    HeroMenu.init();
    Modal.init();
    Forms.init();
    Lightbox.init();
    VideoModal.init();
    Portfolio.init();
    PortfolioPreview.init();
  });
})();
