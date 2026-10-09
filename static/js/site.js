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

  // ---------- content blocks (admin edits live in rt_content) ----------
  var CONTENT_KEY = 'rt_content';

  function defaultFor(key) {
    /* eslint-disable no-undef */
    switch (key) {
      case 'RT_ABOUT': return typeof RT_ABOUT !== 'undefined' ? RT_ABOUT : null;
      case 'RT_WHY': return typeof RT_WHY !== 'undefined' ? RT_WHY : null;
      case 'RT_HOW': return typeof RT_HOW !== 'undefined' ? RT_HOW : null;
      case 'RT_GALLERY': return typeof RT_GALLERY !== 'undefined' ? RT_GALLERY : null;
      case 'RT_SPACE': return typeof RT_SPACE !== 'undefined' ? RT_SPACE : null;
      case 'RT_HERO_SLIDES': return typeof RT_HERO_SLIDES !== 'undefined' ? RT_HERO_SLIDES : null;
      default: return null;
    }
    /* eslint-enable no-undef */
  }

  function getContent(key) {
    var store = load(CONTENT_KEY, {});
    if (store[key] !== undefined) return store[key];
    return defaultFor(key);
  }

  function getAllContent() {
    var store = load(CONTENT_KEY, {});
    return {
      RT_ABOUT: store.RT_ABOUT !== undefined ? store.RT_ABOUT : defaultFor('RT_ABOUT'),
      RT_WHY: store.RT_WHY !== undefined ? store.RT_WHY : defaultFor('RT_WHY'),
      RT_HOW: store.RT_HOW !== undefined ? store.RT_HOW : defaultFor('RT_HOW'),
      RT_GALLERY: store.RT_GALLERY !== undefined ? store.RT_GALLERY : defaultFor('RT_GALLERY'),
      RT_SPACE: store.RT_SPACE !== undefined ? store.RT_SPACE : defaultFor('RT_SPACE'),
      RT_HERO_SLIDES: store.RT_HERO_SLIDES !== undefined ? store.RT_HERO_SLIDES : defaultFor('RT_HERO_SLIDES'),
    };
  }

  function saveContent(key, value) {
    var store = load(CONTENT_KEY, {});
    store[key] = value;
    return save(CONTENT_KEY, store);
  }

  // ---------- image resolution: admin override → photo map → svg default ----------
  var IMG_KEY = 'rt_image_overrides';

  function imgOverrides() {
    return load(IMG_KEY, {});
  }

  function imgFor(item) {
    if (!item) return '';
    var slug = typeof item === 'string' ? item : item.slug;
    var ov = imgOverrides();
    if (ov[slug]) return ov[slug];
    /* eslint-disable no-undef */
    if (typeof RT_PHOTO_MAP !== 'undefined' && RT_PHOTO_MAP[slug]) return RT_PHOTO_MAP[slug];
    /* eslint-enable no-undef */
    return typeof item === 'string' ? '' : item.image;
  }

  function saveImgOverride(slug, path) {
    var ov = imgOverrides();
    if (path) ov[slug] = path;
    else delete ov[slug];
    return save(IMG_KEY, ov);
  }

  // ---------- likes ----------
  var LIKES_KEY = 'rt_likes';

  function likeState() {
    var s = load(LIKES_KEY, { mine: {}, counts: {} });
    if (!s.mine) s.mine = {};
    if (!s.counts) s.counts = {};
    return s;
  }

  function likeCount(slug) {
    return likeState().counts[slug] || 0;
  }

  function hasLiked(slug) {
    return !!likeState().mine[slug];
  }

  function toggleLike(slug) {
    var s = likeState();
    if (s.mine[slug]) {
      delete s.mine[slug];
      s.counts[slug] = Math.max(0, (s.counts[slug] || 0) - 1);
    } else {
      s.mine[slug] = true;
      s.counts[slug] = (s.counts[slug] || 0) + 1;
    }
    save(LIKES_KEY, s);
    return { liked: !!s.mine[slug], count: s.counts[slug] || 0 };
  }

  // ---------- product ratings (admin approval queue) ----------
  var RATINGS_KEY = 'rt_ratings';

  function ratingState() {
    var s = load(RATINGS_KEY, { approved: {}, pending: [], mine: {} });
    if (!s.approved) s.approved = {};
    if (!s.pending) s.pending = [];
    if (!s.mine) s.mine = {};
    return s;
  }

  function ratingSummary(slug) {
    var a = ratingState().approved[slug];
    if (!a || !a.n) return { sum: 0, n: 0, avg: 0 };
    return { sum: a.sum, n: a.n, avg: Math.round((a.sum / a.n) * 10) / 10 };
  }

  function submitRating(slug, stars) {
    var s = ratingState();
    var prev = s.mine[slug];
    if (prev) {
      s.pending = s.pending.filter(function (p) { return p.slug !== slug; });
    }
    s.mine[slug] = stars;
    s.pending.unshift({ id: Date.now(), slug: slug, stars: stars, ts: new Date().toISOString() });
    save(RATINGS_KEY, s);
    return true;
  }

  // ---------- post-order feedback survey ----------
  var FEEDBACK_KEY = 'rt_feedback';

  function getFeedback() {
    return load(FEEDBACK_KEY, []);
  }

  function saveFeedback(entry) {
    var list = getFeedback();
    entry.id = Date.now();
    entry.ts = new Date().toISOString();
    list.unshift(entry);
    save(FEEDBACK_KEY, list);
    return entry;
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
    var src = imgFor(c);
    var liked = hasLiked(c.slug);
    var lc = likeCount(c.slug);
    var rs = ratingSummary(c.slug);
    var likeBtn =
      '<button class="like-btn' + (liked ? ' liked' : '') + '" type="button" data-like="' + esc(c.slug) +
      '" aria-label="Like ' + esc(c.name) + '" aria-pressed="' + (liked ? 'true' : 'false') + '">' +
      '<svg viewBox="0 0 24 24" fill="' + (liked ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>' +
      (lc ? '<span data-like-count>' + lc + '</span>' : '') +
      '</button>';
    var rateRow = rs.n
      ? '<span class="rating-summary" title="' + rs.avg + ' out of 5 from ' + rs.n + ' rating' + (rs.n === 1 ? '' : 's') + '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z"/></svg>' +
        '<span class="avg">' + rs.avg + '</span><span>(' + rs.n + ')</span></span>'
      : '';
    return (
      '<a class="cake-card' + (extraClass ? ' ' + extraClass : '') + (c.available ? '' : ' off') +
      '" href="cake.html?item=' + encodeURIComponent(c.slug) + '" data-item="' + esc(c.slug) + '">' +
      '<div class="cake-card-img">' +
      '<img src="' + esc(src) + '" onerror="this.onerror=null;this.src=\'' + esc(c.image) + '\'" alt="' + esc(c.name) + ' — Relish Torte Jos" width="600" height="600" loading="lazy">' +
      likeBtn +
      '<span class="cake-card-tag">' + esc(tag) + '</span>' +
      '</div>' +
      '<div class="cake-card-body">' +
      '<h3>' + esc(c.name) + '</h3>' +
      '<p class="desc">' + esc(c.description) + '</p>' +
      (rateRow ? '<div class="rate-row">' + rateRow + '</div>' : '') +
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
    getContent: getContent,
    getAllContent: getAllContent,
    saveContent: saveContent,
    imgFor: imgFor,
    imgOverrides: imgOverrides,
    saveImgOverride: saveImgOverride,
    likeCount: likeCount,
    hasLiked: hasLiked,
    toggleLike: toggleLike,
    ratingSummary: ratingSummary,
    submitRating: submitRating,
    ratingState: ratingState,
    getFeedback: getFeedback,
    saveFeedback: saveFeedback,
    WA_SVG: WA_SVG,
    initHeader: initHeader,
  };

  document.addEventListener('DOMContentLoaded', initHeader);
})();
