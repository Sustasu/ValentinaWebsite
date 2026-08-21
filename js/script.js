const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const introScreen = document.querySelector('.intro-screen');
const introLetters = document.querySelectorAll('.intro-name span:not(.name-gap)');
const flowArrow = document.querySelector('.flow-arrow');
const flowArrowLine = document.querySelector('.flow-arrow-line');
const flowArrowHead = document.querySelector('.flow-arrow-head');
const arrowSource = document.querySelector('.letter-l');
const heroSection = document.querySelector('.hero');
const heroIntro = document.querySelector('.hero-intro');
const heroProof = document.querySelector('.hero-proof');
const projectsSection = document.querySelector('.projects');
const projectTiles = document.querySelectorAll('.project-tile');
const contactSection = document.querySelector('.contact');
const revealElements = document.querySelectorAll('.reveal');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
let renderedScrollY = window.scrollY;
let scrollRaf = null;
let targetCursorClientY = null;
let renderedCursorClientY = null;
let horizontalGlide = null;
let completedHorizontalGlideId = null;

function getArrowHeadPath(x, y, size, direction) {
    if (direction === 'right') {
        return `M ${x - size * .35} ${y - size} L ${x - size * .35} ${y + size} L ${x + size * 1.15} ${y} Z`;
    }

    if (direction === 'left') {
        return `M ${x + size * .35} ${y - size} L ${x + size * .35} ${y + size} L ${x - size * 1.15} ${y} Z`;
    }

    return `M ${x - size} ${y - size * .35} L ${x + size} ${y - size * .35} L ${x} ${y + size * 1.15} Z`;
}

function point(x, y) {
    return { x, y };
}

function rectInDocument(element) {
    const rect = element.getBoundingClientRect();
    return {
        left: rect.left + window.scrollX,
        right: rect.right + window.scrollX,
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
        width: rect.width,
        height: rect.height,
    };
}

function addWaypoint(points, nextPoint) {
    const lastPoint = points[points.length - 1];
    if (!lastPoint || Math.abs(lastPoint.x - nextPoint.x) > .5 || Math.abs(lastPoint.y - nextPoint.y) > .5) {
        points.push(nextPoint);
    }
}

function getPageSideX(section, sectionRect) {
    const textElement = section.querySelector('h1, h2, h3, p, a');
    const textRect = textElement ? rectInDocument(textElement) : sectionRect;
    const textCenter = textRect.left + textRect.width / 2;
    const sectionCenter = sectionRect.left + sectionRect.width / 2;
    const inset = clamp(window.innerWidth * .045, 28, 72);
    return textCenter <= sectionCenter ? sectionRect.left + inset : sectionRect.right - inset;
}

function getTileSeamX(tile) {
    const media = tile.querySelector('.project-media');
    if (!media || window.innerWidth <= 980) {
        const tileRect = rectInDocument(tile);
        return getPageSideX(tile, tileRect);
    }

    const mediaRect = rectInDocument(media);
    return mediaRect.right;
}

function getSnakeRoute(sourceX, sourceY) {
    const points = [point(sourceX, sourceY)];
    const introRect = rectInDocument(introScreen);
    const heroRect = rectInDocument(heroSection);
    const heroIntroRect = heroIntro ? rectInDocument(heroIntro) : heroRect;
    const heroProofRect = heroProof ? rectInDocument(heroProof) : null;
    const projectsRect = projectsSection ? rectInDocument(projectsSection) : null;
    const contactRect = contactSection ? rectInDocument(contactSection) : null;
    const heroSplitX = window.innerWidth > 980 ? heroRect.left + heroRect.width * .52 : getPageSideX(heroSection, heroRect);

    addWaypoint(points, point(sourceX, introRect.bottom));
    addWaypoint(points, point(heroSplitX, introRect.bottom));
    addWaypoint(points, point(heroSplitX, heroIntroRect.bottom));

    if (heroProofRect) {
        const proofSplitX = window.innerWidth > 980 ? heroProofRect.left + heroProofRect.width / 2 : getPageSideX(heroProof, heroProofRect);
        addWaypoint(points, point(proofSplitX, heroProofRect.top));
        addWaypoint(points, point(proofSplitX, heroProofRect.bottom));
    }

    if (projectsRect) {
        const projectsSideX = getPageSideX(projectsSection, projectsRect);
        addWaypoint(points, point(projectsSideX, projectsRect.top));
    }

    projectTiles.forEach((tile, index) => {
        const tileRect = rectInDocument(tile);
        const seamX = getTileSeamX(tile);

        if (index === 0) {
            const lastPoint = points[points.length - 1];
            addWaypoint(points, point(lastPoint.x, tileRect.top));
            addWaypoint(points, point(seamX, tileRect.top));
        }

        addWaypoint(points, point(seamX, tileRect.top));
        addWaypoint(points, point(seamX, tileRect.bottom));

        if (index === projectTiles.length - 1 && contactSection) {
            const contactRect = rectInDocument(contactSection);
            const contactSideX = getPageSideX(contactSection, contactRect);
            addWaypoint(points, point(contactSideX, tileRect.bottom));
        }
    });

    if (contactRect) {
        const contactSideX = getPageSideX(contactSection, contactRect);
        const contactText = contactSection.querySelector('a');
        const contactTextRect = contactText ? rectInDocument(contactText) : contactRect;
        const stopY = Math.max(contactRect.top + 90, contactTextRect.top - clamp(window.innerHeight * .06, 42, 72));
        const lastPoint = points[points.length - 1];
        addWaypoint(points, point(lastPoint.x, contactRect.top));
        addWaypoint(points, point(contactSideX, stopY));
    }

    return points;
}

