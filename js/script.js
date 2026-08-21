const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealElements = document.querySelectorAll('.reveal');

if (reducedMotion) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
} else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

    revealElements.forEach((element, index) => {
        element.style.transitionDelay = `${Math.min(index % 3, 2) * 90}ms`;
        revealObserver.observe(element);
    });
}

const cursorGlow = document.querySelector('.cursor-glow');

if (cursorGlow && window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
    window.addEventListener('pointermove', (event) => {
        cursorGlow.style.opacity = '1';
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', () => {
        cursorGlow.style.opacity = '0';
    });
}

const heroVisual = document.querySelector('.hero-visual');

if (heroVisual && !reducedMotion) {
    window.addEventListener('scroll', () => {
        const offset = Math.min(window.scrollY * 0.08, 70);
        heroVisual.style.backgroundPosition = `center calc(50% + ${offset}px)`;
    }, { passive: true });
}
