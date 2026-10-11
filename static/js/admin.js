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
      renderOrders();
      renderMenu();
      renderReviews();
      renderRatings();
      renderFeedback();
      renderContent();
      updateStorageMeter();
    }
    function showLogin() {
      dash.classList.add('hidden');
      loginWrap.classList.remove('hidden');
    }

    // ---- Google sign-in (Google Identity Services + allowlisted Gmail) ----
    function jwtEmail(cred) {
      try {
        var payload = cred.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        var json = decodeURIComponent(
          atob(payload)
            .split('')
            .map(function (c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); })
            .join('')
        );
        return (JSON.parse(json).email || '').toLowerCase();
      } catch (e) { return ''; }
    }
    function googleGrant(email) {
      var allow = ((window.RT_CONFIG && RT_CONFIG.ADMIN_GOOGLE_EMAIL) || '').toLowerCase();
      if (!allow || email !== allow) {
        loginErr.textContent = 'Google account not authorised: ' + (email || 'no email in token') + '.';
        loginErr.classList.remove('hidden');
        return;
      }
      try { sessionStorage.setItem('rt_admin', '1'); } catch (err) { /* file:// may block storage */ }
      loginErr.classList.add('hidden');
      showDash();
    }
    function initGoogle() {
      var cid = (window.RT_CONFIG && RT_CONFIG.GOOGLE_CLIENT_ID) || '';
      if (!cid || !window.google || !google.accounts || !google.accounts.id) return false;
      google.accounts.id.initialize({
        client_id: cid,
        callback: function (resp) { googleGrant(jwtEmail(resp.credential || '')); },
      });
      var slot = document.getElementById('googleSlot');
      slot.style.display = '';
      google.accounts.id.renderButton(slot, { theme: 'outline', size: 'large', text: 'continue_with', width: 300 });
      document.getElementById('googleBtn').classList.add('hidden');
      return true;
    }
    document.getElementById('googleBtn').addEventListener('click', function () {
      if (initGoogle()) return;
      var allow = (window.RT_CONFIG && RT_CONFIG.ADMIN_GOOGLE_EMAIL) || '';
      loginErr.textContent = allow
        ? 'Google sign-in (allowlist: ' + allow + ') activates when GOOGLE_CLIENT_ID is set in config.js — for now, sign in with your PIN.'
        : 'Google sign-in activates when GOOGLE_CLIENT_ID and ADMIN_GOOGLE_EMAIL are set in config.js — for now, sign in with your PIN.';
      loginErr.classList.remove('hidden');
    });
    window.addEventListener('load', function () { initGoogle(); });

    document.getElementById('loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var pin = document.getElementById('pin').value.trim();
      if (pin === RT_ADMIN_PIN) {
        try { sessionStorage.setItem('rt_admin', '1'); } catch (err) { /* file:// may block storage */ }
        loginErr.classList.add('hidden');
        document.getElementById('pin').value = '';
        showDash();
      } else {
        loginErr.textContent = 'Wrong PIN. Try again.';
        loginErr.classList.remove('hidden');
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', function () {
      try { sessionStorage.removeItem('rt_admin'); } catch (e) { /* ignore */ }
      showLogin();
    });

    // ---------------- tabs ----------------
    RT.$$('.admin-tabs button[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        RT.$$('.admin-tabs button[data-tab]').forEach(function (x) { x.classList.toggle('active', x === b); });
        ['dashboard', 'menu', 'reviews', 'content'].forEach(function (t) {
          document.getElementById('tab-' + t).classList.toggle('hidden', t !== b.getAttribute('data-tab'));
        });
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
    function renderOrders() {
      var orders = RT.getOrders().slice().sort(function (a, b) {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      var wrap = document.getElementById('ordersList');
      if (!orders.length) {
        wrap.innerHTML = '<div class="card empty-state"><h3>No orders yet</h3><p>Orders submitted through the order form on this browser land here. WhatsApp messages go straight to 08166899379 from any device.</p></div>';
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
          '</div></div>';
      }).join('');

      RT.$$('#ordersList .status-actions button[data-s]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var ref = btn.getAttribute('data-ref');
          var s = btn.getAttribute('data-s');
          var all = RT.getOrders();
          var prev = null;
          all.forEach(function (o) { if (o.ref === ref) { prev = o.status; o.status = s; } });
          RT.save('rt_orders', all);
          renderOrders();
          renderStats();
          toast('Status updated to “' + STATUS_LABEL[s] + '”', function () {
            var back = RT.getOrders();
            back.forEach(function (o) { if (o.ref === ref) o.status = prev; });
            RT.save('rt_orders', back);
            renderOrders();
            renderStats();
          });
        });
      });
      RT.$$('#ordersList [data-detail]').forEach(function (btn) {
        btn.addEventListener('click', function () { openSheet(btn.getAttribute('data-detail')); });
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

    // ---------------- menu table ----------------
    function renderMenu() {
      var wrap = document.getElementById('menuRows');
      wrap.innerHTML = RT.getMenu().map(function (c) {
        return '<div class="mt-row">' +
          '<span class="mt-name"><img src="' + c.image + '" alt="" width="40" height="40"><span>' + RT.esc(c.name) + '</span>' +
          '<button type="button" class="mini-btn" data-img="' + c.slug + '" style="margin-left:auto">Photo</button></span>' +
          '<span class="cat-chip">' + RT.esc(RT_CATEGORIES[c.category]) + '</span>' +
          '<span><span class="price-edit" tabindex="0" role="button" data-price="' + c.slug + '">' +
          (c.price_from === null ? 'Quote' : RT.naira(c.price_from)) + '</span></span>' +
          '<span class="switch' + (c.available ? ' on' : '') + '" tabindex="0" role="switch" aria-checked="' + (c.available ? 'true' : 'false') + '" aria-label="Available" data-avail="' + c.slug + '"><i></i></span>' +
          '<span class="mt-edit-btn' + (c.featured ? ' on' : '') + '" tabindex="0" role="button" data-feat="' + c.slug + '" style="' + (c.featured ? 'background:var(--gold);color:var(--btn-text)' : '') + '">' + (c.featured ? 'Star' : 'Star off') + '</span>' +
          '</div>';
      }).join('');

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
      var local = RT.getLocalReviews();
      var prev = null;
      local.forEach(function (r) { if (r.id === id) { prev = r.approved; r.approved = approved; } });
      RT.save('rt_reviews', local);
      renderReviews();
      renderStats();
      toast(approved ? 'Review published' : 'Review removed', function () {
        var back = RT.getLocalReviews();
        back.forEach(function (r) { if (r.id === id) r.approved = prev; });
        RT.save('rt_reviews', back);
        renderReviews();
        renderStats();
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
          var st = RT.ratingState();
          var p = st.pending[i];
          if (!p) return;
          st.pending.splice(i, 1);
          var a = st.approved[p.slug] || { sum: 0, n: 0 };
          st.approved[p.slug] = { sum: a.sum + p.stars, n: a.n + 1 };
          RT.save('rt_ratings', st);
          renderRatings();
          toast('Rating published for ' + p.slug, function () {
            var back = RT.ratingState();
            var cur = back.approved[p.slug] || { sum: 0, n: 0 };
            if (cur.n <= 1) delete back.approved[p.slug];
            else back.approved[p.slug] = { sum: cur.sum - p.stars, n: cur.n - 1 };
            back.pending.splice(Math.min(i, back.pending.length), 0, p);
            RT.save('rt_ratings', back);
            renderRatings();
          });
        });
      });
      RT.$$('#ratingsQueue [data-rt-no]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Number(b.getAttribute('data-rt-no'));
          var st = RT.ratingState();
          var p = st.pending[i];
          if (!p) return;
          st.pending.splice(i, 1);
          RT.save('rt_ratings', st);
          renderRatings();
          toast('Rating rejected', function () {
            var back = RT.ratingState();
            back.pending.splice(Math.min(i, back.pending.length), 0, p);
            RT.save('rt_ratings', back);
            renderRatings();
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
          renderRatings();
          toast('Published ratings cleared for ' + slug, function () {
            var back = RT.ratingState();
            back.approved[slug] = prev;
            RT.save('rt_ratings', back);
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
