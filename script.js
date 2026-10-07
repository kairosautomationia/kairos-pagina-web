// ========================================
// KAIROS · Interacciones de la landing
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Menú móvil ---
    var navToggle = document.getElementById('nav-toggle');
    var navLinks = document.getElementById('nav-links');

    function setMenu(open) {
        navToggle.classList.toggle('active', open);
        navLinks.classList.toggle('active', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        document.body.classList.toggle('menu-open', open);
    }

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function () { setMenu(!navLinks.classList.contains('active')); });
        navLinks.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { setMenu(false); });
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    }

    // --- Revelado al hacer scroll ---
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        revealEls.forEach(function (el, i) {
            el.style.transitionDelay = (i % 3) * 80 + 'ms';
            io.observe(el);
        });
    } else {
        revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    // --- Enlace activo + riel del proceso (un solo listener de scroll) ---
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
    var navItems = document.querySelectorAll('.nav-links a[href^="#"]');
    var timeline = document.getElementById('process-timeline');
    var railFill = document.getElementById('rail-fill');
    var steps = timeline ? timeline.querySelectorAll('.process-step') : [];
    var ticking = false;

    function onScroll() {
        var y = window.pageYOffset + window.innerHeight * 0.35;
        var current = '';
        sections.forEach(function (s) { if (y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) current = s.id; });
        navItems.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + current); });

        if (timeline && railFill) {
            var rect = timeline.getBoundingClientRect();
            var progress = (window.innerHeight * 0.6 - rect.top) / rect.height;
            progress = Math.max(0, Math.min(1, progress));
            railFill.style.height = progress * 100 + '%';
            steps.forEach(function (step) {
                var r = step.getBoundingClientRect();
                step.classList.toggle('active', r.top < window.innerHeight * 0.6);
            });
        }
        ticking = false;
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // --- Hero: red de nodos en canvas ---
    var canvas = document.getElementById('hero-canvas');
    if (canvas && !reduceMotion) {
        var ctx = canvas.getContext('2d');
        var hero = canvas.parentElement;
        var w = 0, h = 0, dpr = 1, nodes = [], running = true;
        var LINK = 140;

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = hero.clientWidth; h = hero.clientHeight;
            canvas.width = w * dpr; canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var count = Math.round(Math.min(70, Math.max(24, (w * h) / 22000)));
            nodes = [];
            for (var i = 0; i < count; i++) {
                nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.4 + 0.6 });
            }
        }

        function frame() {
            if (!running) return;
            ctx.clearRect(0, 0, w, h);
            for (var i = 0; i < nodes.length; i++) {
                var a = nodes[i];
                a.x += a.vx; a.y += a.vy;
                if (a.x < 0 || a.x > w) a.vx *= -1;
                if (a.y < 0 || a.y > h) a.vy *= -1;
                for (var j = i + 1; j < nodes.length; j++) {
                    var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
                    if (d < LINK * LINK) {
                        ctx.strokeStyle = 'rgba(34,211,238,' + (0.16 * (1 - Math.sqrt(d) / LINK)) + ')';
                        ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    }
                }
                ctx.fillStyle = 'rgba(103,232,249,0.55)';
                ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
            }
            requestAnimationFrame(frame);
        }

        resize();
        window.addEventListener('resize', resize);
        // Pausa cuando el hero no está visible
        new IntersectionObserver(function (entries) {
            var visible = entries[0].isIntersecting;
            if (visible && !running) { running = true; requestAnimationFrame(frame); }
            running = visible;
        }).observe(hero);
        requestAnimationFrame(frame);
    }
});
