(function () {
  'use strict';

  var html = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  var header = document.querySelector('.hdr');
  var onScroll = function () {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function initHeroMotion() {
    if (!window.gsap || !window.ScrollTrigger || reduceMotion.matches) return;
    html.classList.add('gsap-motion');
    gsap.registerPlugin(ScrollTrigger);

    var lines = gsap.utils.toArray('.hero__line > span');
    gsap.set(lines, { y: 0, yPercent: 110, opacity: 0 });
    gsap.to(lines, {
      y: 0,
      yPercent: 0,
      opacity: 1,
      duration: 0.95,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: '.hero', start: 'top 82%', once: true }
    });

    gsap.to('.plan', {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.7 }
    });
  }

  var reveal = function () {
    initHeroMotion();
    html.classList.add('is-ready');
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  };
  if (document.fonts && document.fonts.ready) {
    var fontTimer = window.setTimeout(reveal, 600);
    document.fonts.ready.then(function () {
      window.clearTimeout(fontTimer);
      reveal();
    });
  } else {
    reveal();
  }

  var menu = document.getElementById('menu');
  var openButton = document.getElementById('menu-open');
  var closeButton = document.getElementById('menu-close');

  var pageChrome = [document.querySelector('main'), document.querySelector('footer'), document.querySelector('.hdr')];

  var focusables = function () {
    return Array.prototype.slice.call(menu.querySelectorAll('a[href], button:not([disabled])'));
  };
  var setMenu = function (open) {
    var focusWasInside = menu.contains(document.activeElement);
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    pageChrome.forEach(function (el) {
      if (el) el.inert = open;
    });
    openButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
    if (open) {
      closeButton.focus();
    } else if (focusWasInside) {
      openButton.focus({ preventScroll: true });
    }
  };

  openButton.addEventListener('click', function () {
    setMenu(true);
  });
  closeButton.addEventListener('click', function () {
    setMenu(false);
  });
  menu.querySelectorAll('a[href]').forEach(function (link) {
    link.addEventListener('click', function () {
      setMenu(false);
    });
  });
  document.addEventListener('keydown', function (event) {
    if (!menu.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      setMenu(false);
      return;
    }
    if (event.key !== 'Tab') return;
    var items = focusables();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) {
      el.classList.add('is-in');
    });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.classList.add('is-in');
      } else {
        el.classList.add('will-reveal');
        observer.observe(el);
      }
    });
  }

  var magnet = document.querySelector('[data-magnet]');
  if (magnet && finePointer.matches && !reduceMotion.matches) {
    var setMagnet = function (x, y) {
      magnet.style.setProperty('--mg-x', x.toFixed(1) + 'px');
      magnet.style.setProperty('--mg-y', y.toFixed(1) + 'px');
    };
    magnet.addEventListener('pointermove', function (event) {
      var rect = magnet.getBoundingClientRect();
      var x = (event.clientX - rect.left - rect.width / 2) / rect.width;
      var y = (event.clientY - rect.top - rect.height / 2) / rect.height;
      setMagnet(x * 7, y * 5);
    });
    magnet.addEventListener('pointerleave', function () {
      setMagnet(0, 0);
    });
  }

  var tilt = document.querySelector('[data-tilt]');
  if (tilt && finePointer.matches && !reduceMotion.matches) {
    var plate = tilt.querySelector('.plan__plate');
    tilt.addEventListener('pointermove', function (event) {
      var rect = tilt.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      plate.style.setProperty('--ry', (x * 2.4).toFixed(2) + 'deg');
      plate.style.setProperty('--rx', (-y * 2.4).toFixed(2) + 'deg');
    });
    tilt.addEventListener('pointerleave', function () {
      plate.style.setProperty('--rx', '0deg');
      plate.style.setProperty('--ry', '0deg');
    });
  }

  var form = document.getElementById('lead-form');
  var success = document.getElementById('form-success');
  var submit = document.getElementById('submit');
  var reset = document.getElementById('success-reset');

  var fields = {
    name: {
      input: document.getElementById('name'),
      test: function (value) {
        return value.trim().length >= 2;
      }
    },
    phone: {
      input: document.getElementById('phone'),
      test: function (value) {
        var digits = value.replace(/\D/g, '');
        if (digits.length === 11) return digits[0] === '7' || digits[0] === '8';
        if (digits.length === 10) return digits[0] === '9';
        return false;
      }
    }
  };

  var setInvalid = function (input, invalid) {
    var wrapper = input.closest('.field') || input.closest('.consent');
    if (wrapper) wrapper.classList.toggle('is-invalid', invalid);
    input.setAttribute('aria-invalid', String(invalid));
  };

  Object.keys(fields).forEach(function (key) {
    var input = fields[key].input;
    input.addEventListener('input', function () {
      setInvalid(input, false);
    });
  });

  var consent = document.getElementById('consent');
  consent.addEventListener('change', function () {
    setInvalid(consent, false);
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var firstInvalid = null;

    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      var invalid = !field.test(field.input.value);
      setInvalid(field.input, invalid);
      if (invalid && !firstInvalid) firstInvalid = field.input;
    });

    var consentInvalid = !consent.checked;
    setInvalid(consent, consentInvalid);
    if (consentInvalid && !firstInvalid) firstInvalid = consent;

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Отправляем…';

    // Бэкенда нет: показываем состояние успеха после валидации, заявка никуда не уходит.
    window.setTimeout(function () {
      form.hidden = true;
      success.hidden = false;
      success.focus({ preventScroll: true });
    }, 700);
  });

  reset.addEventListener('click', function () {
    form.reset();
    form.hidden = false;
    success.hidden = true;
    submit.disabled = false;
    submit.textContent = 'Отправить заявку';
    document.querySelectorAll('.is-invalid').forEach(function (el) {
      el.classList.remove('is-invalid');
    });
    document.getElementById('name').focus();
  });

  var dialog = document.getElementById('privacy');
  document.querySelectorAll('[data-open-privacy]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.body.classList.add('is-locked');
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    });
  });
  document.querySelectorAll('[data-close-privacy]').forEach(function (button) {
    button.addEventListener('click', function () {
      dialog.close();
    });
  });
  dialog.addEventListener('close', function () {
    document.body.classList.remove('is-locked');
  });
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
