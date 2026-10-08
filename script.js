/* Nora Hammer – behaviour: page views, scrolling, reveal effects. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement, body = document.body;
  root.classList.add('js');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var baseTitle = document.title;
  var main = document.querySelector('.site-main > .column');
  var sections = Array.prototype.slice.call(main.querySelectorAll(':scope > section'));
  var locked = false;

  /* ---------- scrolling: 750ms ease-in-out cubic ---------- */
  function ease(t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; }
  function scrollToTop(mode) {
    if (mode === 'instant') { window.scrollTo(0, 0); return; }
    var start = Date.now(), from = window.scrollY, duration = 750;
    (function step() {
      var t = Date.now() - start;
      if (t >= duration) { window.scroll(0, 0); return; }
      window.scroll(0, from + (0 - from) * ease(t / duration));
      requestAnimationFrame(step);
    })();
  }

  /* ---------- views: #name shows <section id="name-section"> ---------- */
  function hashName() {
    var h = location.hash ? location.hash.substring(1) : null;
    if (!h) return null;
    if (h.length > 0 && !/^[a-zA-Z]/.test(h)) h = 'x' + h;
    return h.toLowerCase();
  }
  function sectionFor(h) {
    if (h && !/^[a-zA-Z0-9\-]+$/.test(h)) h = null;
    return document.getElementById((h || 'home') + '-section');
  }
  function activate(section) {
    if (!section.classList.contains('inactive')) { scrollToTop('smooth'); return; }
    locked = true;
    if (location.hash === '#home') history.replaceState(null, null, '#');
    var current = main.querySelector(':scope > section:not(.inactive)');
    var currentHeight = current ? current.offsetHeight : 0;
    if (current) {
      current.classList.add('inactive');
      document.title = baseTitle;
      setTimeout(function () { current.style.display = 'none'; current.classList.remove('active'); }, 250);
    }
    if (section.dataset.title) document.title = section.dataset.title + ' - ' + baseTitle;
    setTimeout(function () {
      section.style.display = '';
      window.dispatchEvent(new Event('resize'));
      scrollToTop('instant');
      var height = section.offsetHeight;
      if (height > currentHeight) { section.style.maxHeight = currentHeight + 'px'; section.style.minHeight = '0'; }
      else { section.style.maxHeight = ''; section.style.minHeight = currentHeight + 'px'; }
      setTimeout(function () {
        section.classList.remove('inactive');
        section.classList.add('active');
        section.style.minHeight = height + 'px';
        section.style.maxHeight = height + 'px';
        setTimeout(function () {
          section.style.transition = 'none';
          section.style.minHeight = '';
          section.style.maxHeight = '';
          setTimeout(function () { section.style.transition = ''; locked = false; }, 75);
        }, 500 + 250);
      }, 75);
    }, 250);
  }

  var initial = sectionFor(hashName());
  if (!initial) { initial = document.getElementById('home-section'); history.replaceState(undefined, undefined, '#'); }
  sections.forEach(function (s) { if (s !== initial) { s.className = 'inactive'; s.style.display = 'none'; } });
  initial.classList.add('active');
  if (initial.dataset.title) document.title = initial.dataset.title + ' - ' + baseTitle;
  scrollToTop('instant');

  window.addEventListener('hashchange', function () {
    if (locked) return;
    var h = hashName();
    if (h && !/^[a-zA-Z0-9\-]+$/.test(h)) return;
    var section = sectionFor(h);
    if (!section) { section = document.getElementById('home-section'); history.replaceState(undefined, undefined, '#'); }
    activate(section);
  });

  /* A link to the hash that is already in the URL scrolls to the top again. */
  document.addEventListener('click', function (event) {
    var a = event.target.closest && event.target.closest('a');
    if (!a || a.getAttribute('href') === null || a.getAttribute('href').charAt(0) !== '#') return;
    if (a.hash === window.location.hash) {
      event.preventDefault();
      history.replaceState(undefined, undefined, '#');
      location.replace(a.hash);
    }
  });

  /* ---------- page fade-in once everything is loaded ---------- */
  window.addEventListener('load', function () {
    setTimeout(function () { body.classList.remove('is-loading'); }, 100);
  });

  /* ---------- images: fade in as they load ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.frame img[loading="lazy"]'), function (img) {
    img.style.opacity = 0;
    var show = function () { img.style.opacity = 1; };
    if (img.complete && img.naturalWidth) show(); else img.addEventListener('load', show);
  });

  /* ---------- reveal on scroll: buttons slide down, photos fade in (once) ---------- */
  var items = [];
  Array.prototype.forEach.call(document.querySelectorAll('.buttons, .photo'), function (el) {
    el.classList.add(el.classList.contains('buttons') ? 'reveal-buttons' : 'reveal-photo');
    items.push({ el: el, trigger: el.closest('.in') || el });
  });
  function inView(trigger) {
    if (trigger.offsetParent === null) return false;
    var height = document.documentElement.clientHeight,
        top = document.documentElement.scrollTop, bottom = top + height,
        pad = height * .25, vTop = top + pad, vBottom = bottom - pad,
        box = trigger.getBoundingClientRect(),
        eTop = top + Math.floor(box.top), eBottom = eTop + box.height;
    if (Math.floor(top) <= pad) vTop = top;
    if (Math.ceil(bottom) >= document.body.scrollHeight - pad) vBottom = bottom;
    if (vBottom - vTop >= eBottom - eTop)
      return (eTop >= vTop && eBottom <= vBottom) || (eTop >= vTop && eTop <= vBottom) || (eBottom >= vTop && eBottom <= vBottom);
    return (vTop >= eTop && vBottom <= eBottom) || (eTop >= vTop && eTop <= vBottom) || (eBottom >= vTop && eBottom <= vBottom);
  }
  function check() {
    items = items.filter(function (item) {
      if (!inView(item.trigger)) return true;
      item.el.classList.add('in-view');
      setTimeout(function () { item.el.classList.remove('reveal-buttons', 'reveal-photo', 'in-view'); }, 1500);
      return false;
    });
  }
  ['load', 'resize', 'scroll'].forEach(function (name) { window.addEventListener(name, check); });
  check();
})();
