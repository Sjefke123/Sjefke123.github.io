/* ==========================================================================
   Three small things: the theme toggle, fade-in on scroll, and highlighting
   the current section in the table of contents. No dependencies.
   ========================================================================== */

(function () {
  'use strict';

  /* --- Theme ------------------------------------------------------------ */

  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var toggleLabel = document.getElementById('theme-toggle-label');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function storedTheme() {
    try {
      var value = localStorage.getItem('theme');
      return value === 'light' || value === 'dark' ? value : null;
    } catch (e) {
      return null; // private mode, or storage disabled
    }
  }

  function activeTheme() {
    return storedTheme() || (systemDark.matches ? 'dark' : 'light');
  }

  var LABELS = {
    light: { text: 'licht',  aria: 'Wissel naar het lichte thema' },
    dark:  { text: 'donker', aria: 'Wissel naar het donkere thema' }
  };

  // The button shows the theme you'd get by pressing it, not the current one.
  function syncToggle() {
    if (!toggle) return;
    var next = LABELS[activeTheme() === 'dark' ? 'light' : 'dark'];
    toggleLabel.textContent = next.text;
    toggle.setAttribute('aria-label', next.aria);
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // Not being able to remember the choice isn't worth failing over.
    }
    syncToggle();
  }

  if (toggle) {
    syncToggle();
    toggle.addEventListener('click', function () {
      setTheme(activeTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // Follow the system if the visitor has never pressed the button.
  var onSystemChange = function () {
    if (!storedTheme()) syncToggle();
  };
  if (systemDark.addEventListener) {
    systemDark.addEventListener('change', onSystemChange);
  } else if (systemDark.addListener) {
    systemDark.addListener(onSystemChange); // older Safari
  }

  /* --- Fade in on scroll ------------------------------------------------ */

  var revealables = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    // No observer: show everything and move on.
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target); // runs once per section
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(revealables, function (el) {
      revealObserver.observe(el);
    });
  }

  /* --- Current section in the contents list ----------------------------- */

  var tocLinks = document.querySelectorAll('.toc__list a[href^="#"]');

  if (tocLinks.length && 'IntersectionObserver' in window) {
    var linkFor = {};
    var sections = [];

    Array.prototype.forEach.call(tocLinks, function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      linkFor[id] = link;
      sections.push(section);
    });

    var visible = [];

    function markCurrent() {
      Array.prototype.forEach.call(tocLinks, function (link) {
        link.classList.remove('is-current');
      });
      if (!visible.length) return;
      // Topmost section still on screen wins.
      var top = visible.reduce(function (a, b) {
        return a.offsetTop <= b.offsetTop ? a : b;
      });
      var link = linkFor[top.id];
      if (link) link.classList.add('is-current');
    }

    var tocObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var index = visible.indexOf(entry.target);
        if (entry.isIntersecting && index === -1) {
          visible.push(entry.target);
        } else if (!entry.isIntersecting && index !== -1) {
          visible.splice(index, 1);
        }
      });
      markCurrent();
    }, { rootMargin: '-20% 0px -60% 0px' });

    sections.forEach(function (section) {
      tocObserver.observe(section);
    });
  }
})();