function getRouteLength(points) {
    return points.reduce((total, currentPoint, index) => {
        if (index === 0) return total;
        const previousPoint = points[index - 1];
        return total + Math.hypot(currentPoint.x - previousPoint.x, currentPoint.y - previousPoint.y);
    }, 0);
}

function getPointAtLength(points, targetLength) {
    let travelled = 0;

    for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1];
        const end = points[index];
        const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);

        if (travelled + segmentLength >= targetLength) {
            const progress = segmentLength === 0 ? 1 : (targetLength - travelled) / segmentLength;
            const x = start.x + (end.x - start.x) * progress;
            const y = start.y + (end.y - start.y) * progress;
            const direction = Math.abs(end.x - start.x) > Math.abs(end.y - start.y)
                ? (end.x >= start.x ? 'right' : 'left')
                : 'down';
            return { x, y, direction };
        }

        travelled += segmentLength;
    }

    const lastPoint = points[points.length - 1];
    return { x: lastPoint.x, y: lastPoint.y, direction: 'down' };
}

function getPathToLength(points, targetLength) {
    let travelled = 0;
    const visiblePoints = [points[0]];

    for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1];
        const end = points[index];
        const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);

        if (travelled + segmentLength >= targetLength) {
            const progress = segmentLength === 0 ? 1 : (targetLength - travelled) / segmentLength;
            visiblePoints.push(point(start.x + (end.x - start.x) * progress, start.y + (end.y - start.y) * progress));
            break;
        }

        visiblePoints.push(end);
        travelled += segmentLength;
    }

    return visiblePoints.map((routePoint, index) => {
        const command = index === 0 ? 'M' : 'L';
        return `${command} ${routePoint.x} ${routePoint.y}`;
    }).join(' ');
}

function findHorizontalGlide(points, pageY) {
    let travelled = 0;

    for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1];
        const end = points[index];
        const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);
        const isHorizontal = Math.abs(end.x - start.x) > Math.abs(end.y - start.y);

        if (isHorizontal && pageY >= end.y) {
            return {
                id: `${index}:${Math.round(start.x)}:${Math.round(start.y)}:${Math.round(end.x)}:${Math.round(end.y)}`,
                startLength: travelled,
                endLength: travelled + segmentLength,
                duration: clamp(segmentLength * 1.15, 360, 900),
            };
        }

        if (!isHorizontal) {
            const maxY = Math.max(start.y, end.y);
            if (pageY <= maxY) return null;
        }

        travelled += segmentLength;
    }

    return null;
}

function getLengthForPageY(points, pageY) {
    let travelled = 0;

    for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1];
        const end = points[index];
        const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);
        const isHorizontal = Math.abs(end.x - start.x) > Math.abs(end.y - start.y);

        if (isHorizontal) {
            if (pageY <= end.y) {
                return travelled;
            }

            travelled += segmentLength;
            continue;
        } else {
            const minY = Math.min(start.y, end.y);
            const maxY = Math.max(start.y, end.y);

            if (pageY <= maxY) {
                const progress = clamp((pageY - minY) / Math.max(maxY - minY, 1), 0, 1);
                return travelled + segmentLength * progress;
            }
        }

        travelled += segmentLength;
    }

    return travelled;
}

