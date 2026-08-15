(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- масштабирование холста ---------- */

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

  /* ---------- пословное появление заголовков ---------- */

  // Каждое слово оборачивается в маску с внутренним span, который выезжает снизу.
  // Обход рекурсивный, чтобы сохранить <br> и вложенные span'ы с их стилями.
  function splitWords(root) {
    var words = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var mask = document.createElement('span');
            mask.className = 'word';
            var inner = document.createElement('span');
            inner.textContent = part;
            mask.appendChild(inner);
            frag.appendChild(mask);
            words.push(inner);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(root);
    return words;
  }

  function prepareHeadline(el, step) {
    if (!el || reduced) return;
    splitWords(el).forEach(function (word, i) {
      word.style.setProperty('--d', (i * (step || 60)) + 'ms');
    });
    el.setAttribute('data-words', '');
  }

  function playHeadline(el) {
    if (el) el.classList.add('is-typed');
  }

  /* ---------- первый экран: анимация загрузки ---------- */

  function prepareIntro() {
    var hero = document.querySelector('section[data-screen-label]');
    if (!hero) return function () {};

    var headline = hero.querySelector('h1');
    prepareHeadline(headline, 70);

    // Текстовые блоки первого экрана — обёртки, поэтому анимируем их содержимое,
    // иначе весь столбец всплывал бы одним куском.
    var targets = [];
    [].slice.call(hero.children).forEach(function (child) {
      var kids = [].slice.call(child.children);
      if (child.tagName === 'DIV' && kids.length > 1 && !child.classList.contains('social-rail')) {
        targets = targets.concat(kids);
      } else {
        targets.push(child);
      }
    });
    targets = targets.filter(function (el) { return el !== headline; });

    if (reduced) return function () {};

    targets.forEach(function (el, i) {
      el.setAttribute('data-reveal', '');
      el.style.setProperty('--d', Math.min(i, 10) * 70 + 'ms');
    });

    return function () {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      playHeadline(headline);
    };
  }

  /* ---------- появление при скролле ---------- */

  function initScrollReveal() {
    var sections = [].slice.call(document.querySelectorAll('section[data-screen-label]')).slice(1);
    var headlines = [];
    var targets = [];
    var seen = new Set();

    sections.forEach(function (section) {
      var h = section.querySelector(':scope > h2');
      if (h) { prepareHeadline(h, 45); headlines.push(h); }
      [].slice.call(section.children).forEach(function (el) {
        if (el === h || seen.has(el)) return;
        seen.add(el);
        targets.push(el);
      });
    });

    [].slice.call(document.querySelectorAll('[data-reveal-group]')).forEach(function (group) {
      [].slice.call(group.children).forEach(function (el) {
        if (seen.has(el)) return;
        seen.add(el);
        targets.push(el);
      });
    });

    if (reduced) { headlines.forEach(playHeadline); return; }

    targets.forEach(function (el) {
      el.setAttribute('data-reveal', '');
      var siblings = [].slice.call(el.parentNode.children);
      el.style.setProperty('--d', Math.min(siblings.indexOf(el), 6) * 60 + 'ms');
    });

    var show = function (el) {
      el.classList.add('is-in');
      if (el.hasAttribute('data-words')) playHeadline(el);
    };
    var watched = targets.concat(headlines);

    if (!('IntersectionObserver' in window)) {
      watched.forEach(show);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.04 });

    watched.forEach(function (el) { io.observe(el); });

    // Страховка: если что-то так и не попало в наблюдатель, показываем принудительно.
    setTimeout(function () { watched.forEach(show); }, 8000);
  }

  /* ---------- индикатор прокрутки ---------- */

  function initScrollProgress() {
    var bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    var ticking = false;
    var update = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = 'scaleX(' + progress + ')';
      bar.classList.toggle('is-active', window.scrollY > 8);
    };
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ---------- запуск ---------- */

  var startIntro = prepareIntro();
  initScrollReveal();
  initScrollProgress();

  var started = false;
  function start() {
    if (started) return;
    started = true;
    fitStage();
    var veil = document.querySelector('.page-veil');
    if (veil) {
      veil.classList.add('is-gone');
      setTimeout(function () { if (veil.parentNode) veil.parentNode.removeChild(veil); }, 700);
    }
    requestAnimationFrame(startIntro);
  }

  // Ждём шрифт: иначе слова заголовка успевают переехать до подмены Poppins.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    window.addEventListener('load', start);
  }
  setTimeout(start, 1500);

  /* ---------- плавный переход по якорям ---------- */

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var sec = id && document.getElementById(id);
    if (!sec) return;
    e.preventDefault();
    var top = sec.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    document.querySelectorAll('nav a[href^="#"]').forEach(function (l) {
      l.style.color = l === a ? '#fff' : '#A9A9A9';
    });
    if (reduced) return;
    sec.style.animation = 'none';
    void sec.offsetWidth;
    sec.style.animation = 'sectionPulse 420ms cubic-bezier(.22,.61,.36,1) both';
  });
})();
