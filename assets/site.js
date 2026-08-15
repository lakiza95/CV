(function () {
  'use strict';

  function fitStage() {
    var stage = document.querySelector('.stage');
    var canvas = document.querySelector('.canvas');
    if (!stage || !canvas) return;
    canvas.style.transform = '';
    canvas.style.margin = '';
    var natural = canvas.getBoundingClientRect().height;
    // clientWidth, not innerWidth: excludes the scrollbar, so the canvas never overflows.
    var scale = (document.documentElement.clientWidth || window.innerWidth) / 1440;
    if (scale === 1) {
      stage.style.height = '';
      return;
    }
    // transform-origin is top left, so the auto margins must go or the canvas drifts right.
    canvas.style.margin = '0';
    canvas.style.transform = 'scale(' + scale + ')';
    stage.style.height = (natural * scale) + 'px';
  }

  var resizeRaf = null;
  window.addEventListener('resize', function () {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(function () { resizeRaf = null; fitStage(); });
  }, { passive: true });
  window.addEventListener('load', fitStage);
  fitStage();

  function initReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ease = 'cubic-bezier(.22,.61,.36,1)';
    var groups = [].slice.call(document.querySelectorAll('section[data-screen-label]'))
      .concat([].slice.call(document.querySelectorAll('section > div[data-reveal-group]')))
      .concat([].slice.call(document.querySelectorAll('section > div > div[data-reveal-group]')));
    var seen = new Set();
    var targets = [];
    groups.forEach(function (g) {
      [].slice.call(g.children).forEach(function (el, i) {
        if (seen.has(el) || !(el instanceof HTMLElement)) return;
        if (getComputedStyle(el).position === 'fixed') return;
        seen.add(el);
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        el.style.transition = 'opacity 420ms ' + ease + ', transform 420ms ' + ease;
        el.style.transitionDelay = Math.min(i, 6) * 40 + 'ms';
        targets.push(el);
      });
    });
    var show = function (el) { el.style.opacity = '1'; el.style.transform = 'none'; };
    var pending = new Set(targets);
    var onScroll = null;
    var sweep = function () {
      pending.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight - 40 && r.bottom > 0) { show(el); pending.delete(el); }
      });
      if (!pending.size && onScroll) {
        window.removeEventListener('scroll', onScroll);
        onScroll = null;
      }
    };
    var ticking = false;
    onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; sweep(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    sweep();
    setTimeout(function () { pending.forEach(show); pending.clear(); }, 6000);
  }

  requestAnimationFrame(function () { requestAnimationFrame(initReveal); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var sec = id && document.getElementById(id);
    if (!sec) return;
    e.preventDefault();
    var top = sec.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: top, behavior: 'smooth' });
    document.querySelectorAll('nav a[href^="#"]').forEach(function (l) {
      l.style.color = l === a ? '#fff' : '#A9A9A9';
    });
    sec.style.animation = 'none';
    void sec.offsetWidth;
    sec.style.animation = 'sectionPulse 420ms cubic-bezier(.22,.61,.36,1) both';
  });
})();
