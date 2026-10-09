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
    }
    function showLogin() {
      dash.classList.add('hidden');
      loginWrap.classList.remove('hidden');
    }

    document.getElementById('googleBtn').addEventListener('click', function () {
      loginErr.textContent = 'Google sign-in turns on once Supabase is connected — for now, sign in with your PIN.';
      loginErr.classList.remove('hidden');
    });

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
        ['dashboard', 'menu', 'reviews'].forEach(function (t) {
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
          '<span class="mt-name"><img src="' + c.image + '" alt="" width="40" height="40"><span>' + RT.esc(c.name) + '</span></span>' +
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

    if (authed()) showDash();
    else showLogin();
  });
})();
