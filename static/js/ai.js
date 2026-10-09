/* Relish Torte — "Ask Torte" AI concierge + AI helpers
   Order of attempts: Groq (if key) -> rule engine -> canned reply.
   Also exposes describeCake() for the Cake Studio and weekInReview()
   for the admin dashboard. Works fully offline on file://. */
(function () {
  var RT = window.RT;
  var CFG = window.RT_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var session = { messages: [], lastSent: 0, count: 0 };

  // ---------------- knowledge ----------------
  function menuDigest() {
    return RT.getMenu()
      .map(function (c) {
        var price = c.price_from === null ? 'custom quote' : RT.naira(c.price_from);
        return c.name + ' (' + RT_CATEGORIES[c.category] + ') from ' + price;
      })
      .join('; ');
  }

  function systemPrompt() {
    return [
      'You are "Torte", the friendly concierge of Relish Torte, a 24/7 bakery in Jos, Plateau State, Nigeria.',
      'Address: ' + RT_ADDRESS + '. Phone/WhatsApp: ' + RT_PHONE_DISPLAY + '. Instagram: ' + RT_INSTAGRAM_HANDLE + '.',
      'Tagline: "' + RT_TAGLINE + '".',
      'Answer in max 60 words, warm, practical, no emoji. Prices in naira (state prices are from-prices and may change).',
      'If the customer wants to order, tell them to tap the WhatsApp button or the Order Now button.',
      'Menu: ' + menuDigest() + '.',
      'Delivery areas: ' + RT_AREAS.join(', ') + '. Pickup is free; delivery is arranged on WhatsApp.',
      'Catering available for events. Apprenticeship programs: ' +
        RT_PROGRAMS.map(function (p) { return p.name + ' (' + (p.price || 'TBC') + ')'; }).join(', ') + '.',
      'Never invent items, prices, or offers that are not listed here.',
    ].join('\n');
  }

  // ---------------- rule engine ----------------
  function getHoursAreas(q) {
    if (/(hour|open|close|time|when)/i.test(q)) {
      return 'We are open 24 hours, every day — including Sundays and holidays. The ovens never sleep.';
    }
    if (/(deliver|area|where can|rayfield|bukuru|bassa|mangu|riyom|barkin)/i.test(q)) {
      return 'We deliver across ' + RT_AREAS.join(', ') + '. Pickup from ' + RT_ADDRESS + ' is available any time.';
    }
    if (/(address|location|where are you|find you|landmark|map)/i.test(q)) {
      return 'You will find us at ' + RT_ADDRESS + '. Pickup is available around the clock.';
    }
    return null;
  }

  function getMenu(q) {
    if (!/(menu|what do you (have|bake|sell)|cakes|cupcake|snack|food|jollof|pizza|burger|pasta|meat pie)/i.test(q)) return null;
    var catHit = null;
    Object.keys(RT_CATEGORIES).forEach(function (k) {
      if (new RegExp(k, 'i').test(q) || new RegExp(RT_CATEGORIES[k], 'i').test(q)) catHit = k;
    });
    if (/(jollof|pasta|pizza|burger|chicken|salad|rice)/i.test(q)) catHit = 'kitchen';
    var items = RT.getMenu().filter(function (c) { return !catHit || c.category === catHit; });
    var top = items.slice(0, 6).map(function (c) {
      return c.name + ' from ' + (c.price_from === null ? 'custom quote' : RT.naira(c.price_from));
    });
    return 'From our menu: ' + top.join('; ') +
      (items.length > 6 ? ' — see the full list on the Menu page.' : '.');
  }

  function getQuote(q) {
    var ql = q.toLowerCase();
    var hit = RT.getMenu().filter(function (c) {
      return c.name.toLowerCase().split(' ').some(function (w) { return w.length > 3 && ql.indexOf(w) !== -1; });
    })[0];
    if (hit) {
      var p = hit.price_from === null ? 'custom quote' : RT.naira(hit.price_from);
      return hit.name + ' starts at ' + p + ' — final price depends on size, flavour and design. Tap Order Now and we will confirm fast.';
    }
    if (/(tier|wedding|three|3-tier|big cake|how much|price|cost|budget)/i.test(q)) {
      return 'Celebration cakes start from ₦15,000 and scale with size, tiers and design. Tell us the date and guest count on the order form and we will send an exact quote.';
    }
    return null;
  }

  function build_order(q) {
    if (!/(order|buy|get|place|book|reserve|want)/i.test(q)) return null;
    if (/(class|apprentice)/i.test(q)) return null;
    var msg = 'Happy to get that started! Tap "Order Now" for the full form (Cake Studio + box builder included), or keep chatting here and we will finish it on WhatsApp.';
    return { text: msg, wa: 'Hello Relish Torte! I would like to order: ' + q };
  }

  function ruleAnswer(q) {
    var text =
      getHoursAreas(q) ||
      getMenu(q) ||
      getQuote(q);
    if (text) return { text: text };

    var order = build_order(q);
    if (order) return order;

    if (/(cater|event|party|owambe|wedding|burial|corporate)/i.test(q)) {
      return { text: 'We cater events across Jos — small chops, jollof, pasta, chicken, salads and full dessert tables. Tell us your date and guest count and we will price it up quickly.', wa: 'Hello Relish Torte! I need catering: ' };
    }
    if (/(class|apprentice|learn|teach|student|kids|baking course)/i.test(q)) {
      return { text: 'We run hands-on apprenticeship programs: ' + RT_PROGRAMS.map(function (p) { return p.name + ' — ' + (p.price || 'TBC'); }).join('; ') + '. A kids holiday camp is coming soon. Check "Learn With Us" on the home page.', wa: 'Hello Relish Torte! I am interested in a baking class/apprenticeship.' };
    }
    if (/(review|testimonial|rating)/i.test(q)) {
      return { text: 'Our customers say it best — read them on the Reviews page, and you can add yours too. We are trusted for birthdays, weddings and office treats across Jos.' };
    }
    if (/(phone|number|call|contact|whatsapp|reach)/i.test(q)) {
      return { text: 'Call or WhatsApp ' + RT_PHONE_DISPLAY + ' — we answer day and night. You can also DM ' + RT_INSTAGRAM_HANDLE + ' on Instagram.', wa: 'Hello Relish Torte!' };
    }
    if (/(hi|hello|hey|good (morning|afternoon|evening)|how far)/i.test(q) && q.length < 30) {
      return { text: 'Hello! Welcome to Relish Torte — ask me anything: menu, prices, delivery areas, or I can help you start an order.' };
    }
    if (/(vegan|gluten|allerg|nut|halal)/i.test(q)) {
      return { text: 'We bake to order, so tell us about allergies or dietary needs in the order notes — we will advise honestly on what we can do.' };
    }
    return {
      text: 'I can help with menu, prices, delivery areas, hours, catering and classes. For anything specific, WhatsApp ' + RT_PHONE_DISPLAY + ' — a human replies in minutes.',
      wa: 'Hello Relish Torte! I need help: ',
    };
  }

  // ---------------- Groq ----------------
  function groqAsk() {
    var key = CFG.GROQ_KEY;
    if (CFG.proxyMode && CFG.proxyUrl) {
      return fetch(CFG.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: session.messages }),
      }).then(function (r) { return r.json(); }).then(extractText);
    }
    if (!key || key.indexOf('gsk_') !== 0) return Promise.reject(new Error('no key'));
    return fetch(CFG.GROQ_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: CFG.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: 0.5,
        max_tokens: 400,
        messages: session.messages,
      }),
    }).then(function (r) {
      if (!r.ok) throw new Error('groq ' + r.status);
      return r.json();
    }).then(extractText);
  }

  function extractText(data) {
    var t = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!t) throw new Error('empty');
    return t.trim();
  }

  function ask(userText) {
    if (!session.messages.length) session.messages.push({ role: 'system', content: systemPrompt() });
    session.messages.push({ role: 'user', content: userText });
    if (session.messages.length > 11) session.messages.splice(1, 1);
    return groqAsk().catch(function () {
      var r = ruleAnswer(userText);
      session.messages.push({ role: 'assistant', content: r.text });
      return Promise.resolve(r);
    }).then(function (res) {
      if (typeof res === 'string') {
        session.messages.push({ role: 'assistant', content: res });
        return { text: res };
      }
      return res;
    });
  }

  // ---------------- panel UI ----------------
  var aiPanel, aiBackdrop, aiScroll, built = false;

  function buildAi() {
    if (built) return;
    built = true;
    aiBackdrop = document.createElement('div');
    aiBackdrop.className = 'panel-backdrop';
    aiBackdrop.id = 'aiBackdrop';
    aiPanel = document.createElement('aside');
    aiPanel.className = 'side-panel ai-panel';
    aiPanel.id = 'aiPanel';
    aiPanel.setAttribute('role', 'dialog');
    aiPanel.setAttribute('aria-modal', 'true');
    aiPanel.setAttribute('aria-label', 'Ask Torte — AI assistant');
    var aiLive = (CFG.proxyMode && CFG.proxyUrl) || (CFG.GROQ_KEY && CFG.GROQ_KEY.indexOf('gsk_') === 0);
    aiPanel.innerHTML =
      '<div class="panel-top">' +
        '<span class="panel-kicker">Ask Torte · AI concierge <span class="ai-status' + (aiLive ? ' on' : '') + '">' + (aiLive ? 'AI live' : 'menu brain') + '</span></span>' +
        '<button class="panel-close" data-ai-close aria-label="Close assistant">✕</button>' +
      '</div>' +
      '<div class="panel-scroll" id="aiScroll">' +
        '<div class="ai-msg bot">Hello — I am Torte. I know the full menu, prices, delivery areas and our baking programs. What can I help you find?</div>' +
        '<div class="ai-chips" id="aiChips">' +
          '<button class="tab-pill" type="button">What cakes do you have?</button>' +
          '<button class="tab-pill" type="button">How much is a birthday cake?</button>' +
          '<button class="tab-pill" type="button">Do you deliver to Rayfield?</button>' +
          '<button class="tab-pill" type="button">Are you open now?</button>' +
          '<button class="tab-pill" type="button">I want to place an order</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel-foot">' +
        '<form class="ai-foot" id="aiForm">' +
          '<input class="input" id="aiInput" autocomplete="off" placeholder="Ask about cakes, prices, delivery…" aria-label="Message">' +
          '<button class="ai-send" type="submit" aria-label="Send">' +
            '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
          '</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(aiBackdrop);
    document.body.appendChild(aiPanel);
    aiScroll = $('#aiScroll');

    $('[data-ai-close]', aiPanel).addEventListener('click', closeAi);
    aiBackdrop.addEventListener('click', closeAi);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && aiPanel.classList.contains('on')) closeAi();
    });
    $$('#aiChips .tab-pill').forEach(function (b) {
      b.addEventListener('click', function () { send(b.textContent); });
    });
    $('#aiForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('#aiInput').value.trim();
      if (!v) return;
      $('#aiInput').value = '';
      send(v);
    });
  }

  function openAi() {
    buildAi();
    aiBackdrop.classList.add('on');
    aiPanel.classList.add('on');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $('#aiInput') && $('#aiInput').focus(); }, 350);
  }
  function closeAi() {
    aiBackdrop.classList.remove('on');
    aiPanel.classList.remove('on');
    document.body.style.overflow = '';
  }

  function scrollDown() {
    aiScroll.scrollTop = aiScroll.scrollHeight;
  }

  function addMsg(text, who) {
    var el = document.createElement('div');
    el.className = 'ai-msg ' + who;
    el.textContent = text;
    aiScroll.insertBefore(el, $('#aiChips'));
    scrollDown();
    return el;
  }

  function addWaBtn(waText) {
    var wrap = document.createElement('div');
    wrap.style.alignSelf = 'flex-start';
    wrap.style.paddingLeft = '4px';
    var a = document.createElement('a');
    a.className = 'btn btn-gold btn-sm';
    a.href = RT.waLink(waText || 'Hello Relish Torte!');
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.textContent = 'Continue on WhatsApp';
    wrap.appendChild(a);
    aiScroll.insertBefore(wrap, $('#aiChips'));
    scrollDown();
  }

  function typewriter(el, text, done) {
    if (reduceMotion) { el.textContent = text; scrollDown(); if (done) done(); return; }
    var i = 0;
    el.textContent = '';
    var t = setInterval(function () {
      i += 2;
      el.textContent = text.slice(0, i);
      scrollDown();
      if (i >= text.length) { clearInterval(t); if (done) done(); }
    }, CFG.TYPING_SPEED_MS || 14);
  }

  function send(text) {
    if (session.count >= (CFG.MAX_MESSAGES_PER_SESSION || 40)) {
      addMsg('You have reached the chat limit for this visit — WhatsApp ' + RT_PHONE_DISPLAY + ' and a human will take over from here.', 'bot');
      addWaBtn('Hello Relish Torte! (chat limit reached, please continue here)');
      return;
    }
    var now = Date.now();
    if (now - session.lastSent < (CFG.MIN_MESSAGE_GAP_MS || 2000)) {
      addMsg('Give me a second to think…', 'bot');
      return;
    }
    session.lastSent = now;
    session.count++;

    var chips = $('#aiChips');
    if (chips) chips.remove();

    addMsg(text, 'me');
    var typing = document.createElement('div');
    typing.className = 'ai-msg bot typing';
    typing.innerHTML = '<i></i><i></i><i></i>';
    aiScroll.insertBefore(typing, null);
    scrollDown();

    ask(text).then(function (res) {
      typing.remove();
      var el = addMsg('', 'bot');
      typewriter(el, res.text, function () {
        if (res.wa) addWaBtn(res.wa);
      });
    }).catch(function () {
      typing.remove();
      addMsg('I could not reach the kitchen brain just now — WhatsApp ' + RT_PHONE_DISPLAY + ' and we will answer in a flash.', 'bot');
    });
  }

  // ---------------- page helpers ----------------
  function describeCake(spec) {
    if (!CFG.GROQ_KEY || CFG.GROQ_KEY.indexOf('gsk_') !== 0 || CFG.proxyMode) {
      return Promise.reject(new Error('no key'));
    }
    return fetch(CFG.GROQ_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + CFG.GROQ_KEY },
      body: JSON.stringify({
        model: CFG.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 120,
        messages: [
          { role: 'system', content: 'You are "Torte", a bakery copywriter for Relish Torte, Jos. In one single sentence (max 40 words), describe the cake the customer designed, in warm appetising language. No emoji, no lists, just the sentence.' },
          { role: 'user', content: spec },
        ],
      }),
    }).then(function (r) {
      if (!r.ok) throw new Error('groq ' + r.status);
      return r.json();
    }).then(extractText);
  }

  function weekInReview() {
    var orders = RT.getOrders();
    var weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    var recent = orders.filter(function (o) { return o.createdAt >= weekAgo; });
    var byStatus = { new: 0, confirmed: 0, delivered: 0, cancelled: 0 };
    orders.forEach(function (o) { if (byStatus[o.status] !== undefined) byStatus[o.status]++; });
    var items = {};
    recent.forEach(function (o) {
      var k = o.item || o.type || 'Custom';
      items[k] = (items[k] || 0) + 1;
    });
    var top = Object.keys(items).sort(function (a, b) { return items[b] - items[a]; }).slice(0, 3);
    var pendingReviews = (RT.getLocalReviews ? RT.getLocalReviews() : []).filter(function (r) { return r.approved === false || r.approved === undefined; });

    var line = recent.length
      ? 'This week: ' + recent.length + ' order request' + (recent.length === 1 ? '' : 's') +
        (top.length ? ' — top asks: ' + top.join(', ') : '') +
        '. Overall: ' + byStatus.new + ' new, ' + byStatus.confirmed + ' confirmed, ' + byStatus.delivered + ' delivered, ' + byStatus.cancelled + ' cancelled.'
      : 'No new orders in the last 7 days — a good moment to post a fresh special on Instagram.';

    if (!CFG.GROQ_KEY || CFG.GROQ_KEY.indexOf('gsk_') !== 0 || CFG.proxyMode) {
      return Promise.resolve(line + ' ' + pendingReviews.length + ' review(s) waiting for approval.');
    }
    return fetch(CFG.GROQ_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + CFG.GROQ_KEY },
      body: JSON.stringify({
        model: CFG.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: 0.4,
        max_tokens: 120,
        messages: [
          { role: 'system', content: 'You are a bakery manager writing a 2-sentence week-in-review for the owner of Relish Torte (Jos). Friendly, factual, no emoji.' },
          { role: 'user', content: line + ' Pending reviews: ' + pendingReviews.length },
        ],
      }),
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(extractText).catch(function () { return line; });
  }

  // ---------------- init ----------------
  document.addEventListener('DOMContentLoaded', function () {
    var fab = $('#aiFab');
    if (fab) fab.addEventListener('click', openAi);
    try {
      var first = sessionStorage.getItem('rt_ai_greeted');
      if (!first && fab) {
        sessionStorage.setItem('rt_ai_greeted', '1');
        fab.style.animation = 'pulse 2s ease-out 3';
      }
    } catch (e) { /* private mode */ }
  });

  window.RTAI = {
    open: openAi,
    close: closeAi,
    ask: function (q) { buildAi(); return ask(q); },
    get_menu: getMenu,
    get_quote: getQuote,
    get_hours_areas: getHoursAreas,
    build_order: build_order,
    describeCake: describeCake,
    weekInReview: weekInReview,
    systemPrompt: systemPrompt,
  };
})();
