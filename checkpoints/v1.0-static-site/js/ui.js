// Relish Torte — UI engine: theme, reveals, rails, side-slide panel, lightbox, motion
(function () {
  'use strict';

  var RT = window.RT;
  var $ = RT.$;
  var $$ = RT.$$;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- theme ----------
  function initTheme() {
    var btn = $('#themeToggle');
    var saved = null;
    try { saved = localStorage.getItem('rt_theme'); } catch (e) {}
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
    if (!btn) return;
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('rt_theme', next); } catch (e) {}
    });
  }

  // ---------- reveal on scroll ----------
  function initReveal() {
    var els = $$('.reveal');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    els.forEach(function (el) {
      var d = el.getAttribute('data-d');
      if (d) el.style.setProperty('--d', d);
      io.observe(el);
    });
  }

  // ---------- hero slideshow ----------
  function initHeroSlides() {
    var slides = $$('.hero-media .slide');
    if (slides.length < 2) return;
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove('on');
      i = (i + 1) % slides.length;
      slides[i].classList.add('on');
    }, 6000);
  }

  // ---------- horizontal rails (arrows + dots auto-built) ----------
  function initRails() {
    $$('.rail-wrap').forEach(function (wrap) {
      var rail = $('.rail', wrap);
      if (!rail) return;
      if (!wrap.querySelector('.rail-nav')) {
        var nav = document.createElement('div');
        nav.className = 'rail-nav';
        nav.innerHTML =
          '<button class="rail-arrow" data-dir="-1" aria-label="Previous items">&#8592;</button>' +
          '<div class="dots" data-dots></div>' +
          '<button class="rail-arrow" data-dir="1" aria-label="Next items">&#8594;</button>';
        wrap.appendChild(nav);
      }
      var dotsBox = $('[data-dots]', wrap);
      var prev = $('[data-dir="-1"]', wrap);
      var next = $('[data-dir="1"]', wrap);

      function pageWidth() { return rail.clientWidth * 0.85; }
      function update() {
        var max = rail.scrollWidth - rail.clientWidth - 4;
        if (prev) prev.disabled = rail.scrollLeft <= 2;
        if (next) next.disabled = rail.scrollLeft >= max;
        var pages = Math.max(1, Math.ceil(rail.scrollWidth / rail.clientWidth));
        var active = Math.round(rail.scrollLeft / rail.clientWidth);
        if (dotsBox && dotsBox.childElementCount !== pages) {
          dotsBox.innerHTML = '';
          for (var p = 0; p < pages; p++) {
            var d = document.createElement('button');
            d.className = 'dot';
            d.setAttribute('aria-label', 'Go to slide ' + (p + 1));
            (function (pp) {
              d.addEventListener('click', function () {
                rail.scrollTo({ left: pp * rail.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
              });
            })(p);
            dotsBox.appendChild(d);
          }
        }
        if (dotsBox) {
          Array.prototype.forEach.call(dotsBox.children, function (d, idx) {
            d.classList.toggle('on', idx === Math.min(active, dotsBox.childElementCount - 1));
          });
        }
      }
      if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -pageWidth(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
      if (next) next.addEventListener('click', function () { rail.scrollBy({ left: pageWidth(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
      rail.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  }

  // ---------- side-slide item panel ----------
  var panel, backdrop, panelList = [], panelIndex = 0, lastFocus = null;

  function buildPanel() {
    backdrop = document.createElement('div');
    backdrop.className = 'panel-backdrop';
    backdrop.id = 'panelBackdrop';
    panel = document.createElement('aside');
    panel.className = 'side-panel';
    panel.id = 'sidePanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Item quick view');
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    backdrop.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('on')) closePanel();
      if (!panel.classList.contains('on')) return;
      if (e.key === 'ArrowRight') stepPanel(1);
      if (e.key === 'ArrowLeft') stepPanel(-1);
    });
  }

  function panelBodyHtml(c) {
    var sizeRows = c.sizes
      .map(function (s) {
        return (
          '<div class="leader-row"><span class="lr-label">' + RT.esc(s.label) + '</span>' +
          '<span class="lr-dots"></span>' +
          '<span class="lr-val gold">' + RT.naira(s.price) + '</span></div>'
        );
      })
      .join('');
    var flavorPills = c.flavors
      .map(function (f, i) {
        return '<button class="tab-pill' + (i === 0 ? ' on' : '') + '" data-flavor="' + RT.esc(f) + '">' + RT.esc(f) + '</button>';
      })
      .join('');
    var priceLine =
      c.price_from === null
        ? 'Custom quote'
        : RT.naira(c.price_from);
    return (
      '<div class="panel-media"><img src="' + RT.esc(c.image) + '" alt="' + RT.esc(c.name) + ' — Relish Torte" width="600" height="600"></div>' +
      '<div class="stagger">' +
      '<div><span class="panel-kicker">' + RT.esc(RT_CATEGORIES[c.category]) + (c.featured ? ' · Bestseller' : '') + '</span></div>' +
      '<div><h2 class="panel-title">' + RT.esc(c.name) + '</h2></div>' +
      '<div><p class="panel-desc">' + RT.esc(c.description) + '</p></div>' +
      '<div class="leader-list">' + sizeRows + '</div>' +
      '<div class="tab-pills" data-flavors>' + flavorPills + '</div>' +
      '<div class="leader-list">' +
      '<div class="leader-row"><span class="lr-label">Quantity</span><span class="lr-dots"></span>' +
      '<span class="lr-val"><span class="stepper">' +
      '<button class="qty-btn" data-q="-1" aria-label="Decrease quantity">−</button>' +
      '<span class="qty-val" data-qty>1</span>' +
      '<button class="qty-btn" data-q="1" aria-label="Increase quantity">+</button>' +
      '</span></span></div>' +
      '<div class="leader-row"><span class="lr-label"><strong>Total</strong></span><span class="lr-dots"></span>' +
      '<span class="lr-val gold" data-total style="font-size:1.25rem">' + priceLine + '</span></div>' +
      '</div>' +
      (c.available
        ? '<div class="detail-actions">' +
          '<button class="btn btn-gold btn-block" data-panel-order>Order on WhatsApp</button>' +
          '<a class="btn btn-ghost btn-block" href="cake.html?item=' + encodeURIComponent(c.slug) + '">Full details <span class="btn-arrow">→</span></a>' +
          '</div>'
        : '<div class="alert err">Currently unavailable — chat with us for a custom request.</div>') +
      '</div>'
    );
  }

  function currentSlug() {
    return panelList[panelIndex] ? panelList[panelIndex].slug : null;
  }

  function panelFootHtml() {
    var prevC = panelList[(panelIndex - 1 + panelList.length) % panelList.length];
    var nextC = panelList[(panelIndex + 1) % panelList.length];
    return (
      '<div class="panel-browse">' +
      '<button class="pb-btn" data-step="-1">← ' + RT.esc(prevC ? prevC.name : 'Prev') + '</button>' +
      '<span class="pb-name">' + (panelIndex + 1) + ' / ' + panelList.length + '</span>' +
      '<button class="pb-btn" data-step="1">' + RT.esc(nextC ? nextC.name : 'Next') + ' →</button>' +
      '</div>'
    );
  }

  function renderPanel() {
    var c = panelList[panelIndex];
    if (!c) return;
    panel.innerHTML =
      '<div class="panel-top">' +
      '<span class="panel-kicker">Quick view</span>' +
      '<button class="panel-close" data-close aria-label="Close quick view">✕</button>' +
      '</div>' +
      '<div class="panel-scroll">' + panelBodyHtml(c) + '</div>' +
      '<div class="panel-foot">' + panelFootHtml() + '</div>';

    var state = { qty: 1, sizeIdx: 0, flavor: c.flavors[0] || '' };

    function refreshTotal() {
      var p = c.sizes[state.sizeIdx] ? c.sizes[state.sizeIdx].price : c.price_from;
      var t = panel.querySelector('[data-total]');
      if (!t) return;
      t.textContent = p === null ? 'Custom quote' : RT.naira(p * state.qty);
    }

    var scroll = $('.panel-scroll', panel);
    $$('[data-flavors] .tab-pill', panel).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-flavors] .tab-pill', panel).forEach(function (x) { x.classList.toggle('on', x === b); });
        state.flavor = b.getAttribute('data-flavor');
      });
    });
    $$('[data-q]', panel).forEach(function (b) {
      b.addEventListener('click', function () {
        state.qty = Math.min(100, Math.max(1, state.qty + Number(b.getAttribute('data-q'))));
        var q = panel.querySelector('[data-qty]');
        if (q) q.textContent = state.qty;
        refreshTotal();
      });
    });
    // size leader rows act as pickers
    $$('.panel-scroll .leader-list .leader-row', panel).forEach(function (row, idx) {
      if (idx >= c.sizes.length) return;
      row.style.cursor = 'pointer';
      row.addEventListener('click', function () {
        state.sizeIdx = idx;
        $$('.panel-scroll .leader-list .leader-row', panel).forEach(function (r, ri) {
          if (ri < c.sizes.length) r.style.opacity = ri === idx ? '1' : '0.55';
        });
        refreshTotal();
      });
    });

    var orderBtn = panel.querySelector('[data-panel-order]');
    if (orderBtn) {
      orderBtn.addEventListener('click', function (e) {
        sparkle(e.currentTarget);
        var size = c.sizes[state.sizeIdx] || {};
        var msg =
          'Hello Relish Torte! I would like to order:\n' +
          '• ' + state.qty + '× ' + c.name +
          (size.label ? ' — ' + size.label : '') +
          (state.flavor ? '\n• Flavour: ' + state.flavor : '') +
          '\nPlease confirm availability and delivery.';
        window.open(RT.waLink(msg), '_blank', 'noopener');
      });
    }

    $$('[data-step]', panel).forEach(function (b) {
      b.addEventListener('click', function () { stepPanel(Number(b.getAttribute('data-step'))); });
    });
    var closeBtn = panel.querySelector('[data-close]');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (scroll) scroll.scrollTop = 0;
  }

  function openPanel(slug, list) {
    if (!panel) buildPanel();
    panelList = (list && list.length ? list : RT.getMenu()).filter(function (c) { return c; });
    var idx = 0;
    panelList.forEach(function (c, i) { if (c.slug === slug) idx = i; });
    panelIndex = idx;
    lastFocus = document.activeElement;
    renderPanel();
    backdrop.classList.add('on');
    // force reflow so the entrance animation replays
    void panel.offsetWidth;
    panel.classList.add('on');
    document.body.style.overflow = 'hidden';
    var cb = panel.querySelector('[data-close]');
    if (cb) cb.focus();
  }

  function stepPanel(dir) {
    if (!panelList.length) return;
    panelIndex = (panelIndex + dir + panelList.length) % panelList.length;
    renderPanel();
    panel.classList.remove('on');
    void panel.offsetWidth;
    panel.classList.add('on');
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove('on');
    backdrop.classList.remove('on');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initPanelLinks() {
    document.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('[data-item]') : null;
      if (!card) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      var slug = card.getAttribute('data-item');
      var scope = card.closest('.rail, .bento, .grid, main') || document;
      var slugs = $$('[data-item]', scope).map(function (el) { return el.getAttribute('data-item'); });
      if (!slugs.length) slugs = [slug];
      var menu = RT.getMenu();
      var list = slugs
        .map(function (s) { return menu.filter(function (m) { return m.slug === s; })[0]; })
        .filter(Boolean);
      openPanel(slug, list);
    });
  }

  // ---------- sparkle burst ----------
  function sparkle(el) {
    if (reduceMotion) return;
    var rect = el.getBoundingClientRect();
    for (var i = 0; i < 8; i++) {
      var s = document.createElement('span');
      s.className = 'spark';
      var ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      var dist = 34 + Math.random() * 26;
      s.style.left = rect.left + rect.width / 2 + window.scrollX + 'px';
      s.style.top = rect.top + rect.height / 2 + window.scrollY + 'px';
      s.style.position = 'absolute';
      s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      document.body.appendChild(s);
      (function (node) { setTimeout(function () { node.remove(); }, 750); })(s);
    }
  }

  function initButtonFx() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.btn-gold, .btn-outline, .btn-wa') : null;
      if (b) sparkle(b);
    });

    if (reduceMotion || window.matchMedia('(hover: none)').matches) return;

    // magnetic hover for primary buttons
    $$('.btn-gold, .btn-outline').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * 10;
        var y = ((e.clientY - r.top) / r.height - 0.5) * 6 - 2;
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });

    // card tilt
    $$('.cake-card, .program-card, .cat-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var rx = (((e.clientY - r.top) / r.height) - 0.5) * -5;
        var ry = (((e.clientX - r.left) / r.width) - 0.5) * 5;
        card.style.transform = 'perspective(800px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-6px)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  // ---------- lightbox ----------
  function initLightbox() {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<img alt="Expanded view">';
    document.body.appendChild(lb);
    var img = lb.querySelector('img');
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (lb.classList.contains('on') && (t === lb || t === img)) {
        lb.classList.remove('on');
        document.body.style.overflow = '';
        return;
      }
      var target = t.closest ? t.closest('.g-item, [data-lightbox]') : null;
      if (!target) return;
      var src = target.querySelector('img');
      if (!src) return;
      img.src = src.getAttribute('src');
      img.alt = src.alt || 'Expanded view';
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('on')) {
        lb.classList.remove('on');
        document.body.style.overflow = '';
      }
    });
  }

  // ---------- init ----------
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initReveal();
    initHeroSlides();
    initRails();
    initPanelLinks();
    initButtonFx();
    initLightbox();
  });

  window.RTUI = { openPanel: openPanel, closePanel: closePanel, sparkle: sparkle };
})();