function updateLandingArrow(scrollY = renderedScrollY) {
    if (!introScreen || !flowArrow || !flowArrowLine || !flowArrowHead || !arrowSource || !heroSection) return;

    flowArrow.style.setProperty('--flow-arrow-height', `${document.documentElement.scrollHeight}px`);

    const sourceRect = arrowSource.getBoundingClientRect();
    const introHeight = introScreen.offsetHeight || window.innerHeight;
    const sourceX = sourceRect.left + window.scrollX + sourceRect.width / 2;
    const sourceY = sourceRect.bottom + window.scrollY + sourceRect.height * .12;
    const scrollProgress = clamp(scrollY / introHeight, 0, 1);
    const easedProgress = easeOutCubic(scrollProgress);
    const route = getSnakeRoute(sourceX, sourceY);
    const routeLength = getRouteLength(route);
    const fallbackPageY = sourceY + 70 + (scrollY + window.innerHeight - sourceY - 118) * easedProgress;
    const cursorPageY = renderedCursorClientY === null
        ? fallbackPageY
        : scrollY + renderedCursorClientY;
    let targetLength = clamp(getLengthForPageY(route, cursorPageY), 0, routeLength);
    const glideCandidate = findHorizontalGlide(route, cursorPageY);

    if (glideCandidate && glideCandidate.id !== completedHorizontalGlideId && (!horizontalGlide || horizontalGlide.id !== glideCandidate.id)) {
        horizontalGlide = { ...glideCandidate, startedAt: performance.now() };
        requestLandingArrowUpdate();
    }

    if (horizontalGlide) {
        const progress = clamp((performance.now() - horizontalGlide.startedAt) / horizontalGlide.duration, 0, 1);
        targetLength = horizontalGlide.startLength + (horizontalGlide.endLength - horizontalGlide.startLength) * easeOutCubic(progress);

        if (progress < 1) {
            requestLandingArrowUpdate();
        } else {
            completedHorizontalGlideId = horizontalGlide.id;
            horizontalGlide = null;
        }
    } else if (!glideCandidate) {
        completedHorizontalGlideId = null;
    }
    const head = getPointAtLength(route, targetLength);

    const headSize = clamp(window.innerWidth * .018, 13, 24);
    flowArrowLine.setAttribute('d', getPathToLength(route, targetLength));
    flowArrowHead.setAttribute('d', getArrowHeadPath(head.x, head.y, headSize, head.direction));
    document.body.classList.toggle('has-entered', scrollY > introHeight * .62);
}

function animateLandingArrow() {
    renderedScrollY = window.scrollY;
    const cursorDelta = targetCursorClientY === null || renderedCursorClientY === null ? 0 : targetCursorClientY - renderedCursorClientY;
    const easeAmount = reducedMotion ? 1 : .08;

    if (targetCursorClientY !== null) {
        renderedCursorClientY = renderedCursorClientY === null
            ? targetCursorClientY
            : renderedCursorClientY + cursorDelta * easeAmount;
    }

    if (targetCursorClientY !== null && Math.abs(cursorDelta) < .35) {
        renderedCursorClientY = targetCursorClientY;
    }

    updateLandingArrow(renderedScrollY);

    if (targetCursorClientY !== null && Math.abs(targetCursorClientY - renderedCursorClientY) > .35) {
        scrollRaf = window.requestAnimationFrame(animateLandingArrow);
    } else {
        scrollRaf = null;
    }
}

function requestLandingArrowUpdate() {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(animateLandingArrow);
}

function playIntro() {
    if (!introLetters.length || !flowArrow || !arrowSource) return;

    updateLandingArrow();

    if (reducedMotion) {
        introLetters.forEach((letter) => letter.classList.add('is-visible'));
        flowArrow.classList.add('is-live');
        updateLandingArrow();
        return;
    }

    introLetters.forEach((letter, index) => {
        window.setTimeout(() => {
            letter.classList.add('is-visible');
        }, index * 95);
    });

    window.setTimeout(() => {
        updateLandingArrow();
        flowArrow.classList.add('is-live');
    }, introLetters.length * 95 + 180);
}

if (document.fonts) {
    document.fonts.ready.then(playIntro);
} else {
    window.addEventListener('load', playIntro, { once: true });
}

window.addEventListener('scroll', () => {
    renderedScrollY = window.scrollY;
    updateLandingArrow(renderedScrollY);
}, { passive: true });
window.addEventListener('pointermove', (event) => {
    targetCursorClientY = event.clientY;
    requestLandingArrowUpdate();
}, { passive: true });
window.addEventListener('resize', () => {
    renderedScrollY = window.scrollY;
    updateLandingArrow(renderedScrollY);
});

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
        element.style.transitionDelay = `${Math.min(index % 4, 3) * 75}ms`;
        revealObserver.observe(element);
    });
}

document.querySelectorAll('.project-tile, .quick-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
        if (reducedMotion) return;
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - .5) * 8;
        const y = ((event.clientY - rect.top) / rect.height - .5) * -8;
        card.style.transform = `translateY(-4px) rotateX(${y}deg) rotateY(${x}deg)`;
    });

    card.addEventListener('pointerleave', () => {
        card.style.transform = '';
    });
});
