// Relish Torte — static admin dashboard (browser-local data)
(function () {
  'use strict';
  var RT = window.RT;
  var STATUSES = ['new', 'confirmed', 'baking', 'ready', 'delivered'];
  var STATUS_LABEL = { new: 'New', confirmed: 'Confirmed', baking: 'Baking', ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled' };

  document.addEventListener('DOMContentLoaded', function () {
    var loginWrap = document.getElementById('adminLogin');
    var dash = document.getElementById('adminDash');
    var loginErr = document.getElementById('loginErr');

    // ---------------- auth ----------------
    function authed() {
      try { return sessionStorage.getItem('rt_admin') === '1'; } catch (e) { return false; }
    }
    function showDash() {
      loginWrap.classList.add('hidden');
      dash.classList.remove('hidden');
      renderGreeting();
      renderStats();
      renderChart();
      renderWeek();
      renderTopItems();
      renderAttn();
      renderOrders();
      renderMenu();
      renderReviews();
      renderRatings();
      renderFeedback();
      renderContent();
      renderMedia();
      updateStorageMeter();
      // Pull the full shared picture (orders, pending reviews/ratings from
      // every device) so the dashboard reflects the whole site, not this
      // browser. Falls back to what is cached when offline.
      RT.refreshAdminState().then(redrawDynamic).catch(redrawDynamic);
    }

    function redrawDynamic() {
      if (typeof document === 'undefined' || !document.getElementById) return; // page torn down
      renderStats();
      renderTopItems();
      renderAttn();
      renderOrders();
      renderReviews();
      renderRatings();
      renderFeedback();
      renderContent();
      renderMedia();
      updateStorageMeter();
    }
    function showLogin() {
      dash.classList.add('hidden');
      loginWrap.classList.remove('hidden');
    }

    // ---- login: server verdict when reachable, local copy when offline ----
    function failLogin(msg) {
      loginErr.textContent = msg || 'Wrong email or password. Try again.';
      loginErr.classList.remove('hidden');
    }
    function finishLogin() {
      loginErr.classList.add('hidden');
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPass').value = '';
      showDash();
    }

    document.getElementById('loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var em = document.getElementById('loginEmail').value;
      var pw = document.getElementById('loginPass').value;

      function unlock(token) {
        if (token) RT.setAdminToken(token);
        RT.adminUnlock();
        finishLogin();
      }

      // The local copy answers immediately (no wait, works offline and on
      // file://). The server still gets the final word — it owns the password.
      if (RT.checkAdminCreds(em, pw)) {
        unlock('');
        RT.api('POST', '/admin/login', { email: em, password: pw })
          .then(function (res) { if (res && res.token) RT.setAdminToken(res.token); })
          .catch(function () { /* offline — token arrives next time */ });
        return;
      }

      failLogin();
      RT.api('POST', '/admin/login', { email: em, password: pw })
        .then(function (res) {
          RT.saveAdminCreds(em, pw); // password changed on another device
          unlock(res && res.token);
        })
        .catch(function () { /* refused or offline — error already shown */ });
    });

    document.getElementById('logoutBtn').addEventListener('click', function () {
      RT.adminLock();
      RT.setAdminToken('');
      showLogin();
    });

    // ---------------- tabs ----------------
    var tabBtns = RT.$$('.admin-tabs button[data-tab]');
    tabBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var want = b.getAttribute('data-tab');
        tabBtns.forEach(function (x) { x.classList.toggle('active', x === b); });
        RT.$$('section[id^="tab-"]').forEach(function (s) {
          s.classList.toggle('hidden', s.id !== 'tab-' + want);
        });
        if (want === 'dashboard') showDash();
        if (want === 'orders') renderOrders();
        if (want === 'media') renderMedia();
        if (want === 'reviews') { renderReviews(); renderRatings(); renderFeedback(); }
        if (want === 'settings') updateStorageMeter();
      });
    });

    // ---------------- greeting ----------------
    function renderGreeting() {
      var h = new Date().getHours();
      var part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      document.getElementById('greetText').textContent = part + ' — the kitchen at a glance';
      document.getElementById('greetDate').textContent = new Date().toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    }

    // ---------------- toast + undo ----------------
    var toastTimer = null;
    var undoFn = null;
    function toast(msg, undo) {
      clearTimeout(toastTimer);
      document.getElementById('toastText').textContent = msg;
      undoFn = undo || null;
      document.getElementById('toastUndo').style.display = undo ? '' : 'none';
      document.getElementById('toast').classList.add('on');
      toastTimer = setTimeout(function () { document.getElementById('toast').classList.remove('on'); }, 5000);
    }
    document.getElementById('toastUndo').addEventListener('click', function () {
      if (undoFn) undoFn();
      document.getElementById('toast').classList.remove('on');
    });

    // ---------------- stats ----------------
    function dayKey(d) { return typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10); }

    function renderStats() {
      var orders = RT.getOrders();
      var weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      var prevWeek = new Date(Date.now() - 14 * 864e5).toISOString();
      var newCount = orders.filter(function (o) { return o.status === 'new'; }).length;
      var thisWeek = orders.filter(function (o) { return o.createdAt >= weekAgo; }).length;
      var lastWeek = orders.filter(function (o) { return o.createdAt >= prevWeek && o.createdAt < weekAgo; }).length;
      var pendingRevs = RT.getLocalReviews().filter(function (r) { return !r.approved; }).length;

      document.getElementById('statNew').textContent = newCount;
      document.getElementById('statWeek').textContent = thisWeek;

      var trend = document.getElementById('statWeekTrend');
      if (thisWeek > lastWeek) { trend.className = 's-trend up'; trend.textContent = '+' + (thisWeek - lastWeek) + ' vs last week'; }
      else if (thisWeek < lastWeek) { trend.className = 's-trend down'; trend.textContent = (thisWeek - lastWeek) + ' vs last week'; }
      else { trend.className = 's-trend'; trend.textContent = 'Same as last week'; }

      document.getElementById('statNewTrend').textContent = newCount ? 'Waiting to be confirmed' : 'All caught up';
      document.getElementById('statRevs').textContent = pendingRevs;
      document.getElementById('statRevsTrend').textContent = pendingRevs ? 'Waiting for your approval' : 'Nothing waiting';
    }

    // ---------------- chart (Chart.js, with canvas fallback) ----------------
    function last30Data() {
      var orders = RT.getOrders();
      var labels = [], counts = [], now = new Date();
      for (var i = 29; i >= 0; i--) {
        var d = new Date(now.getTime() - i * 864e5);
        labels.push(d.getDate() + '/' + (d.getMonth() + 1));
        counts.push(0);
      }
      orders.forEach(function (o) {
        if (!o.createdAt) return;
        var key = dayKey(o.createdAt);
        for (var j = 29; j >= 0; j--) {
          var d = new Date(now.getTime() - j * 864e5);
          if (dayKey(d) === key) { counts[29 - j]++; break; }
        }
      });
      return { labels: labels, counts: counts };
    }

    function renderChart() {
      var data = last30Data();
      var canvas = document.getElementById('ordersChart');
      if (window.Chart) {
        if (canvas._chart) canvas._chart.destroy();
        canvas._chart = new Chart(canvas, {
          type: 'line',
          data: {
            labels: data.labels,
            datasets: [{
              data: data.counts,
              borderColor: '#c9a227',
              backgroundColor: 'rgba(201,162,39,0.12)',
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHitRadius: 12,
              borderWidth: 2,
            }],
          },
          options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#9a8776', maxTicksLimit: 8, font: { size: 10 } }, grid: { display: false } },
              y: { beginAtZero: true, ticks: { color: '#9a8776', stepSize: 1, font: { size: 10 } }, grid: { color: 'rgba(201,162,39,0.08)' } },
            },
          },
        });
        return;
      }
      // fallback: simple canvas bars
      var ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) {
        canvas.insertAdjacentHTML('afterend',
          '<p style="color:var(--faint);font-size:14px">30-day chart unavailable in this browser.</p>');
        return;
      }
      var w = canvas.width = canvas.clientWidth * 2;
      var h = canvas.height = canvas.clientHeight * 2;
      var max = Math.max(1, Math.max.apply(null, data.counts));
      var bw = w / data.counts.length;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#c9a227';
      data.counts.forEach(function (v, i) {
        var bh = (v / max) * (h - 24);
        if (v > 0) ctx.fillRect(i * bw + 3, h - bh - 12, bw - 6, bh);
      });
      if (data.counts.every(function (v) { return v === 0; })) {
        ctx.fillStyle = '#9a8776';
        ctx.font = '24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No orders in the last 30 days yet', w / 2, h / 2);
      }
    }

    // ---------------- AI week in review ----------------
    function renderWeek() {
      var el = document.getElementById('aiWeek');
      if (window.RTAI && RTAI.weekInReview) {
        RTAI.weekInReview().then(function (text) { el.textContent = text; }).catch(fallbackWeek);
      } else {
        fallbackWeek();
      }
      function fallbackWeek() {
        var orders = RT.getOrders();
        el.textContent = orders.length
          ? orders.length + ' order(s) on file. Open the pipeline below to work through them.'
          : 'No orders on file yet — the pipeline below fills up as customers submit the order form.';
      }
    }

    // ---------------- top items ----------------
    function renderTopItems() {
      var orders = RT.getOrders();
      var items = {};
      orders.forEach(function (o) {
        var k = o.item || o.type || 'Custom';
        items[k] = (items[k] || 0) + 1;
      });
      var sorted = Object.keys(items).sort(function (a, b) { return items[b] - items[a]; }).slice(0, 5);
      var wrap = document.getElementById('topItems');
      if (!sorted.length) {
        wrap.innerHTML = '<p style="color:var(--faint);font-size:14px">Once orders come in, your best-sellers show up here.</p>';
        return;
      }
      var max = items[sorted[0]];
      wrap.innerHTML = sorted.map(function (name, i) {
        return '<div class="oi-row">' +
          '<span class="oi-rank">' + (i + 1) + '</span>' +
          '<span class="oi-name">' + RT.esc(name) + '</span>' +
          '<span class="oi-bar"><i style="width:' + Math.round((items[name] / max) * 100) + '%"></i></span>' +
          '<span class="oi-count">' + items[name] + '×</span>' +
          '</div>';
      }).join('');
    }

    // ---------------- orders pipeline ----------------
    // ---------------- needs-your-attention list ----------------
    function renderAttn() {
      var box = document.getElementById('attnList');
      if (!box) return;
      var orders = RT.getOrders();
      var counts = [
        { n: orders.filter(function (o) { return (o.status || 'new') === 'new'; }).length, one: 'new order', tab: 'orders' },
        { n: RT.getLocalReviews().filter(function (r) { return !r.approved; }).length, one: 'review', tab: 'reviews' },
        { n: RT.ratingState().pending.length, one: 'rating', tab: 'reviews' },
        { n: (RT.load('rt_outbox', []) || []).length, one: 'change waiting to sync', tab: 'settings', always: true },
      ];
      var rows = counts.filter(function (c) { return c.n > 0; });

      box.innerHTML = rows.length
        ? rows.map(function (c) {
            var label = c.always ? c.one : c.one + (c.n === 1 ? '' : 's') + ' waiting';
            return '<div class="attn-row"><strong>' + c.n + '</strong><span>' + label + '</span>' +
              '<button type="button" class="mini-btn" data-goto="' + c.tab + '" style="margin-left:auto">Open</button></div>';
          }).join('')
        : '<div class="card empty-state"><p>Nothing waiting — everything is published and synced.</p></div>';

      RT.$$('#attnList [data-goto]').forEach(function (b) {
        b.addEventListener('click', function () {
          var btn = document.querySelector('.admin-tabs button[data-tab="' + b.getAttribute('data-goto') + '"]');
          if (btn) btn.click();
        });
      });
    }

    // ---------------- media library ----------------
    function mediaSlots() {
      var out = [];
      function add(group, id, label, where, size, prompt, fallback) {
        out.push({ group: group, id: id, label: label, where: where, size: size, prompt: prompt, fallback: fallback || '' });
      }

      var ov = RT.imgOverrides();
      var content = RT.getAllContent();

      (content.RT_HERO_SLIDES || []).forEach(function (h, i) {
        add('Home page', 'hero-' + (i + 1), 'Hero slide ' + (i + 1),
          'Full-width picture behind the home page headline',
          '1920 × 1080 (16:9) · JPEG or WebP · keep under 400 KB',
          'Wide and calm, with a darker middle so the white headline stays readable. Show the bake or the shop in warm light — no words baked into the photo.',
          h.image);
      });

      ((typeof RT_CASCADE !== 'undefined') && RT_CASCADE || []).forEach(function (c, i) {
        add('Home page', 'cx-' + (i + 1), 'Showcase slide ' + (i + 1),
          'Rotating card in the “Built different, baked better” carousel',
          '880 × 660 (4:3) · JPEG or WebP · keep under 300 KB',
          'Tight crop on one thing you do well — a tray, a box, a finished tier. Landscape works best inside the card.',
          c.image);
      });

      (content.RT_GALLERY || []).forEach(function (g, i) {
        add('Designs gallery', g.id || 'g' + (i + 1), g.title || 'Design ' + (i + 1),
          'Portfolio card on the home page gallery',
          '1000 × 1250 (4:5) · JPEG or WebP · keep under 350 KB',
          'Portrait shot of a finished cake, straight on, plain background. This one sells your custom work — make it the best photo you have.',
          g.image);
      });

      (content.RT_SPACE || []).forEach(function (s, i) {
        add('Our space', s.id || 's' + (i + 1), s.caption || 'Space photo ' + (i + 1),
          'Shop and kitchen photo on the About page',
          '1200 × 900 (4:3) · JPEG or WebP · keep under 350 KB',
          'Show the real room: counter, ovens, seating or the pastry case. Natural light, no filter — visitors are checking the place out before they come.',
          s.image);
      });

      RT.getMenu().forEach(function (c) {
        add('Menu items', c.slug, c.name,
          'Main photo on the menu grid, cake detail page and search',
          '600 × 600 (1:1) · JPEG or WebP · keep under 250 KB',
          'Square, one portion or one whole cake, centred on a plain surface. Consistent framing across the menu makes the grid look professional.',
          c.image);
      });

      ['learn-1', 'learn-2', 'learn-3'].forEach(function (id, i) {
        add('Apprenticeship', id, 'Apprentice photo ' + (i + 1),
          'Training bench pictures on the home page',
          '1000 × 750 (4:3) · JPEG or WebP · keep under 300 KB',
          'Hands, piping bags, trays in progress. Faces are fine but the craft should lead — ask permission before publishing anyone.',
          'images/photos/' + id + '.jpg');
      });

      [
        { id: 'glimpse-1', label: 'Story photo 1 — celebration cake', file: 'images/photos/design-3.jpg' },
        { id: 'glimpse-2', label: 'Story photo 2 — cupcake box', file: 'images/photos/cupcake-12.jpg' },
        { id: 'glimpse-3', label: 'Story photo 3 — meat pies', file: 'images/photos/meat-pie.jpg' },
        { id: 'glimpse-4', label: 'Story photo 4 — fruit cake', file: 'images/photos/cake-fruit.jpg' },
      ].forEach(function (g) {
        add('Our story', g.id, g.label,
          'Four small pictures beside the story on the About page',
          '640 × 440 (3:2) · JPEG or WebP · keep under 250 KB',
          'A short, honest shot of the product next to the paragraph it supports. Keep all four the same brightness so the row reads as one set.',
          g.file);
      });

      out.forEach(function (s) {
        s.current = ov[s.id] || s.fallback;
        s.overridden = !!ov[s.id];
      });
      return out;
    }

    function renderMedia() {
      var box = document.getElementById('mediaGroups');
      if (!box) return;
      var all = mediaSlots();
      var q = ((document.getElementById('mediaFilter') || {}).value || '').trim().toLowerCase();
      var shown = q
        ? all.filter(function (s) {
            return (s.label + ' ' + s.group + ' ' + s.id + ' ' + s.where).toLowerCase().indexOf(q) >= 0;
          })
        : all;

      var countEl = document.getElementById('mediaCount');
      if (countEl) countEl.textContent = shown.length + ' of ' + all.length + ' slots' + (q ? ' matching “' + q + '”' : '');

      var groups = [];
      shown.forEach(function (s) {
        var g = groups.filter(function (x) { return x.name === s.group; })[0];
        if (!g) { g = { name: s.group, items: [] }; groups.push(g); }
        g.items.push(s);
      });

      box.innerHTML = groups.length
        ? groups.map(function (g) {
            return '<div class="media-group"><h3 class="tab-title" style="margin-bottom:12px">' + RT.esc(g.name) +
              ' <span class="hint" style="font-weight:400">— ' + g.items.length + ' slot' + (g.items.length === 1 ? '' : 's') + '</span></h3>' +
              '<div class="media-grid">' + g.items.map(mediaCard).join('') + '</div></div>';
          }).join('')
        : '<div class="card empty-state"><p>No image slot matches that search.</p></div>';

      wireMedia();
    }

    function mediaCard(s) {
      return '<div class="media-slot' + (s.overridden ? ' changed' : '') + '" data-ms="' + RT.esc(s.id) + '">' +
        '<div class="ms-preview">' +
        '<img src="' + RT.esc(s.current) + '" alt="" loading="lazy" width="240" height="240" ' +
        'onerror="this.onerror=null;this.src=\'images/hero.svg\'">' +
        (s.overridden ? '<span class="ms-badge">Custom photo</span>' : '') +
        '</div>' +
        '<div class="ms-body">' +
        '<div class="ms-title">' + RT.esc(s.label) + '</div>' +
        '<div class="ms-where">' + RT.esc(s.where) + '</div>' +
        '<div class="ms-size">' + RT.esc(s.size) + '</div>' +
        '<p class="ms-prompt">' + RT.esc(s.prompt) + '</p>' +
        '<div class="ms-actions">' +
        '<button type="button" class="mini-btn gold" data-ms-upload="' + RT.esc(s.id) + '">Replace photo</button>' +
        (s.overridden ? '<button type="button" class="mini-btn" data-ms-reset="' + RT.esc(s.id) + '">Reset to original</button>' : '') +
        '</div></div></div>';
    }

    function wireMedia() {
      RT.$$('#mediaGroups [data-ms-upload]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-ms-upload');
          var input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.addEventListener('change', function () {
            var f = input.files && input.files[0];
            if (!f) return;
            b.disabled = true;
            b.textContent = 'Uploading…';
            resizeImage(f, function (dataUrl) {
              RT.uploadImage(dataUrl, id)
                .then(function (res) {
                  var path = (res && (res.path || res.url)) || '';
                  if (!path) throw new Error('No image path returned');
                  return RT.saveImgOverride(id, path);
                })
                .then(function () {
                  toast('Photo updated — live on the site');
                  renderMedia();
                })
                .catch(function (err) {
                  toast('Could not upload: ' + ((err && err.message) || 'offline'));
                })
                .then(function () { b.disabled = false; });
            });
          });
          input.click();
        });
      });

      RT.$$('#mediaGroups [data-ms-reset]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-ms-reset');
          RT.saveImgOverride(id, null)
            .then(function () { toast('Reverted to the original photo'); renderMedia(); })
            .catch(function () { toast('Could not reach the server — kept locally'); renderMedia(); });
        });
      });
    }

    var mediaFilter = document.getElementById('mediaFilter');
    if (mediaFilter) mediaFilter.addEventListener('input', function () { renderMedia(); });

    // ---------------- order pipeline ----------------
    var orderFilter = 'all';

    function renderOrderFilters(all) {
      var el = document.getElementById('orderFilters');
      if (!el) return;
      var counts = { all: all.length };
      STATUSES.forEach(function (s) { counts[s] = 0; });
      all.forEach(function (o) {
        var s = o.status || 'new';
        counts[s] = (counts[s] || 0) + 1;
      });
      var chips = [{ k: 'all', label: 'All' }].concat(STATUSES.map(function (s) { return { k: s, label: STATUS_LABEL[s] }; }));
      el.innerHTML = chips.map(function (c) {
        var n = counts[c.k] || 0;
        return '<button type="button" class="filter-chip' + (orderFilter === c.k ? ' on' : '') + (n ? '' : ' zero') +
          '" data-f="' + c.k + '" aria-pressed="' + (orderFilter === c.k ? 'true' : 'false') + '">' +
          RT.esc(c.label) + ' <span class="chip-n">' + n + '</span></button>';
      }).join('');
      RT.$$('#orderFilters .filter-chip').forEach(function (b) {
        b.addEventListener('click', function () {
          orderFilter = b.getAttribute('data-f');
          renderOrders();
        });
      });
    }

    function renderOrders() {
      var all = RT.getOrders().slice().sort(function (a, b) {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      var wrap = document.getElementById('ordersList');
      renderOrderFilters(all);
      if (!all.length) {
        wrap.innerHTML = '<div class="card empty-state"><h3>No orders yet</h3><p>Orders submitted through the order form land here from any device. WhatsApp messages go straight to 08166899379.</p></div>';
        return;
      }
      var orders = orderFilter === 'all'
        ? all
        : all.filter(function (o) { return (o.status || 'new') === orderFilter; });
      if (!orders.length) {
        wrap.innerHTML = '<div class="card empty-state"><h3>No ' + RT.esc((STATUS_LABEL[orderFilter] || orderFilter).toLowerCase()) +
          ' orders</h3><p>Use the filter chips above to get back to the full pipeline.</p></div>';
        return;
      }
      wrap.innerHTML = orders.map(function (o) {
        var extra = [];
        if (o.address) extra.push('Address: ' + RT.esc(o.address));
        if (o.email) extra.push('Email: ' + RT.esc(o.email));
        if (o.notes) extra.push('Notes: ' + RT.esc(o.notes));
        return '<div class="order-card card">' +
          '<div class="order-top"><div>' +
          '<span class="order-ref">' + RT.esc(o.ref || '') + '</span> ' +
          '<span class="status-pill status-' + RT.esc(o.status || 'new') + '">' + (STATUS_LABEL[o.status] || 'New') + '</span>' +
          '<p class="order-cust">' + RT.esc(o.name) + ' <span>· ' + RT.esc(o.phone) + '</span></p>' +
          '<p class="order-line"><strong>' + RT.esc(String(o.qty)) + '×</strong> ' + RT.esc(o.item || o.type) +
          (o.size ? ' — ' + RT.esc(o.size) : '') + (o.flavor ? ' — ' + RT.esc(o.flavor) : '') + '</p>' +
          (o.inscription ? '<p class="order-line" style="font-style:italic;font-size:13px">Inscription: “' + RT.esc(o.inscription) + '”</p>' : '') +
          '</div><div class="order-meta">' +
          '<strong>Needed ' + RT.prettyDate(o.neededDate) + '</strong>' +
          '<span>' + RT.esc(o.delivery) + (o.delivery === 'Delivery' && o.area ? ' · ' + RT.esc(o.area) : '') + '</span>' +
          '<span>Received ' + RT.prettyDate(o.createdAt) + '</span>' +
          '</div></div>' +
          (extra.length ? '<div class="order-extra">' + extra.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>' : '') +
          '<div class="status-actions">' +
          '<span class="lab">Status:</span>' +
          STATUSES.map(function (s) {
            return '<button type="button" class="' + (o.status === s ? 'on' : '') + '" data-ref="' + RT.esc(o.ref) + '" data-s="' + s + '">' + STATUS_LABEL[s] + '</button>';
          }).join('') +
          '<button type="button" data-detail="' + RT.esc(o.ref) + '" style="margin-left:auto">View detail</button>' +
          '<button type="button" class="mini-btn danger" data-remove="' + RT.esc(o.ref) + '">Remove</button>' +
          '</div></div>';
      }).join('');

      RT.$$('#ordersList .status-actions button[data-s]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var ref = btn.getAttribute('data-ref');
          var s = btn.getAttribute('data-s');
          var prev = RT.setOrderStatus(ref, s);
          renderOrders();
          renderStats();
          toast('Status updated to “' + STATUS_LABEL[s] + '”', function () {
            RT.setOrderStatus(ref, prev || 'new');
            renderOrders();
            renderStats();
          });
        });
      });
      RT.$$('#ordersList [data-detail]').forEach(function (btn) {
        btn.addEventListener('click', function () { openSheet(btn.getAttribute('data-detail')); });
      });
      RT.$$('#ordersList [data-remove]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var ref = btn.getAttribute('data-remove');
          if (!btn.getAttribute('data-armed')) {
            btn.setAttribute('data-armed', '1');
            btn.textContent = 'Remove for good?';
            setTimeout(function () { btn.removeAttribute('data-armed'); btn.textContent = 'Remove'; }, 3500);
            return;
          }
          RT.deleteOrder(ref);
          renderOrders();
          renderStats();
          renderAttn();
          toast('Order removed from the pipeline');
        });
      });
    }

    // ---------------- order detail sheet ----------------
    function openSheet(ref) {
      var o = RT.getOrders().filter(function (x) { return x.ref === ref; })[0];
      if (!o) return;
      document.getElementById('sheetTitle').textContent = 'Order ' + o.ref;
      document.getElementById('sheetBody').innerHTML =
        '<div><span class="s-label" style="color:var(--faint);font-size:11px;letter-spacing:.12em;text-transform:uppercase">Customer</span>' +
        '<p style="font-weight:600;margin-top:5px">' + RT.esc(o.name) + ' · ' + RT.esc(o.phone) + '</p>' +
        (o.email ? '<p style="font-size:13.5px;color:var(--dim)">' + RT.esc(o.email) + '</p>' : '') + '</div>' +
        '<div><span class="s-label" style="color:var(--faint);font-size:11px;letter-spacing:.12em;text-transform:uppercase">Order</span>' +
        '<p style="font-size:14.5px;margin-top:5px">' + RT.esc(String(o.qty)) + '× ' + RT.esc(o.item || o.type) +
        (o.size ? ' — ' + RT.esc(o.size) : '') + (o.flavor ? ' — ' + RT.esc(o.flavor) : '') + '</p>' +
        (o.inscription ? '<p style="font-size:14px;color:var(--dim)">Inscription: “' + RT.esc(o.inscription) + '”</p>' : '') + '</div>' +
        '<div><span class="s-label" style="color:var(--faint);font-size:11px;letter-spacing:.12em;text-transform:uppercase">When &amp; how</span>' +
        '<p style="font-size:14.5px;margin-top:5px">Needed by ' + RT.prettyDate(o.neededDate) + ' · ' + RT.esc(o.delivery) +
        (o.delivery === 'Delivery' && o.area ? ' — ' + RT.esc(o.area) + ', ' + RT.esc(o.address || '') : '') + '</p></div>' +
        (o.notes ? '<div><span class="s-label" style="color:var(--faint);font-size:11px;letter-spacing:.12em;text-transform:uppercase">Notes</span>' +
          '<p style="font-size:14px;color:var(--dim);margin-top:5px">' + RT.esc(o.notes) + '</p></div>' : '') +
        '<div><span class="s-label" style="color:var(--faint);font-size:11px;letter-spacing:.12em;text-transform:uppercase">Received</span>' +
        '<p style="font-size:14px;margin-top:5px">' + RT.prettyDate(o.createdAt) + '</p></div>';
      document.getElementById('sheetWa').href = RT.waLink(RT.buildOrderMessage(o));
      document.getElementById('sheetBackdrop').classList.add('on');
      document.getElementById('orderSheet').classList.add('on');
    }
    function closeSheet() {
      document.getElementById('sheetBackdrop').classList.remove('on');
      document.getElementById('orderSheet').classList.remove('on');
    }
    document.getElementById('sheetClose').addEventListener('click', closeSheet);
    document.getElementById('sheetBackdrop').addEventListener('click', closeSheet);

    // ---------------- cake details editor ----------------
    function openDetailsEditor(hostEl, cake, onApply) {
      closeDetailsEditor();
      var catOpts = Object.keys(RT_CATEGORIES).map(function (k) {
        return '<option value="' + k + '"' + (cake.category === k ? ' selected' : '') + '>' + RT.esc(RT_CATEGORIES[k]) + '</option>';
      }).join('');
      var wrap = document.createElement('div');
      wrap.className = 'details-editor';
      wrap.innerHTML =
        '<div class="de-fields">' +
        '<label class="hint" for="de-name">Cake name</label>' +
        '<input type="text" id="de-name" maxlength="90" value="' + escA(cake.name) + '">' +
        '<label class="hint" for="de-cat">Category</label>' +
        '<select id="de-cat">' + catOpts + '</select>' +
        '<label class="hint" for="de-desc">Description — shown on the menu card and cake page</label>' +
        '<textarea id="de-desc" rows="4" maxlength="900">' + escA(cake.description || '') + '</textarea>' +
        '<label class="hint" for="de-flav">Flavours — comma separated (e.g. Chocolate, Vanilla, Red velvet)</label>' +
        '<input type="text" id="de-flav" value="' + escA((cake.flavors || []).join(', ')) + '">' +
        '<span class="hint">Sizes — one per line as <code>label: price</code>. Leave empty for a single "from" price.</span>' +
        '<textarea id="de-sizes" rows="3" placeholder="6&quot; — serves 8–10: 15000">' +
        escA((cake.sizes || []).map(function (s) { return s.label + ': ' + s.price; }).join('\n')) +
        '</textarea>' +
        '<div class="queue-actions">' +
        '<button type="button" class="mini-btn gold de-apply">Save &amp; publish</button>' +
        '<button type="button" class="mini-btn de-reset">Reset to original</button>' +
        '<button type="button" class="mini-btn de-cancel">Cancel</button>' +
        '</div></div>';
      hostEl.insertAdjacentElement('afterend', wrap);
      openMgr = wrap;

      wrap.querySelector('.de-apply').addEventListener('click', function () {
        var name = wrap.querySelector('#de-name').value.trim();
        var desc = wrap.querySelector('#de-desc').value.trim();
        var cat = wrap.querySelector('#de-cat').value;
        var flav = wrap.querySelector('#de-flav').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var sizes = wrap.querySelector('#de-sizes').value.split('\n').map(function (line) {
          var m = line.match(/^(.*?)\s*[:：]\s*(\d+)\s*$/);
          return m ? { label: m[1].trim(), price: Number(m[2]) } : null;
        }).filter(Boolean);
        var patch = { name: name, description: desc, category: cat, flavors: flav };
        if (sizes.length) patch.sizes = sizes;
        closeDetailsEditor();
        onApply(patch);
      });
      wrap.querySelector('.de-reset').addEventListener('click', function () {
        closeDetailsEditor();
        // null clears the override so the site falls back to the original
        // copy baked into data.js — locally and on the shared store.
        onApply({ name: null, description: null, category: null, flavors: null, sizes: null });
      });
      wrap.querySelector('.de-cancel').addEventListener('click', closeDetailsEditor);
      wrap.querySelector('#de-name').focus();
    }
    function closeDetailsEditor() {
      var d = document.querySelector('.details-editor');
      if (d) d.remove();
    }

    // ---------------- menu table ----------------
    function renderMenu() {
      var wrap = document.getElementById('menuRows');
      wrap.innerHTML = RT.getMenu().map(function (c) {
        return '<div class="mt-row">' +
          '<span class="mt-name"><img src="' + c.image + '" alt="" width="40" height="40"><span>' + RT.esc(c.name) + '</span>' +
          '<button type="button" class="mini-btn" data-details="' + c.slug + '" style="margin-left:auto">Details</button>' +
          '<button type="button" class="mini-btn" data-img="' + c.slug + '">Photo</button></span>' +
          '<span class="cat-chip">' + RT.esc(RT_CATEGORIES[c.category] || c.category) + '</span>' +
          '<span><span class="price-edit" tabindex="0" role="button" data-price="' + c.slug + '">' +
          (c.price_from === null ? 'Quote' : RT.naira(c.price_from)) + '</span></span>' +
          '<span class="switch' + (c.available ? ' on' : '') + '" tabindex="0" role="switch" aria-checked="' + (c.available ? 'true' : 'false') + '" aria-label="Available" data-avail="' + c.slug + '"><i></i></span>' +
          '<span class="mt-edit-btn' + (c.featured ? ' on' : '') + '" tabindex="0" role="button" data-feat="' + c.slug + '" style="' + (c.featured ? 'background:var(--gold);color:var(--btn-text)' : '') + '">' + (c.featured ? 'Star' : 'Star off') + '</span>' +
          '</div>';
      }).join('');

      RT.$$('#menuRows [data-details]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          var slug = el.getAttribute('data-details');
          openDetailsEditor(el.closest('.mt-row'), RT.findCake(slug), function (patch) {
            var prev = {};
            Object.keys(patch).forEach(function (k) { prev[k] = RT.findCake(slug)[k]; });
            RT.saveOverride(slug, patch);
            renderMenu();
            renderStats();
            toast((RT.findCake(slug).name || 'Cake') + ' details saved — live everywhere', function () {
              RT.saveOverride(slug, prev);
              renderMenu();
            });
          });
        });
      });

      RT.$$('#menuRows [data-price]').forEach(function (el) {
        function startEdit() {
          var slug = el.getAttribute('data-price');
          var cake = RT.findCake(slug);
          var input = document.createElement('input');
          input.type = 'number';
          input.min = '0';
          input.className = 'price-edit';
          input.value = cake.price_from === null ? '' : cake.price_from;
          input.placeholder = 'quote';
          el.replaceWith(input);
          input.focus();
          input.select();
          function save() {
            var prev = cake.price_from;
            var v = input.value === '' ? null : Number(input.value);
            RT.saveOverride(slug, { price_from: v });
            renderMenu();
            renderStats();
            toast(cake.name + ' updated to ' + (v === null ? 'quote' : RT.naira(v)), function () {
              RT.saveOverride(slug, { price_from: prev });
              renderMenu();
            });
          }
          input.addEventListener('blur', save);
          input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            if (e.key === 'Escape') { input.removeEventListener('blur', save); renderMenu(); }
          });
        }
        el.addEventListener('click', startEdit);
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(); } });
      });

      RT.$$('#menuRows [data-avail]').forEach(function (el) {
        function toggle() {
          var slug = el.getAttribute('data-avail');
          var cake = RT.findCake(slug);
          RT.saveOverride(slug, { available: !cake.available });
          renderMenu();
          toast(cake.name + (cake.available ? ' hidden from the menu' : ' is live again'), function () {
            RT.saveOverride(slug, { available: cake.available });
            renderMenu();
          });
        }
        el.addEventListener('click', toggle);
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      });

      RT.$$('#menuRows [data-feat]').forEach(function (el) {
        function toggle() {
          var slug = el.getAttribute('data-feat');
          var cake = RT.findCake(slug);
          RT.saveOverride(slug, { featured: !cake.featured });
          renderMenu();
        }
        el.addEventListener('click', toggle);
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      });

      RT.$$('#menuRows [data-img]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          var slug = el.getAttribute('data-img');
          var cake = RT.findCake(slug);
          var prevOv = RT.imgOverrides()[slug] || '';
          openImgManager(el.closest('.mt-row'), cake.image, function (next) {
            RT.saveImgOverride(slug, next);
            renderMenu();
            toast(cake.name + ' photo updated', function () {
              RT.saveImgOverride(slug, prevOv);
              renderMenu();
            });
          });
        });
      });
    }

    // ---------------- reviews ----------------
    function renderReviews() {
      var local = RT.getLocalReviews();
      var pending = local.filter(function (r) { return !r.approved; });
      var published = local.filter(function (r) { return r.approved; });

      document.getElementById('pendingList').innerHTML = pending.length
        ? pending.map(reviewRow).join('')
        : '<div class="card empty-state"><p>Nothing waiting for approval.</p></div>';

      document.getElementById('publishedList').innerHTML = published.length
        ? published.map(function (r) {
            return reviewRow(r, '<button class="no" data-no="' + r.id + '">Hide</button>');
          }).join('')
        : '<div class="card empty-state"><p>No locally published reviews yet.</p></div>';

      RT.$$('#pendingList [data-ok]').forEach(function (b) {
        b.addEventListener('click', function () { setApproved(Number(b.getAttribute('data-ok')), true); });
      });
      RT.$$('#pendingList [data-no], #publishedList [data-no]').forEach(function (b) {
        b.addEventListener('click', function () { setApproved(Number(b.getAttribute('data-no')), false); });
      });

      function reviewRow(r, extraActs) {
        return '<div class="admin-rev"><div class="rh"><div>' +
          '<span class="rn">' + RT.esc(r.name) + (r.location ? ' <span>· ' + RT.esc(r.location) + '</span>' : '') + '</span>' +
          '<div class="stars" style="margin-top:4px">' + RT.starsHtml(r.rating) + '</div>' +
          '</div><div class="acts">' +
          (extraActs || '<button class="ok" data-ok="' + r.id + '">Approve</button><button class="no" data-no="' + r.id + '">Reject</button>') +
          '</div></div><p>' + RT.esc(r.text) + '</p></div>';
      }
    }

    function setApproved(id, approved) {
      var prev = RT.getLocalReviews().filter(function (r) { return r.id === id; }).map(function (r) { return !!r.approved; })[0];
      RT.setReviewApproved(id, approved);
      renderReviews();
      renderStats();
      renderAttn();
      toast(approved ? 'Review published' : 'Review removed', function () {
        RT.setReviewApproved(id, prev === undefined ? false : prev);
        renderReviews();
        renderStats();
        renderAttn();
      });
    }

    // ---------------- image manager (preview → Apply) ----------------
    var openMgr = null;

    function closeImgManager() {
      if (openMgr && openMgr.parentNode) openMgr.parentNode.removeChild(openMgr);
      openMgr = null;
    }

    function escA(s) {
      return RT.esc(String(s == null ? '' : s)).replace(/"/g, '&quot;');
    }

    function resizeImage(file, cb) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var max = 1400;
          var scale = Math.min(1, max / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          if (!ctx) { cb(reader.result); return; }
          ctx.drawImage(img, 0, 0, w, h);
          try { cb(canvas.toDataURL('image/jpeg', 0.82)); }
          catch (e) { cb(reader.result); }
        };
        img.onerror = function () { cb(reader.result); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    function openImgManager(hostEl, current, onApply) {
      closeImgManager();
      var isData = String(current).slice(0, 5) === 'data:';
      var wrap = document.createElement('div');
      wrap.className = 'img-manager';
      wrap.innerHTML =
        '<div class="img-preview"><img alt="Preview of selected image" src="' + escA(current) + '"></div>' +
        '<div class="im-fields">' +
        '<span class="hint">Image URL — a site path or an https link</span>' +
        '<input type="text" class="im-url" placeholder="images/photos/cake-red-velvet.jpg" value="' + (isData ? '' : escA(current)) + '">' +
        '<span class="hint">…or upload a photo (resized to 1400px, kept in this browser)</span>' +
        '<input type="file" class="im-file" accept="image/*">' +
        '<div class="queue-actions">' +
        '<button type="button" class="mini-btn gold im-apply">Apply</button>' +
        '<button type="button" class="mini-btn im-reset">Use default</button>' +
        '<button type="button" class="mini-btn im-cancel">Cancel</button>' +
        '</div></div>';
      hostEl.insertAdjacentElement('afterend', wrap);
      openMgr = wrap;

      var img = wrap.querySelector('.img-preview img');
      var url = wrap.querySelector('.im-url');
      url.addEventListener('input', function () {
        var v = url.value.trim();
        if (v) img.src = v;
      });
      wrap.querySelector('.im-file').addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        resizeImage(f, function (dataUrl) {
          img.src = dataUrl;
          url.value = '';
        });
      });
      wrap.querySelector('.im-apply').addEventListener('click', function () {
        var next = url.value.trim() || img.getAttribute('src') || '';
        closeImgManager();
        if (next) onApply(next);
      });
      wrap.querySelector('.im-reset').addEventListener('click', function () {
        closeImgManager();
        onApply('');
      });
      wrap.querySelector('.im-cancel').addEventListener('click', closeImgManager);
    }

    // ---------------- ratings queue (dashboard) ----------------
    function renderRatings() {
      var s = RT.ratingState();
      var q = document.getElementById('ratingsQueue');
      if (!q) return;
      var html = '';

      s.pending.forEach(function (p, idx) {
        var cake = RT.findCake(p.slug);
        html += '<div class="fb-item queue-row"><div class="q-main">' +
          '<strong>' + RT.esc(cake ? cake.name : p.slug) + '</strong>' +
          '<div class="stars">' + RT.starsHtml(p.stars) + '</div>' +
          '<span class="hint">Submitted ' + RT.prettyDate(p.ts) + '</span>' +
          '</div><div class="queue-actions">' +
          '<button type="button" class="mini-btn gold" data-rt-ok="' + idx + '">Approve</button>' +
          '<button type="button" class="mini-btn" data-rt-no="' + idx + '">Reject</button>' +
          '</div></div>';
      });

      var slugs = Object.keys(s.approved).filter(function (k) { return s.approved[k] && s.approved[k].n; });
      slugs.forEach(function (slug) {
        var a = s.approved[slug];
        var cake = RT.findCake(slug);
        var avg = Math.round((a.sum / a.n) * 10) / 10;
        html += '<div class="fb-item queue-row"><div class="q-main">' +
          '<strong>' + RT.esc(cake ? cake.name : slug) + '</strong>' +
          '<div class="stars">' + RT.starsHtml(Math.round(avg)) + '</div>' +
          '<span class="hint">' + avg + ' average · ' + a.n + ' rating(s) published</span>' +
          '</div><div class="queue-actions">' +
          '<button type="button" class="mini-btn" data-rt-reset="' + RT.esc(slug) + '">Reset</button>' +
          '</div></div>';
      });

      q.innerHTML = html ||
        '<div class="card empty-state"><p>No product ratings yet. Customers rate a cake from its detail page; you approve them here.</p></div>';

      RT.$$('#ratingsQueue [data-rt-ok]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Number(b.getAttribute('data-rt-ok'));
          var p = RT.ratingState().pending[i];
          if (!p) return;
          RT.setRatingAction(p.id, 'approve');
          renderRatings();
          renderAttn();
          toast('Rating published for ' + p.slug, function () {
            var back = RT.ratingState();
            var cur = back.approved[p.slug] || { sum: 0, n: 0 };
            if (cur.n <= 1) delete back.approved[p.slug];
            else back.approved[p.slug] = { sum: cur.sum - p.stars, n: cur.n - 1 };
            back.pending.splice(Math.min(i, back.pending.length), 0, p);
            RT.save('rt_ratings', back);
            RT.unapproveRating(p.slug, p.stars);
            RT.requeueRating(p);
            renderRatings();
            renderAttn();
          });
        });
      });
      RT.$$('#ratingsQueue [data-rt-no]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Number(b.getAttribute('data-rt-no'));
          var p = RT.ratingState().pending[i];
          if (!p) return;
          RT.setRatingAction(p.id, 'reject');
          renderRatings();
          renderAttn();
          toast('Rating rejected', function () {
            var back = RT.ratingState();
            back.pending.splice(Math.min(i, back.pending.length), 0, p);
            RT.save('rt_ratings', back);
            RT.requeueRating(p);
            renderRatings();
            renderAttn();
          });
        });
      });
      RT.$$('#ratingsQueue [data-rt-reset]').forEach(function (b) {
        b.addEventListener('click', function () {
          var slug = b.getAttribute('data-rt-reset');
          var st = RT.ratingState();
          var prev = st.approved[slug];
          delete st.approved[slug];
          RT.save('rt_ratings', st);
          RT.resetRatings(slug);
          renderRatings();
          toast('Published ratings cleared for ' + slug, function () {
            var back = RT.ratingState();
            back.approved[slug] = prev;
            RT.save('rt_ratings', back);
            if (prev) RT.restoreRatings(slug, prev.sum, prev.n);
            renderRatings();
          });
        });
      });
    }

    // ---------------- feedback survey queue (dashboard) ----------------
    function renderFeedback() {
      var el = document.getElementById('feedbackList');
      if (!el) return;
      var list = RT.getFeedback();
      if (!list.length) {
        el.innerHTML = '<div class="card empty-state"><p>No survey responses yet. Customers get a quick star survey right after they submit an order.</p></div>';
        return;
      }
      el.innerHTML = list.map(function (f) {
        var chips = [];
        if (f.taste) chips.push('Taste: ' + f.taste);
        if (f.packaging) chips.push('Packaging: ' + f.packaging);
        if (f.delivery) chips.push('Delivery: ' + f.delivery);
        return '<div class="fb-item">' +
          '<div class="fb-top"><strong>' + (f.ref ? 'Order ' + RT.esc(f.ref) : 'Survey response') + '</strong>' +
          '<span class="hint">' + RT.prettyDate(f.ts) + '</span></div>' +
          '<div class="stars">' + RT.starsHtml(f.overall || 0) + '</div>' +
          (chips.length ? '<p class="fb-chips">' + chips.map(function (t) { return '<span>' + RT.esc(t) + '</span>'; }).join('') + '</p>' : '') +
          (f.note ? '<p class="fb-note">' + RT.esc(f.note) + '</p>' : '') +
          '</div>';
      }).join('');
    }

    // ---------------- content editors ----------------
    function bindVal(id, fn, initial) {
      var el = document.getElementById(id);
      if (!el) return;
      el.value = initial == null ? '' : initial;
      el.oninput = function () { fn(el.value); };
    }

    function listRowHtml(item, idx, fields, hasImage) {
      return '<div class="edit-row' + (hasImage ? '' : ' no-img') + '" data-li="' + idx + '">' +
        (hasImage ? '<img class="er-thumb" src="' + escA(item.image || '') + '" alt="" width="56" height="56">' : '') +
        '<div class="er-fields">' +
        fields.map(function (f) {
          return '<input type="text" data-lf="' + f.k + '" placeholder="' + f.ph + '" value="' + escA(item[f.k]) + '">';
        }).join('') +
        '</div>' +
        '<div class="er-actions">' +
        (hasImage ? '<button type="button" class="mini-btn" data-limg>Change image</button>' : '') +
        '<button type="button" class="mini-btn danger" data-ldel>Remove</button>' +
        '</div></div>';
    }

    function wireListEditor(wrapId, items, storageKey, fields, hasImage, addBtnId, makeItem) {
      var wrap = document.getElementById(wrapId);
      if (!wrap) return;
      wrap.innerHTML = items.length
        ? items.map(function (item, i) { return listRowHtml(item, i, fields, hasImage); }).join('')
        : '<p class="hint">Nothing here yet.</p>';

      function save() { RT.saveContent(storageKey, items); }

      RT.$$('#' + wrapId + ' [data-lf]').forEach(function (el) {
        el.oninput = function () {
          var i = Number(el.closest('[data-li]').getAttribute('data-li'));
          items[i][el.getAttribute('data-lf')] = el.value;
          save();
        };
      });
      if (hasImage) {
        RT.$$('#' + wrapId + ' [data-limg]').forEach(function (b) {
          b.addEventListener('click', function () {
            var row = b.closest('[data-li]');
            var i = Number(row.getAttribute('data-li'));
            openImgManager(row, items[i].image, function (next) {
              items[i].image = next;
              save();
              renderContent();
              toast('Image updated', function () { renderContent(); });
            });
          });
        });
      }
      RT.$$('#' + wrapId + ' [data-ldel]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Number(b.closest('[data-li]').getAttribute('data-li'));
          var removed = items.splice(i, 1)[0];
          save();
          renderContent();
          toast('Entry removed', function () {
            items.splice(Math.min(i, items.length), 0, removed);
            save();
            renderContent();
          });
        });
      });
      if (addBtnId && makeItem) {
        var add = document.getElementById(addBtnId);
        if (add) add.onclick = function () {
          items.push(makeItem());
          save();
          renderContent();
          toast('Entry added — fill in the details');
        };
      }
    }

    function renderContent() {
      var all = RT.getAllContent();

      // About
      var about = JSON.parse(JSON.stringify(all.RT_ABOUT || {}));
      if (!Array.isArray(about.paragraphs)) about.paragraphs = [];
      about.paragraphs = about.paragraphs.slice(0, 3);
      while (about.paragraphs.length < 3) about.paragraphs.push('');
      function saveAbout() { RT.saveContent('RT_ABOUT', about); }
      bindVal('c-eyebrow', function (v) { about.eyebrow = v; saveAbout(); }, about.eyebrow);
      bindVal('c-headline', function (v) { about.headline = v; saveAbout(); }, about.headline);
      bindVal('c-promise', function (v) { about.promise = v; saveAbout(); }, about.promise);
      ['c-p1', 'c-p2', 'c-p3'].forEach(function (id, i) {
        bindVal(id, function (v) { about.paragraphs[i] = v; saveAbout(); }, about.paragraphs[i]);
      });

      // Why Us
      var why = JSON.parse(JSON.stringify(all.RT_WHY || []));
      var whyWrap = document.getElementById('whyEditors');
      if (whyWrap) {
        whyWrap.innerHTML = why.length
          ? why.map(function (w, i) {
              return '<div class="edit-row no-img" data-why="' + i + '"><div class="er-fields">' +
                '<input type="text" data-wf="title" placeholder="Title" value="' + escA(w.title) + '">' +
                '<input type="text" data-wf="text" placeholder="Short text" value="' + escA(w.text) + '">' +
                '<textarea data-wf="long" rows="2" placeholder="Long detail shown under the card">' + escA(w.long || '') + '</textarea>' +
                '</div></div>';
            }).join('')
          : '<p class="hint">No Why Us cards.</p>';
        RT.$$('#whyEditors [data-wf]').forEach(function (el) {
          el.oninput = function () {
            var i = Number(el.closest('[data-why]').getAttribute('data-why'));
            why[i][el.getAttribute('data-wf')] = el.value;
            RT.saveContent('RT_WHY', why);
          };
        });
      }

      // How to Order
      var how = JSON.parse(JSON.stringify(all.RT_HOW || []));
      var howWrap = document.getElementById('howEditors');
      if (howWrap) {
        howWrap.innerHTML = how.length
          ? how.map(function (s, i) {
              return '<div class="edit-row no-img" data-how="' + i + '"><div class="er-fields">' +
                '<input type="text" data-hf="step" placeholder="Step no." value="' + escA(s.step) + '" style="max-width:70px">' +
                '<input type="text" data-hf="title" placeholder="Title" value="' + escA(s.title) + '">' +
                '<input type="text" data-hf="text" placeholder="Text" value="' + escA(s.text) + '">' +
                '</div></div>';
            }).join('')
          : '<p class="hint">No steps.</p>';
        RT.$$('#howEditors [data-hf]').forEach(function (el) {
          el.oninput = function () {
            var i = Number(el.closest('[data-how]').getAttribute('data-how'));
            how[i][el.getAttribute('data-hf')] = el.value;
            RT.saveContent('RT_HOW', how);
          };
        });
      }

      // Design gallery / Space / Hero slides
      wireListEditor('galleryEditors', JSON.parse(JSON.stringify(all.RT_GALLERY || [])), 'RT_GALLERY',
        [{ k: 'title', ph: 'Title' }, { k: 'caption', ph: 'Caption' }], true, 'addDesign',
        function () { return { id: 'g' + Date.now(), title: 'New design', caption: '', image: 'images/photos/design-1.jpg' }; });

      wireListEditor('spaceEditors', JSON.parse(JSON.stringify(all.RT_SPACE || [])), 'RT_SPACE',
        [{ k: 'caption', ph: 'Caption' }], true, 'addSpace',
        function () { return { id: 's' + Date.now(), caption: 'New photo', image: 'images/photos/space-1.jpg' }; });

      wireListEditor('heroEditors', JSON.parse(JSON.stringify(all.RT_HERO_SLIDES || [])), 'RT_HERO_SLIDES',
        [{ k: 'alt', ph: 'Alt text (describe the photo)' }], true, 'addHero',
        function () { return { image: 'images/photos/hero-1.jpg', alt: '' }; });

      // Process spreadsheet (the big table on the home page)
      wireListEditor('processEditors', JSON.parse(JSON.stringify(all.RT_PROCESS || [])), 'RT_PROCESS',
        [{ k: 'stage', ph: 'Stage' }, { k: 'detail', ph: 'What happens' }, { k: 'timing', ph: 'Timing' },
         { k: 'who', ph: 'Who' }, { k: 'status', ph: 'Status label' }, { k: 'tone', ph: 'Tone (hot/cool/soft)' }],
        false, 'addStep',
        function () {
          return { stage: 'New stage', detail: '', timing: '', who: '', status: '', tone: 'soft' };
        });

      updateStorageMeter();
    }

    // ---------------- admin account settings ----------------
    (function initAcct() {
      var emailEl = document.getElementById('acctEmail');
      var passEl = document.getElementById('acctPass');
      var saveBtn = document.getElementById('acctSave');
      var savedMsg = document.getElementById('acctSaved');
      if (!emailEl || !passEl || !saveBtn) return;
      var c = RT.getAdminCreds();
      emailEl.value = c.email || '';
      saveBtn.addEventListener('click', function () {
        var em = emailEl.value.trim();
        var pw = passEl.value;
        if (!em) { toast('Enter an email address'); emailEl.focus(); return; }
        // Blank password = keep the current one (matches the field's placeholder).
        if (pw && pw.length < 6) { toast('New password must be at least 6 characters'); passEl.focus(); return; }
        RT.saveAdminCreds(em, pw || RT.getAdminCreds().password); // offline copy, saved straight away
        passEl.value = '';
        if (savedMsg) {
          savedMsg.classList.remove('hidden');
          setTimeout(function () { savedMsg.classList.add('hidden'); }, 4000);
        }
        // Publish it so the same login works on every device.
        RT.api('POST', '/admin/account', { email: em, password: pw }, true)
          .then(function (res) {
            if (res && res.token) RT.setAdminToken(res.token);
            toast('Login details saved');
          })
          .catch(function (err) {
            toast(err && err.status
              ? 'Server said: ' + err.message
              : 'Saved on this browser — it will sync when you are online');
          });
      });
    })();

    // ---------------- export / import / storage ----------------
    function updateStorageMeter() {
      var bar = document.getElementById('storageBar');
      var note = document.getElementById('storageNote');
      if (!bar || !note) return;
      var bytes = 0;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          bytes += (k.length + (localStorage.getItem(k) || '').length) * 2;
        }
      } catch (e) { /* storage blocked */ }
      var pct = Math.min(100, Math.round((bytes / (5 * 1024 * 1024)) * 100));
      bar.style.width = Math.max(pct, 2) + '%';
      note.textContent = pct > 60
        ? 'About ' + pct + '% of this browser\u2019s ~5MB site storage used — export a backup, then remove old uploads.'
        : 'About ' + pct + '% of this browser\u2019s ~5MB site storage used.';
    }

    var exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', function () {
      var payload = {
        site: 'relish-torte',
        kind: 'content-backup',
        exportedAt: new Date().toISOString(),
        content: RT.getAllContent(),
        imageOverrides: RT.imgOverrides(),
        newsletter: RT.load('rt_newsletter', null),
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'relish-content-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1000);
      toast('Content exported as JSON');
    });

    var importBtn = document.getElementById('importBtn');
    var importFile = document.getElementById('importFile');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', function () { importFile.click(); });
      importFile.addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          var data;
          try { data = JSON.parse(reader.result); }
          catch (err) { toast('That file is not valid JSON'); return; }
          if (!data || data.kind !== 'content-backup' || !data.content) {
            toast('Unexpected file — use an Export from this page');
            return;
          }
          ['RT_ABOUT', 'RT_WHY', 'RT_HOW', 'RT_PROCESS', 'RT_GALLERY', 'RT_SPACE', 'RT_HERO_SLIDES'].forEach(function (k) {
            if (data.content[k] !== undefined) RT.saveContent(k, data.content[k]);
          });
          if (data.imageOverrides) {
            Object.keys(data.imageOverrides).forEach(function (slug) {
              RT.saveImgOverride(slug, data.imageOverrides[slug]);
            });
          }
          if (data.newsletter) RT.save('rt_newsletter', data.newsletter);
          renderContent();
          renderMenu();
          toast('Content imported from backup');
        };
        reader.readAsText(f);
        importFile.value = '';
      });
    }

    if (authed()) showDash();
    else showLogin();
  });
})();
