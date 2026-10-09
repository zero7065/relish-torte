// Relish Torte — static site shared logic
(function () {
  'use strict';

  // ---------- helpers ----------
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function naira(v) {
    if (v === null || v === undefined) return 'Custom quote';
    return '₦' + Number(v).toLocaleString('en-NG');
  }

  function waLink(msg) {
    return 'https://wa.me/' + RT_PHONE_INTL + '?text=' + encodeURIComponent(msg);
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function minOrderDate() {
    var d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }

  function prettyDate(v) {
    if (!v) return '—';
    var d = new Date(String(v).length <= 10 ? v + 'T00:00:00' : v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- storage (best-effort, works on file://) ----------
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  var MENU_KEY = 'rt_menu_overrides';
  var ORDERS_KEY = 'rt_orders';
  var LOCAL_REVIEWS_KEY = 'rt_reviews';
  var PENDING_ORDERS_KEY = 'rt_orders';

  function getOverrides() {
    return load(MENU_KEY, {});
  }

  function getMenu() {
    var ov = getOverrides();
    return RT_MENU.map(function (c) {
      var o = ov[c.slug];
      if (!o) return Object.assign({}, c);
      var m = Object.assign({}, c);
      if (o.price_from !== undefined) m.price_from = o.price_from;
      if (o.available !== undefined) m.available = o.available;
      if (o.featured !== undefined) m.featured = o.featured;
      return m;
    });
  }

  function findCake(slug) {
    var all = getMenu();
    for (var i = 0; i < all.length; i++) if (all[i].slug === slug) return all[i];
    return null;
  }

  function saveOverride(slug, patch) {
    var ov = getOverrides();
    ov[slug] = Object.assign({}, ov[slug] || {}, patch);
    save(MENU_KEY, ov);
  }

  function getOrders() {
    return load(ORDERS_KEY, []);
  }

  function saveOrder(order) {
    var orders = getOrders();
    orders.unshift(order);
    return save(ORDERS_KEY, orders);
  }

  function getLocalReviews() {
    return load(LOCAL_REVIEWS_KEY, []);
  }

  function saveLocalReview(review) {
    var list = getLocalReviews();
    review.id = Date.now();
    review.createdAt = new Date().toISOString();
    review.approved = false;
    list.unshift(review);
    save(LOCAL_REVIEWS_KEY, list);
    return review;
  }

  function allApprovedReviews() {
    var seeds = RT_REVIEWS.slice();
    var local = getLocalReviews()
      .filter(function (r) {
        return r.approved;
      })
      .map(function (r) {
        return Object.assign({}, r, { location: r.location || '' });
      });
    return local.concat(seeds);
  }

  // ---------- header / nav ----------
  var WA_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.73 2.64 4.2 3.7.59.26 1.05.41 1.4.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29Z"/></svg>';

  function initHeader() {
    var header = $('#siteHeader');
    var toggle = $('#navToggle');
    var links = $('#navLinks');

    if (header) {
      var onScroll = function () {
        header.classList.toggle('scrolled', window.scrollY > 40);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.textContent = open ? '✕' : '☰';
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
      $$('a', links).forEach(function (a) {
        a.addEventListener('click', function () {
          links.classList.remove('open');
          toggle.textContent = '☰';
        });
      });
    }

    // active link
    var page = document.body.getAttribute('data-page') || '';
    $$('#navLinks a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if ((page === 'home' && href === 'index.html') || (page && href === page + '.html')) {
        a.classList.add('active');
      }
    });

    // default whatsapp links
    $$('[data-wa-default]').forEach(function (a) {
      a.href = waLink('Hello Relish Torte! I would like to place an order.');
    });
    var float = $('.wa-float');
    if (float) float.href = waLink('Hello Relish Torte! I would like to place an order.');

    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());

    // newsletter (stored locally until backend is connected)
    var news = document.querySelector('.newsletter');
    if (news) {
      news.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = news.querySelector('input');
        var note = document.querySelector('.news-note');
        var v = input && input.value.trim();
        if (!v || v.indexOf('@') === -1) {
          if (note) note.textContent = 'Please enter a valid email address.';
          return;
        }
        var list = load('rt_newsletter', []);
        if (list.indexOf(v) === -1) list.push(v);
        save('rt_newsletter', list);
        input.value = '';
        if (note) note.textContent = "You're on the list — sweet things coming your way.";
      });
    }
  }

  // ---------- rendering ----------
  function starsHtml(rating) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += i <= rating ? '★' : '<span class="off">★</span>';
    }
    return out;
  }

  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/);
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }

  function cakeCardHtml(c, extraClass) {
    var priceHtml =
      c.price_from === null
        ? '<span class="price"><small>price</small>Custom quote</span>'
        : '<span class="price"><small>from</small>' + naira(c.price_from) + '</span>';
    var tag = c.featured ? 'Bestseller' : RT_CATEGORIES[c.category];
    return (
      '<a class="cake-card' + (extraClass ? ' ' + extraClass : '') + (c.available ? '' : ' off') +
      '" href="cake.html?item=' + encodeURIComponent(c.slug) + '" data-item="' + esc(c.slug) + '">' +
      '<div class="cake-card-img">' +
      '<img src="' + esc(c.image) + '" alt="' + esc(c.name) + ' — Relish Torte Jos" width="600" height="600" loading="lazy">' +
      '<span class="cake-card-tag">' + esc(tag) + '</span>' +
      '</div>' +
      '<div class="cake-card-body">' +
      '<h3>' + esc(c.name) + '</h3>' +
      '<p class="desc">' + esc(c.description) + '</p>' +
      '<div class="cake-card-foot">' + priceHtml +
      '<span class="pill-order">Order</span>' +
      '</div></div></a>'
    );
  }

  function reviewCardHtml(r) {
    return (
      '<figure class="review-card card">' +
      '<div class="review-avatar" aria-hidden="true">' + esc(initials(r.name)) + '</div>' +
      '<figcaption>' +
      '<p class="review-name">' + esc(r.name) + '</p>' +
      '<p class="review-role">' + esc(r.location || 'Jos') + '</p>' +
      '</figcaption>' +
      '<div class="stars" aria-label="' + r.rating + ' out of 5 stars">' + starsHtml(r.rating) + '</div>' +
      '<blockquote class="review-quote">' + esc(r.text) + '</blockquote>' +
      '</figure>'
    );
  }

  function renderReviewsInto(el, list) {
    if (!el) return;
    el.innerHTML = list.length
      ? list.map(reviewCardHtml).join('')
      : '<p class="muted">No reviews to show yet.</p>';
  }

  // ---------- order text builder ----------
  function buildOrderMessage(o) {
    var lines = ['Hello Relish Torte! I would like to place an order:', '• Name: ' + o.name, '• Phone: ' + o.phone];
    if (o.email) lines.push('• Email: ' + o.email);
    lines.push('• Item: ' + (o.item || o.type));
    if (o.size) lines.push('• Size: ' + o.size);
    if (o.flavor) lines.push('• Flavour: ' + o.flavor);
    lines.push('• Quantity: ' + o.qty);
    if (o.inscription) lines.push('• Inscription: "' + o.inscription + '"');
    lines.push('• Needed by: ' + o.neededDate);
    lines.push('• ' + o.delivery + (o.delivery === 'Delivery' && o.area ? ' — ' + o.area + ', ' + o.address : ''));
    if (o.notes) lines.push('• Notes: ' + o.notes);
    if (o.ref) lines.push('Order ref: ' + o.ref);
    return lines.join('\n');
  }

  function makeRef() {
    return 'RT-' + String(Math.floor(1000 + Math.random() * 9000));
  }

  // ---------- shared error helper ----------
  function setFieldError(input, msg) {
    var field = input.closest('.field') || input.parentElement;
    if (!field) return;
    var old = field.querySelector('.field-error');
    if (old) old.remove();
    if (msg) {
      var p = document.createElement('p');
      p.className = 'field-error';
      p.textContent = msg;
      field.appendChild(p);
    }
  }

  // ---------- expose ----------
  window.RT = {
    $: $,
    $$: $$,
    naira: naira,
    waLink: waLink,
    getParam: getParam,
    minOrderDate: minOrderDate,
    prettyDate: prettyDate,
    esc: esc,
    load: load,
    save: save,
    getMenu: getMenu,
    findCake: findCake,
    saveOverride: saveOverride,
    getOrders: getOrders,
    saveOrder: saveOrder,
    getLocalReviews: getLocalReviews,
    saveLocalReview: saveLocalReview,
    allApprovedReviews: allApprovedReviews,
    cakeCardHtml: cakeCardHtml,
    reviewCardHtml: reviewCardHtml,
    renderReviewsInto: renderReviewsInto,
    initials: initials,
    buildOrderMessage: buildOrderMessage,
    makeRef: makeRef,
    setFieldError: setFieldError,
    starsHtml: starsHtml,
    WA_SVG: WA_SVG,
    initHeader: initHeader,
  };

  document.addEventListener('DOMContentLoaded', initHeader);
})();
