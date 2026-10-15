// ========================================
// KAIROS · Interacciones de la landing
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    var navbar = document.getElementById('navbar');

    // --- Menú móvil ---
    var navToggle = document.getElementById('nav-toggle');
    var navLinks = document.getElementById('nav-links');

    function setMenu(open) {
        navToggle.classList.toggle('active', open);
        navLinks.classList.toggle('active', open);
        navbar.classList.toggle('menu-active', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        document.body.classList.toggle('menu-open', open);
    }

    if (navToggle && navLinks && navbar) {
        navToggle.addEventListener('click', function () { setMenu(!navLinks.classList.contains('active')); });
        navLinks.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { setMenu(false); });
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    }

    // --- La barra pasa de noche a día cuando el hero sale de la vista ---
    var hero = document.getElementById('inicio');
    if (hero && navbar && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            navbar.classList.toggle('on-day', !entries[0].isIntersecting);
        }, { rootMargin: '-' + navbar.offsetHeight + 'px 0px 0px 0px', threshold: 0 }).observe(hero);
    } else if (navbar) {
        navbar.classList.add('on-day');
    }

    // --- Enlace activo según la sección visible ---
    var navItems = document.querySelectorAll('.nav-links a[href^="#"]');
    var sections = document.querySelectorAll('main section[id]');
    if ('IntersectionObserver' in window) {
        var secObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navItems.forEach(function (a) {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
        sections.forEach(function (s) { secObs.observe(s); });
    }

    // --- Pasos del proceso: se encienden al llegar a ellos ---
    var steps = document.querySelectorAll('.step');
    if ('IntersectionObserver' in window) {
        var stepObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) entry.target.classList.add('active');
            });
        }, { rootMargin: '0px 0px -35% 0px', threshold: 0 });
        steps.forEach(function (s) { stepObs.observe(s); });
    } else {
        steps.forEach(function (s) { s.classList.add('active'); });
    }

    // --- Cinta diagonal de esquina a esquina en las tarjetas "en construcción" ---
    var cards = document.querySelectorAll('.service-card.soon');
    function fitTapes() {
        cards.forEach(function (card) {
            var tape = card.querySelector('.construction-tape');
            if (!tape) return;
            var w = card.clientWidth, h = card.clientHeight;
            tape.style.setProperty('--tape-len', Math.ceil(Math.hypot(w, h) + 60) + 'px');
            tape.style.setProperty('--tape-angle', (-Math.atan2(h, w) * 180 / Math.PI).toFixed(2) + 'deg');
        });
    }
    fitTapes();
    window.addEventListener('load', fitTapes);
    if ('ResizeObserver' in window) {
        cards.forEach(function (c) { new ResizeObserver(fitTapes).observe(c); });
    } else {
        window.addEventListener('resize', fitTapes);
    }
});
