(() => {
    'use strict';

    const navbar = document.querySelector('#navbar');
    const menuToggle = document.querySelector('#nav-toggle');
    const menu = document.querySelector('#nav-links');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function updateNavbar() {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 18);
    }

    function closeMenu() {
        if (!menu || !menuToggle) return;
        menu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menú');
    }

    if (menu && menuToggle) {
        menuToggle.addEventListener('click', () => {
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', String(!expanded));
            menuToggle.setAttribute('aria-label', expanded ? 'Abrir menú' : 'Cerrar menú');
            menu.classList.toggle('active', !expanded);
        });
        menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeMenu();
        });
        document.addEventListener('click', (event) => {
            if (menuToggle.getAttribute('aria-expanded') === 'true' && !menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
        });
    }

    let scrollPending = false;
    window.addEventListener('scroll', () => {
        if (scrollPending) return;
        scrollPending = true;
        window.requestAnimationFrame(() => {
            updateNavbar();
            scrollPending = false;
        });
    }, { passive: true });
    updateNavbar();

    const revealItems = document.querySelectorAll('.section-index, .about-main > *, .service-card, .case-copy > *, .case-visual, .process-intro > *, .process-step, .cta-content > *');
    if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
        document.documentElement.classList.add('reveal-ready');
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('reveal', 'is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
        revealItems.forEach((item) => revealObserver.observe(item));
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const id = link.getAttribute('href');
            if (!id || id === '#') return;
            const target = document.querySelector(id);
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
            if (history.replaceState) history.replaceState(null, '', id);
        });
    });
})();
