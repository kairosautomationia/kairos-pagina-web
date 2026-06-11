// ========================================
// KAIROS LANDING PAGE - JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // Mobile Menu Toggle
    // ========================================
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Close menu when clicking a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }
    
    // ========================================
    // Navbar scroll effect
    // ========================================
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // ========================================
    // Smooth scroll for anchor links
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const navHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ========================================
    // Scroll Animations (Intersection Observer)
    // ========================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Elements to animate
    const animateElements = document.querySelectorAll(
        '.service-card, .niche-card, .edu-card, .diff-card, .pricing-card, .result-card, .step-content'
    );
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
    
    // CSS class for animated elements
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
    
    // ========================================
    // Parallax effect for hero particles
    // ========================================
    const particles = document.getElementById('particles');
    if (particles) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            particles.style.transform = `translateY(${scrolled * 0.3}px)`;
        });
    }
    
    // ========================================
    // Active nav link based on scroll position
    // ========================================
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a[href^="#"]');
    
    window.addEventListener('scroll', function() {
        let current = '';
        const scrollPosition = window.pageYOffset + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + current) {
                item.classList.add('active');
            }
        });
    });
    
    // ========================================
    // WhatsApp dynamic link
    // ========================================
    const whatsappCtas = document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"], .nav-cta, .btn-primary');
    
    // Make phone number configurable
    const whatsappNumber = '593XXXXXXXXX'; // Replace with actual number
    
    whatsappCtas.forEach(link => {
        if (link.href && link.href.includes('wa.me')) {
            // Keep original href or update with configured number
            // link.href = `https://wa.me/${whatsappNumber}?text=Hola%20KAIROS!%20Quiero%20mi%20diagnostico%20gratis`;
        }
    });
    
    // ========================================
    // Process timeline step reveal
    // ========================================
    const processSteps = document.querySelectorAll('.process-step');
    
    const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
                stepObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    processSteps.forEach((step, index) => {
        step.style.opacity = '0';
        step.style.transform = 'translateY(30px)';
        step.style.transition = `opacity 0.5s ease-out ${index * 0.15}s, transform 0.5s ease-out ${index * 0.15}s`;
        stepObserver.observe(step);
    });
    
    // ========================================
    // Ripple effect on button clicks
    // ========================================
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                border-radius: 50%;
                background: rgba(255,255,255,0.3);
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add ripple animation CSS
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyle);
    
    // ========================================
    // Lazy loading for images
    // ========================================
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // ========================================
    // Console message
    // ========================================
    console.log('%c KAIROS ', 'background: linear-gradient(135deg, #a855f7, #06b6d4); color: white; font-size: 20px; padding: 10px 20px; border-radius: 10px;');
    console.log('Automation · IA · Ecuador');
    
});

// ========================================
// Reusable Utility Functions
// ========================================

// Global state for the multi-step form
let currentFormStep = 1;

function changeStep(direction) {
    const form = document.getElementById('multiStepForm');
    if (!form) return;

    // Validation: Check if required fields in the current step are filled
    if (direction === 1) {
        const currentStepEl = document.querySelector(`.form-step[data-step="${currentFormStep}"]`);
        const inputs = currentStepEl.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value) {
                input.style.borderColor = 'rgba(255, 0, 0, 0.5)';
                isValid = false;
            } else {
                input.style.borderColor = 'rgba(255,255,255,0.1)';
            }
        });

        if (!isValid) return;
    }

    // Update Step
    currentFormStep += direction;
    if (currentFormStep < 1) currentFormStep = 1;
    if (currentFormStep > 3) currentFormStep = 3;

    // Update DOM
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === currentFormStep) {
            step.classList.add('active');
        }
    });

    // Update Progress Dots
    const dots = document.querySelectorAll('.progress-dots .dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentFormStep - 1);
    });

    // Update Progress Text
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `Paso ${currentFormStep} de 3`;
    }
}

const KAIROS = {
    // Scroll to element smoothly
    scrollTo: function(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Open WhatsApp with pre-filled message
    openWhatsApp: function(number, message) {
        const encodedMessage = encodeURIComponent(message || 'Hola KAIROS! Quiero mi diagnóstico gratis');
        windowP.open(`https://wa.me/${number}?text=${encodedMessage}`, '_blank');
    },

    // Track custom events (for analytics)
    trackEvent: function(eventName, eventData) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        console.log('Event tracked:', eventName, eventData);
    },

    // Form submission handler
    handleForm: function(formId, callback) {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                if (callback) callback(data);
            });
        }
    }
};

// Expose KAIROS object globally
window.KAIROS = KAIROS;
