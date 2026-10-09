// Relish Torte — engagement layer: likes, ratings, hero carousel, post-order survey
(function () {
  'use strict';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---------- likes ----------
  function wireLikes(root) {
    $$('[data-like]', root).forEach(function (btn) {
      if (btn.__likedWired) return;
      btn.__likedWired = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var slug = btn.getAttribute('data-like');
        var res = window.RT.toggleLike(slug);
        btn.classList.toggle('liked', res.liked);
        btn.setAttribute('aria-pressed', res.liked ? 'true' : 'false');
        var svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', res.liked ? 'currentColor' : 'none');
        var countEl = btn.querySelector('[data-like-count]');
        if (res.count > 0) {
          if (!countEl) {
            countEl = document.createElement('span');
            countEl.setAttribute('data-like-count', '');
            btn.appendChild(countEl);
          }
          countEl.textContent = String(res.count);
        } else if (countEl) {
          countEl.remove();
        }
        btn.classList.remove('pop');
        void btn.offsetWidth;
        btn.classList.add('pop');
      });
    });
  }

  // ---------- star ratings ----------
  function starsMarkup(slug, mine) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out +=
        '<button type="button" class="st' + (i <= mine ? ' on' : '') + '" data-star="' + i +
        '" aria-label="Rate ' + i + ' out of 5" style="background:none;border:0;padding:0">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z"/></svg>' +
        '</button>';
    }
    return out;
  }

  function paintRatingRow(row) {
    var slug = row.getAttribute('data-rate');
    var st = window.RT.ratingState();
    var mine = st.mine[slug] || 0;
    row.innerHTML = starsMarkup(slug, mine);
    row.classList.add('rate-stars');
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Rate this product');

    var hoverWrap = function () {
      $$('.st', row).forEach(function (s) {
        s.classList.toggle('hot', Number(s.getAttribute('data-star')) <= hoverVal && Number(s.getAttribute('data-star')) > mine);
      });
    };
    var hoverVal = 0;
    $$('.st', row).forEach(function (s) {
      var v = Number(s.getAttribute('data-star'));
      s.addEventListener('mouseenter', function () { hoverVal = v; hoverWrap(); });
      s.addEventListener('mouseleave', function () { hoverVal = 0; hoverWrap(); });
      s.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        // read the slug at click time: the page may set data-rate after first paint
        window.RT.submitRating(row.getAttribute('data-rate'), v);
        paintRatingRow(row);
        var note = document.createElement('span');
        note.className = 'rate-thanks';
        note.textContent = 'Thanks! Pending approval.';
        var host = row.parentElement;
        if (host) {
          var old = host.querySelector('.rate-thanks');
          if (old) old.remove();
          host.appendChild(note);
        }
      });
    });
  }

  function wireRatings(root) {
    $$('[data-rate]', root).forEach(function (row) {
      if (row.__rateWired) return;
      row.__rateWired = true;
      paintRatingRow(row);
    });
  }

  // ---------- hero carousel ----------
  function buildHero() {
    var media = $('.hero-media');
    if (!media) return;
    var slides = $$('.slide', media);
    if (slides.length < 2) return;
    var hero = media.closest('.hero');
    if (!hero) return;
    var dotsHost = $('.hero-dots', hero);
    if (!dotsHost) {
      dotsHost = document.createElement('div');
      dotsHost.className = 'hero-dots';
      dotsHost.setAttribute('aria-label', 'Hero slides');
      hero.appendChild(dotsHost);
    }
    dotsHost.innerHTML = slides
      .map(function (_, i) {
        return '<button type="button" class="hero-dot' + (i === 0 ? ' on' : '') + '" data-slide="' + i + '" aria-label="Go to slide ' + (i + 1) + '"></button>';
      })
      .join('');

    var idx = 0;
    var timer = null;
    var show = function (n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
      $$('.hero-dot', dotsHost).forEach(function (d, i) { d.classList.toggle('on', i === idx); });
    };
    dotsHost.addEventListener('click', function (e) {
      var b = e.target.closest('[data-slide]');
      if (!b) return;
      show(Number(b.getAttribute('data-slide')));
      restart();
    });
    var restart = function () {
      if (timer) clearInterval(timer);
      if (!reducedMotion()) timer = setInterval(function () { show(idx + 1); }, 5200);
    };
    restart();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (timer) clearInterval(timer); timer = null; }
      else restart();
    });
  }

  // ---------- post-order survey ----------
  function showSurvey(ref) {
    var s = $('#surveyCard');
    if (!s) return;
    s.classList.remove('hidden');
    if (ref) {
      var refEl = $('#surveyRef');
      if (refEl) refEl.textContent = ref;
    }
    s.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
  }

  function wireSurvey() {
    var form = $('#surveyForm');
    if (!form) return;
    var answers = { overall: 0, taste: '', packaging: '', delivery: '' };

    $$('.survey-chips', form).forEach(function (group) {
      var field = group.getAttribute('data-field');
      group.addEventListener('click', function (e) {
        var chip = e.target.closest('.sc, .st');
        if (!chip) return;
        var val = chip.getAttribute('data-val');
        if (field === 'overall') {
          answers.overall = Number(val) || 0;
          $$('.st', group).forEach(function (s, i) { s.classList.toggle('on', i < answers.overall); });
          $$('.sc', group).forEach(function (c) { c.classList.remove('on'); });
        } else {
          $$('.sc', group).forEach(function (c) { c.classList.remove('on'); });
          chip.classList.add('on');
          answers[field] = val;
        }
        var err = $('#surveyErr');
        if (err && answers.overall) err.classList.add('hidden');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!answers.overall) {
        var err = $('#surveyErr');
        if (err) {
          err.textContent = 'Pick an overall star rating first.';
          err.classList.remove('hidden');
        }
        return;
      }
      var note = ($('#surveyNote') || {}).value || '';
      window.RT.saveFeedback({
        ref: ($('#surveyRef') || {}).textContent || '',
        overall: answers.overall,
        taste: answers.taste,
        packaging: answers.packaging,
        delivery: answers.delivery,
        note: note.slice(0, 500),
      });
      form.classList.add('hidden');
      var thanks = $('#surveyThanks');
      if (thanks) thanks.classList.remove('hidden');
    });
  }

  // ---------- boot ----------
  function init() {
    wireLikes(document);
    wireRatings(document);
    buildHero();
    wireSurvey();
  }

  window.RTEngage = {
    init: init,
    showSurvey: showSurvey,
    wireLikes: wireLikes,
    wireRatings: wireRatings,
  };

  document.addEventListener('DOMContentLoaded', init);
})();
