function handleTimelineAnimation() {
    const timeline = document.querySelector('.experience-timeline');
    const fill = document.querySelector('.timeline-fill');
    if (!timeline || !fill) return;

    const update = () => {
        const rect = timeline.getBoundingClientRect();
        const vh = window.innerHeight;
        const scrollStart = rect.top + window.scrollY - vh / 2;
        let progress = 0;
        if (window.scrollY > scrollStart) {
            progress = ((window.scrollY - scrollStart) / rect.height) * 100;
        }
        fill.style.height = `${Math.min(100, Math.max(0, progress))}%`;
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                update();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    update();
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        nav.classList.toggle('active');
    });

    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            nav.classList.remove('active');
        });
    });

    document.addEventListener('click', (event) => {
        if (!toggle.contains(event.target) && !nav.contains(event.target)) {
            toggle.classList.remove('active');
            nav.classList.remove('active');
        }
    });
}

function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const dismiss = () => {
        preloader.style.opacity = '0';
        preloader.style.pointerEvents = 'none';
        setTimeout(() => { preloader.style.display = 'none'; }, 200);
    };
    requestAnimationFrame(dismiss);
    window.addEventListener('load', dismiss, { once: true });
    setTimeout(dismiss, 1500);
}

function initCustomCursor() {
    const dot = document.querySelector('.cursor-dot');
    const outline = document.querySelector('.cursor-outline');
    if (!dot || !outline) return;
    const pointerFine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!pointerFine || reducedMotion) return;

    let mouseX = 0, mouseY = 0, outlineX = 0, outlineY = 0;
    let cursorVisible = true;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
    });

    (function animate() {
        if (!cursorVisible) {
            requestAnimationFrame(animate);
            return;
        }
        outlineX += 0.1 * (mouseX - outlineX);
        outlineY += 0.1 * (mouseY - outlineY);
        outline.style.left = outlineX + 'px';
        outline.style.top = outlineY + 'px';
        requestAnimationFrame(animate);
    })();

    document.addEventListener('visibilitychange', () => {
        cursorVisible = !document.hidden;
    }, { passive: true });

    document.querySelectorAll('a, button, .project-card-enhanced').forEach(el => {
        el.addEventListener('mouseenter', () => {
            dot.style.transform = 'translate(-50%, -50%) scale(1.5)';
            outline.style.transform = 'translate(-50%, -50%) scale(1.5)';
        });
        el.addEventListener('mouseleave', () => {
            dot.style.transform = 'translate(-50%, -50%) scale(1)';
            outline.style.transform = 'translate(-50%, -50%) scale(1)';
        });
    });
}

function initProgressCircle() {
    const wrap = document.querySelector('.progress-wrap');
    if (!wrap) return;

    const path = wrap.querySelector('path');
    if (path) {
        const totalLength = path.getTotalLength();
        path.style.transition = 'none';
        path.style.WebkitTransition = 'none';
        path.style.strokeDasharray = `${totalLength} ${totalLength}`;
        path.style.strokeDashoffset = totalLength;
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset 10ms linear';
        path.style.WebkitTransition = 'stroke-dashoffset 10ms linear';

        const updateProgress = () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            path.style.strokeDashoffset = totalLength - (scrollTop * totalLength / docHeight);
            wrap.classList.toggle('active-progress', scrollTop > 50);
        };

        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
    }

    wrap.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initProjectCards() {
    document.querySelectorAll('.project-card-enhanced').forEach(card => {
        const lift = () => {
            card.classList.add('is-card-active');
            card.style.transform = 'translateY(-12px) scale(1.02)';
        };
        const settle = () => {
            card.classList.remove('is-card-active', 'is-pressed');
            card.style.transform = 'translateY(0) scale(1)';
        };
        const press = () => {
            card.classList.add('is-pressed');
            card.style.transform = 'translateY(-4px) scale(0.992)';
        };

        card.addEventListener('mouseenter', function () {
            lift();
        });
        card.addEventListener('mouseleave', function () {
            settle();
        });
        card.addEventListener('pointerdown', function () {
            press();
        }, { passive: true });
        card.addEventListener('pointerup', function () {
            if (window.matchMedia && window.matchMedia('(hover: hover)').matches) lift();
            else settle();
        }, { passive: true });
        card.addEventListener('pointercancel', function () {
            settle();
        }, { passive: true });
        card.addEventListener('blur', function () {
            settle();
        });
        card.addEventListener('click', function (e) {
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

function initSmoothScrollAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function initScrollReveal() {
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.project-card-enhanced, .timeline-entry-container, .gh-pulse-card, .social-links a, .gpg-section').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.65s ease, transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transitionDelay = `${Math.min(index * 45, 360)}ms`;
        observer.observe(el);
    });
}

function initTouchPolish() {
    const targets = document.querySelectorAll('.social-links a, .gpg-action, .project-card-enhanced, .gh-pulse-list li');
    targets.forEach((el) => {
        el.addEventListener('pointerdown', () => {
            el.classList.add('is-pressed');
        }, { passive: true });
        ['pointerup', 'pointercancel', 'pointerleave', 'blur'].forEach((eventName) => {
            el.addEventListener(eventName, () => {
                el.classList.remove('is-pressed');
            }, { passive: true });
        });
    });
}

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateThemeIcon();
    }

    toggleTheme() {
        this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
    }

    updateThemeIcon() {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.setAttribute('aria-label', this.currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        }
    }

    init() {
        this.setTheme(this.currentTheme);
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.addEventListener('click', () => this.toggleTheme());
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            if (!this.getStoredTheme()) this.setTheme(e.matches ? 'light' : 'dark');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initPreloader();
    initCustomCursor();
    initProgressCircle();
    initProjectCards();
    initTouchPolish();
    initSmoothScrollAnchors();
    initScrollReveal();
    handleTimelineAnimation();
    new ThemeManager();

    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('nav ul');
    if (navToggle && navList) {
        navToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }

    if (window.AOS) AOS.init({ duration: 800, once: true, mirror: false });
});

const style = document.createElement('style');
// Highlight Active Link
function highlightActiveLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === 'index.html' && (href === './' || href === '/'))) {
            link.style.color = 'var(--primary-color)';
            link.style.fontWeight = '700';
        } else {
            link.style.color = '';
            link.style.fontWeight = '';
        }
    });
}

// Keyboard Help Modal
function toggleKeyboardHelp() {
    let modal = document.getElementById('keyboard-help-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'keyboard-help-modal';
        modal.className = 'keyboard-modal';
        modal.innerHTML = `
            <div class="keyboard-modal-content">
                <div class="modal-header">
                    <h3>Keyboard Shortcuts</h3>
                    <span class="close-modal" onclick="toggleKeyboardHelp()" style="position:static;">&times;</span>
                </div>
                <ul class="keyboard-shortcut-list">
                    <li><span>Home</span> <span class="key-badge">h</span></li>
                    <li><span>Portfolio</span> <span class="key-badge">p</span></li>
                    <li><span>Sites</span> <span class="key-badge">s</span></li>
                    <li><span>Blog</span> <span class="key-badge">b</span></li>
                    <li><span>Recommendations</span> <span class="key-badge">r</span></li>
                </ul>
                <p style="font-size: 0.8rem; opacity: 0.7; text-align: center; margin-top: 1rem;">Press any key to navigate</p>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) toggleKeyboardHelp();
        });
    }
    
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

// Run on load
document.addEventListener('DOMContentLoaded', highlightActiveLink);

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    const target = e.target;
    // Ignore if user is typing or editing content
    if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
    ) {
        return;
    }

    const key = e.key || '';

    // Close modal on Escape
    if (key === 'Escape') {
        const modal = document.getElementById('keyboard-help-modal');
        if (modal && modal.style.display === 'block') {
            toggleKeyboardHelp();
            return;
        }
    }

    if (key === '?' || (key === '/' && e.shiftKey)) {
        e.preventDefault();
        toggleKeyboardHelp();
        return;
    }

    switch(key.toLowerCase()) {
        case 'h':
            window.location.href = 'index.html';
            break;
        case 'p':
            window.location.href = 'portfolio.html';
            break;
        case 's':
            window.location.href = 'sites.html';
            break;
        case 'b':
            window.location.href = 'blog.html';
            break;
        case 'r':
            window.location.href = 'recommendations.html';
            break;
    }
});

function updateTime() {
    const now = new Date();
    const jordanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Amman"}));
    const timeString = jordanTime.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: "Asia/Amman"
    });
    const element = document.getElementById('header-time');
    if (element) {
        element.textContent = `${timeString} GMT+3`;
    }
}

function initProfileLightbox() {
    if (document.getElementById('pfp-lightbox')) return;

    const overlay = document.createElement('div');
    overlay.id = 'pfp-lightbox';
    overlay.className = 'pfp-lightbox';
    overlay.innerHTML = `
        <div class="pfp-lightbox__backdrop"></div>
        <div class="pfp-lightbox__content">
            <img alt="Profile photo enlarged" />
            <button class="pfp-lightbox__close" aria-label="Close photo">&times;</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const imgEl = overlay.querySelector('img');
    const close = () => overlay.classList.remove('is-visible');

    overlay.addEventListener('click', (e) => {
        if (
            e.target === overlay ||
            e.target.classList.contains('pfp-lightbox__backdrop') ||
            e.target.classList.contains('pfp-lightbox__close')
        ) {
            close();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('is-visible')) close();
    });

    document.querySelectorAll('.profile-picture').forEach((pic) => {
        pic.style.cursor = 'zoom-in';
        pic.addEventListener('click', () => {
            imgEl.src = pic.src;
            imgEl.alt = pic.alt || 'Profile photo';
            overlay.classList.add('is-visible');
        });
    });
}

// Initialize time display
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
});

// Initialize profile photo lightbox once DOM is ready
document.addEventListener('DOMContentLoaded', initProfileLightbox);

// Console Easter Egg
console.log(
    "%c Hello, Fellow Dev! %c\n\nIf you're looking at this, you probably like code too.\nFeel free to check out the source on GitHub: https://github.com/qusaismael/qusaismael.github.io\n\nStay secure! 🔒",
    "background: #2D1611; color: #F5F5DC; font-size: 24px; padding: 10px; border-radius: 5px; font-family: 'Recoleta', serif;",
    "color: #3C1810; font-size: 14px; font-family: monospace;"
);

function loadMediumPosts() {
    const postsContainer = document.getElementById('medium-posts');
    const recentContainer = document.getElementById('recent-medium-posts');

    const cta = {
        title: 'Read my latest on Medium ->',
        description: 'Loading… tap to open directly if slow.',
        url: 'https://medium.com/@qusaismael'
    };

    const renderCTA = (target) => {
        if (!target) return;
        target.innerHTML = '';
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';
        postElement.innerHTML = `
            <h3>${cta.title}</h3>
            <p class="post-date">Live feed loads after this section is visible</p>
            <p>${cta.description}</p>
        `;
        postElement.addEventListener('click', () => window.open(cta.url, '_blank', 'noopener'));
        target.appendChild(postElement);
    };

    const stripHtml = (html) => {
        const tmp = document.createElement('div');
        tmp.textContent = html;
        return tmp.innerHTML;
    };

    const plainText = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || '';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const buildPostCard = (post) => {
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';

        const h3 = document.createElement('h3');
        h3.textContent = post.title;

        const datePara = document.createElement('p');
        datePara.className = 'post-date';
        datePara.textContent = formatDate(post.pubDate);

        const descPara = document.createElement('p');
        descPara.textContent = plainText(post.description).substring(0, 150) + '...';

        postElement.appendChild(h3);
        postElement.appendChild(datePara);
        postElement.appendChild(descPara);
        postElement.addEventListener('click', () => showPostModal(post));
        return postElement;
    };

    const renderPosts = (items) => {
        if (postsContainer) {
            postsContainer.innerHTML = '';
            items.forEach(post => postsContainer.appendChild(buildPostCard(post)));
        }

        if (recentContainer) {
            recentContainer.innerHTML = '';
            items.slice(0, 2).forEach(post => recentContainer.appendChild(buildPostCard(post)));
        }
    };

    // Show immediate non-blocking CTA placeholders
    renderCTA(postsContainer);
    renderCTA(recentContainer);

    const startFetch = () => {
        if (loadMediumPosts.started) return;
        loadMediumPosts.started = true;

        const mediumUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://medium.com/feed/@qusaismael')}&_=${new Date().getTime()}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        fetch(mediumUrl, { signal: controller.signal })
            .then(response => response.json())
            .then(data => {
                if (!data || !data.items) return;
                renderPosts(data.items);
            })
            .catch(error => {
                console.error('Error loading Medium posts:', error);
            })
            .finally(() => clearTimeout(timeoutId));
    };

    const target = recentContainer || postsContainer;
    if ('IntersectionObserver' in window && target) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    obs.disconnect();
                    startFetch();
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        observer.observe(target);
    } else {
        if (document.readyState === 'complete') {
            startFetch();
        } else {
            window.addEventListener('load', startFetch, { once: true });
        }
    }
}

function sanitizeHtml(raw) {
    const ALLOWED_TAGS = new Set([
        'P', 'BR', 'B', 'I', 'EM', 'STRONG', 'A', 'UL', 'OL', 'LI',
        'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'CODE', 'PRE', 'IMG', 'FIGURE', 'FIGCAPTION'
    ]);
    const ALLOWED_ATTRS = { 'A': ['href', 'rel', 'target'], 'IMG': ['src', 'alt', 'width', 'height'] };

    const tmp = document.createElement('div');
    tmp.innerHTML = raw;
    const walk = (node) => {
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
            const child = node.childNodes[i];
            if (child.nodeType === Node.ELEMENT_NODE) {
                if (!ALLOWED_TAGS.has(child.tagName)) {
                    while (child.firstChild) node.insertBefore(child.firstChild, child);
                    node.removeChild(child);
                } else {
                    const allowed = ALLOWED_ATTRS[child.tagName] || [];
                    Array.from(child.attributes).forEach(attr => {
                        if (!allowed.includes(attr.name)) child.removeAttribute(attr.name);
                    });
                    if (child.tagName === 'A') {
                        child.setAttribute('rel', 'noopener noreferrer');
                        child.setAttribute('target', '_blank');
                        const href = child.getAttribute('href') || '';
                        if (!href.startsWith('http://') && !href.startsWith('https://')) {
                            child.removeAttribute('href');
                        }
                    }
                    if (child.tagName === 'IMG') {
                        const src = child.getAttribute('src') || '';
                        if (!src.startsWith('http://') && !src.startsWith('https://')) {
                            child.removeAttribute('src');
                        }
                    }
                    walk(child);
                }
            }
        }
    };
    walk(tmp);
    return tmp.innerHTML;
}

function showPostModal(post) {
    const modal = document.getElementById('post-modal');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = '';

    const h2 = document.createElement('h2');
    h2.textContent = post.title;

    const datePara = document.createElement('p');
    datePara.className = 'post-date';
    datePara.textContent = new Date(post.pubDate).toLocaleDateString();

    const descDiv = document.createElement('div');
    descDiv.innerHTML = sanitizeHtml(post.description || '');

    modalBody.appendChild(h2);
    modalBody.appendChild(datePara);
    modalBody.appendChild(descDiv);

    modal.style.display = 'block';

    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';

    const onOutsideClick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            window.removeEventListener('click', onOutsideClick);
        }
    };
    window.addEventListener('click', onOutsideClick);
}

style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(222, 94, 145, 0.3);
        transform: scale(0);
        animation: rippleEffect 0.6s linear;
        pointer-events: none;
    }
    @keyframes rippleEffect {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
document.addEventListener('DOMContentLoaded', loadMediumPosts);

const LAZY_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAD/ACw=';

function initLazyImages() {
    const images = Array.from(document.querySelectorAll('img.lazy-image'));
    if (!images.length) return;

    const loadImage = (img) => {
        if (img.dataset.loaded) return;
        const src = img.dataset.src;
        if (src) {
            img.src = src;
            img.dataset.loaded = 'true';
        }
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { rootMargin: '200px 0px', threshold: 0.01 });

        images.forEach(img => {
            if (img.dataset.src) observer.observe(img);
        });
    } else {
        images.forEach(loadImage);
    }
}

document.addEventListener('DOMContentLoaded', initLazyImages);


document.querySelectorAll('.project-card-enhanced').forEach(card => {
    const link = card.querySelector('.project-arrow');
    if (link) {
        card.addEventListener('click', () => {
            window.open(link.href, '_blank');
        });
    }
});

/* ==========================================================
   GitHub Activity Ticker + Desktop Terminal Easter Egg
   (dependency-free vanilla JS)
   ========================================================== */
(function () {
    const DEFAULT_GITHUB_USERNAME = 'qusaismael';
    const TICKER_CACHE_PREFIX = 'gh_activity_cache_v2_';
    const TICKER_CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
    const TICKER_FETCH_TIMEOUT_MS = 4500;
    const EVENTS_CACHE_PREFIX = 'gh_events_cache_v3_';
    const EVENTS_CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
    const HEATMAP_DAYS = 90;
    const FEED_LIMIT = 6;

    const TRIGGERED_KEY = 'terminal_easter_triggered_v1';
    const SCROLL_STAGES = [0.25, 0.55, 0.9];
    const MIN_STAGE_DURATION_MS = 1500; // avoid instant "scroll teleport"

    const nowMs = () => Date.now();
    const truncate = (s, max) => (typeof s === 'string' && s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s || '');
    const safeJSONParse = (str) => {
        try {
            return JSON.parse(str);
        } catch {
            return null;
        }
    };

    function getUsernameFromContainer(container) {
        return (container && (container.dataset.githubUsername || container.dataset.username)) || DEFAULT_GITHUB_USERNAME;
    }

    function repoShortName(fullRepo) {
        const s = typeof fullRepo === 'string' ? fullRepo : '';
        if (!s.includes('/')) return s || '';
        return s.split('/').pop() || s;
    }

    function renderTicker(container, activity) {
        if (!container) return;
        const textEl = container.querySelector('#gh-ticker-text') || container.querySelector('.gh-ticker-text');
        if (!textEl) return;

        // Clear previous children safely.
        while (textEl.firstChild) textEl.removeChild(textEl.firstChild);

        const kind = activity && activity.kind;
        if (kind === 'push') {
            const repoFull = activity.repoFull || '';
            const repo = repoShortName(repoFull);
            const msg = activity.commitMessage || 'Updates pushed';
            const timeText = activity.timeAgo || '';

            textEl.append('Latest commit in ');
            const repoLink = document.createElement('a');
            repoLink.href = repoFull ? ('https://github.com/' + repoFull) : 'https://github.com/';
            repoLink.target = '_blank';
            repoLink.rel = 'noopener noreferrer';
            repoLink.className = 'gh-ticker-repo';
            repoLink.textContent = repo || 'repository';
            textEl.appendChild(repoLink);
            textEl.append(': "');
            textEl.append(msg);
            textEl.append('"');
            if (timeText) textEl.append(' · ' + timeText);
        } else if (kind === 'pr_merged') {
            const repoFull = activity.repoFull || '';
            const repo = repoShortName(repoFull);
            const title = activity.prTitle || 'Merged PR';
            const timeText = activity.timeAgo || '';

            textEl.append('Merged PR in ');
            const repoLink = document.createElement('a');
            repoLink.href = repoFull ? ('https://github.com/' + repoFull) : 'https://github.com/';
            repoLink.target = '_blank';
            repoLink.rel = 'noopener noreferrer';
            repoLink.className = 'gh-ticker-repo';
            repoLink.textContent = repo || 'repository';
            textEl.appendChild(repoLink);
            textEl.append(': "');
            textEl.append(title);
            textEl.append('"');
            if (timeText) textEl.append(' · ' + timeText);
        } else {
            textEl.textContent = activity && activity.text ? activity.text : 'Consistently pushing code...';
        }
    }

    function setTickerFallback(container, message) {
        const textEl = container && (container.querySelector('#gh-ticker-text') || container.querySelector('.gh-ticker-text'));
        if (!textEl) return;
        textEl.textContent = message || 'Consistently pushing code...';
    }

    function readTickerCache(username) {
        const key = TICKER_CACHE_PREFIX + username;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = safeJSONParse(raw);
        if (!parsed || !parsed.activity) return null;
        return parsed;
    }

    function writeTickerCache(username, activity, expiresAt) {
        const key = TICKER_CACHE_PREFIX + username;
        localStorage.setItem(key, JSON.stringify({ expiresAt: expiresAt, activity: activity }));
    }

    function formatTimeAgo(isoString) {
        if (!isoString) return '';
        const t = new Date(isoString);
        const diffMs = nowMs() - t.getTime();
        if (!Number.isFinite(diffMs)) return '';
        const minutes = Math.round(diffMs / 60000);
        if (minutes <= 0) return 'just now';
        if (minutes === 1) return '1 minute ago';
        if (minutes < 60) return minutes + ' minutes ago';
        const hours = Math.round(minutes / 60);
        if (hours === 1) return '1 hour ago';
        if (hours < 24) return hours + ' hours ago';
        const days = Math.round(hours / 24);
        return days + (days === 1 ? ' day ago' : ' days ago');
    }

    async function fetchLatestGitHubActivity(username) {
        const url = 'https://api.github.com/users/' + encodeURIComponent(username) + '/events/public?per_page=30';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TICKER_FETCH_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'Accept': 'application/vnd.github+json' }
            });

            // Handle rate limit gracefully.
            if (response.status === 403) {
                const reset = Number(response.headers.get('X-RateLimit-Reset'));
                const resetMs = Number.isFinite(reset) ? reset * 1000 : null;
                const err = new Error('GitHub API rate limit (403)');
                err.resetMs = resetMs;
                throw err;
            }
            if (!response.ok) throw new Error('GitHub API request failed (' + response.status + ')');

            const events = await response.json();
            if (!Array.isArray(events)) throw new Error('Unexpected GitHub response shape');

            const relevantEvents = events.filter((event) => {
                if (!event || !event.type) return false;
                if (event.type === 'PushEvent') return true;
                if (event.type === 'PullRequestEvent') {
                    const payload = event.payload || {};
                    const pr = payload.pull_request || {};
                    return payload.action === 'closed' && pr.merged === true;
                }
                return false;
            });

            if (!relevantEvents.length) {
                return { kind: 'unknown', text: 'Building things in the background...' };
            }

            const latest = relevantEvents[0];
            const repoFull = latest.repo && latest.repo.name ? latest.repo.name : '';

            if (latest.type === 'PushEvent') {
                const commitMessage = truncate((latest.payload?.commits && latest.payload.commits[0] && latest.payload.commits[0].message) ? latest.payload.commits[0].message.split('\n')[0] : 'Updates pushed', 90);
                return {
                    kind: 'push',
                    repoFull: repoFull,
                    commitMessage: commitMessage || 'Updates pushed',
                    timeAgo: formatTimeAgo(latest.created_at)
                };
            }

            // PullRequestEvent merged
            const prTitle = truncate(latest.payload?.pull_request?.title || 'Merged PR', 95);
            return {
                kind: 'pr_merged',
                repoFull: repoFull,
                prTitle: prTitle,
                timeAgo: formatTimeAgo(latest.created_at)
            };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async function updateTickers() {
        const containers = document.querySelectorAll('.gh-ticker-container');
        if (!containers.length) return;

        containers.forEach((container) => {
            const username = getUsernameFromContainer(container);

            let cached = null;
            try {
                cached = readTickerCache(username);
            } catch {
                cached = null;
            }

            if (cached && cached.expiresAt && nowMs() < cached.expiresAt && cached.activity) {
                renderTicker(container, cached.activity);
                return;
            }

            // If stale cache exists, show it immediately while refetching.
            if (cached && cached.activity) {
                renderTicker(container, cached.activity);
            } else {
                setTickerFallback(container, 'Loading latest system commit...');
            }

            fetchLatestGitHubActivity(username)
                .then((activity) => {
                    // Determine cache expiry: if we got a valid activity, use fixed duration.
                    const expiresAt = nowMs() + TICKER_CACHE_DURATION_MS;
                    try {
                        writeTickerCache(username, activity, expiresAt);
                    } catch {
                        // Ignore storage errors.
                    }
                    renderTicker(container, activity);
                })
                .catch((err) => {
                    const resetMs = err && err.resetMs;
                    if (cached && cached.activity) {
                        // Keep stale cache text; if we have a rate-limit reset timestamp, extend expiry until then.
                        if (resetMs && Number.isFinite(resetMs)) {
                            const expiresAt = Math.max(resetMs, nowMs() + 60 * 1000);
                            try {
                                writeTickerCache(username, cached.activity, expiresAt);
                            } catch {
                                // ignore storage errors
                            }
                        }
                        return;
                    }

                    // No cached activity: still avoid hammering GitHub after rate-limit.
                    if (resetMs && Number.isFinite(resetMs)) {
                        const expiresAt = Math.max(resetMs, nowMs() + 60 * 1000);
                        try {
                            writeTickerCache(username, { kind: 'unknown', text: 'Rate limited by GitHub API (retry soon)' }, expiresAt);
                        } catch {
                            // ignore storage errors
                        }
                        setTickerFallback(container, 'Rate limited by GitHub API (retry soon)');
                        return;
                    }

                    setTickerFallback(container, 'Consistently pushing code...');
                });
        });
    }

    function initTickers() {
        updateTickers();
        // Ticker stays fast; no aggressive polling (cache handles rate limits).
        // Refresh once per hour after the first load.
        setInterval(updateTickers, TICKER_CACHE_DURATION_MS);
    }

    async function fetchPublicEvents(username) {
        const url = 'https://api.github.com/users/' + encodeURIComponent(username) + '/events/public?per_page=100';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TICKER_FETCH_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'Accept': 'application/vnd.github+json' }
            });

            if (response.status === 403) {
                const reset = Number(response.headers.get('X-RateLimit-Reset'));
                const resetMs = Number.isFinite(reset) ? reset * 1000 : null;
                const err = new Error('GitHub API rate limit (403)');
                err.resetMs = resetMs;
                throw err;
            }
            if (!response.ok) throw new Error('GitHub events request failed (' + response.status + ')');

            const events = await response.json();
            return Array.isArray(events) ? events : [];
        } finally {
            clearTimeout(timeoutId);
        }
    }

    function readEventsCache(username) {
        const raw = localStorage.getItem(EVENTS_CACHE_PREFIX + username);
        if (!raw) return null;
        const parsed = safeJSONParse(raw);
        if (!parsed || !Array.isArray(parsed.events)) return null;
        return parsed;
    }

    function writeEventsCache(username, events, expiresAt) {
        localStorage.setItem(
            EVENTS_CACHE_PREFIX + username,
            JSON.stringify({ events: events, expiresAt: expiresAt, updatedAt: nowMs() })
        );
    }

    function filterRelevantGitHubEvents(events) {
        return (events || []).filter((event) => {
            if (!event || !event.type) return false;
            if (event.type === 'PushEvent') {
                const payload = event.payload || {};
                return Boolean(payload.head || (Array.isArray(payload.commits) && payload.commits.length > 0));
            }
            if (event.type === 'PullRequestEvent') {
                const payload = event.payload || {};
                const pr = payload.pull_request || {};
                return payload.action === 'merged' ||
                    (payload.action === 'closed' && (pr.merged === true || Boolean(pr.merged_at)));
            }
            return false;
        });
    }

    function activityCountForEvent(event) {
        if (!event || !event.type) return 0;
        if (event.type === 'PushEvent') {
            const commits = event.payload && Array.isArray(event.payload.commits) ? event.payload.commits : [];
            return Math.max(1, commits.length || 1);
        }
        if (event.type === 'PullRequestEvent') {
            return 1;
        }
        return 0;
    }

    function toDateKey(date) {
        if (!(date instanceof Date)) return '';
        return date.toISOString().slice(0, 10);
    }

    function levelFromCount(count, maxCount) {
        if (!count || count <= 0) return 0;
        if (maxCount <= 1) return 4;
        const ratio = count / maxCount;
        if (ratio >= 0.75) return 4;
        if (ratio >= 0.5) return 3;
        if (ratio >= 0.25) return 2;
        return 1;
    }

    function renderHeatmap(events) {
        const grid = document.getElementById('gh-heatmap-grid');
        if (!grid) return;

        grid.innerHTML = '';

        const dayMs = 24 * 60 * 60 * 1000;
        const today = new Date();
        const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const start = new Date(end.getTime() - (HEATMAP_DAYS - 1) * dayMs);
        const gridStart = new Date(start.getTime() - start.getUTCDay() * dayMs);
        const totalDays = Math.floor((end.getTime() - gridStart.getTime()) / dayMs) + 1;

        const countsByDay = new Map();
        (events || []).forEach((event) => {
            const created = event && event.created_at ? new Date(event.created_at) : null;
            if (!(created instanceof Date) || Number.isNaN(created.getTime())) return;
            const d = new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate()));
            if (d < start || d > end) return;
            const key = toDateKey(d);
            const prev = countsByDay.get(key) || 0;
            countsByDay.set(key, prev + activityCountForEvent(event));
        });

        let maxCount = 0;
        countsByDay.forEach((n) => { if (n > maxCount) maxCount = n; });

        for (let i = 0; i < totalDays; i += 1) {
            const d = new Date(gridStart.getTime() + i * dayMs);
            const key = toDateKey(d);
            const inRange = d >= start && d <= end;
            const count = countsByDay.get(key) || 0;
            const level = inRange ? levelFromCount(count, maxCount) : 0;

            const cell = document.createElement('div');
            cell.className = 'gh-heatmap-cell level-' + level;
            cell.style.setProperty('--cell-delay', `${Math.min(i * 18, 900)}ms`);
            cell.dataset.level = String(level);
            cell.dataset.count = String(count);
            cell.setAttribute('role', 'img');
            cell.setAttribute('aria-label', count + ' tracked events on ' + key);
            cell.title = key + ': ' + count + (count === 1 ? ' tracked event' : ' tracked events');
            if (!inRange) cell.classList.add('is-outside-range');
            cell.addEventListener('pointerdown', () => {
                cell.classList.add('is-pressed');
            }, { passive: true });
            ['pointerup', 'pointercancel', 'pointerleave', 'blur'].forEach((eventName) => {
                cell.addEventListener(eventName, () => {
                    cell.classList.remove('is-pressed');
                }, { passive: true });
            });
            grid.appendChild(cell);
        }
    }

    function formatShortDate(iso) {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function populateList(listEl, items, emptyText) {
        if (!listEl) return;
        listEl.innerHTML = '';
        if (!items.length) {
            const li = document.createElement('li');
            li.className = 'gh-pulse-empty';
            li.textContent = emptyText;
            listEl.appendChild(li);
            return;
        }

        items.forEach((item) => {
            const li = document.createElement('li');
            li.style.setProperty('--item-delay', `${Math.min(listEl.children.length * 70, 420)}ms`);
            li.addEventListener('pointerdown', () => {
                li.classList.add('is-pressed');
            }, { passive: true });
            ['pointerup', 'pointercancel', 'pointerleave', 'blur'].forEach((eventName) => {
                li.addEventListener(eventName, () => {
                    li.classList.remove('is-pressed');
                }, { passive: true });
            });
            const main = document.createElement('a');
            main.className = 'gh-pulse-main';
            main.target = '_blank';
            main.rel = 'noopener noreferrer';
            main.href = item.url;
            main.textContent = item.title;

            const meta = document.createElement('span');
            meta.className = 'gh-pulse-meta';
            meta.textContent = item.meta;

            li.appendChild(main);
            li.appendChild(meta);
            listEl.appendChild(li);
        });
    }

    function extractRecentCommits(events) {
        const rows = [];
        const seen = new Set();

        (events || []).forEach((event) => {
            if (!event || event.type !== 'PushEvent') return;
            const repoFull = event.repo && event.repo.name ? event.repo.name : '';
            const payload = event.payload || {};
            const commits = Array.isArray(payload.commits) ? payload.commits : [];

            if (!commits.length) {
                const uniqueId = payload.head || event.id || (repoFull + ':' + (payload.ref || 'push'));
                if (seen.has(uniqueId)) return;
                seen.add(uniqueId);

                const branch = typeof payload.ref === 'string' ? payload.ref.split('/').pop() : null;
                const shortSha = typeof payload.head === 'string' ? payload.head.slice(0, 7) : null;
                const title = branch
                    ? ('Pushed to ' + branch + (shortSha ? ' (' + shortSha + ')' : ''))
                    : ('Repository updated' + (shortSha ? ' (' + shortSha + ')' : ''));
                const url = repoFull && payload.head
                    ? ('https://github.com/' + repoFull + '/commit/' + payload.head)
                    : (repoFull ? ('https://github.com/' + repoFull) : ('https://github.com/' + DEFAULT_GITHUB_USERNAME));
                const meta = repoShortName(repoFull) + ' · ' + formatShortDate(event.created_at || '');
                rows.push({ title: title, url: url, meta: meta });
                return;
            }

            commits.forEach((commit, index) => {
                if (!commit) return;
                const uniqueId = commit.sha || ((event.id || repoFull || 'push') + ':' + index);
                if (seen.has(uniqueId)) return;
                seen.add(uniqueId);
                const title = truncate((commit.message || 'Updates pushed').split('\n')[0], 92);
                const url = repoFull && commit.sha
                    ? ('https://github.com/' + repoFull + '/commit/' + commit.sha)
                    : (repoFull ? ('https://github.com/' + repoFull) : ('https://github.com/' + DEFAULT_GITHUB_USERNAME));
                const meta = repoShortName(repoFull) + ' · ' + formatShortDate(event.created_at || '');
                rows.push({ title: title, url: url, meta: meta });
            });
        });

        return rows.slice(0, FEED_LIMIT);
    }

    function extractRecentMergedPrs(events) {
        const rows = [];
        (events || []).forEach((event) => {
            if (!event || event.type !== 'PullRequestEvent') return;
            const payload = event.payload || {};
            const pr = payload.pull_request || {};
            const merged = payload.action === 'merged' ||
                (payload.action === 'closed' && (pr.merged === true || Boolean(pr.merged_at)));
            if (!merged) return;

            const repoFull = event.repo && event.repo.name ? event.repo.name : '';
            const title = truncate(pr.title || 'Merged PR', 92);
            const url = pr.html_url || (repoFull ? ('https://github.com/' + repoFull + '/pulls') : ('https://github.com/' + DEFAULT_GITHUB_USERNAME));
            const meta = repoShortName(repoFull) + ' · ' + formatShortDate(event.created_at || '');
            rows.push({ title: title, url: url, meta: meta });
        });
        return rows.slice(0, FEED_LIMIT);
    }

    function renderPulseUpdatedText(fromCache) {
        const node = document.getElementById('gh-pulse-updated');
        if (!node) return;
        node.textContent = (fromCache ? 'Cached' : 'Live') + ' · ' + getJordanTimeString();
    }

    function initGitHubPulse() {
        const section = document.getElementById('github-pulse');
        if (!section) return;
        const username = getUsernameFromContainer(section);

        const commitsList = document.getElementById('gh-recent-commits');
        const mergesList = document.getElementById('gh-recent-merges');

        const showFromEvents = (events, fromCache) => {
            const relevantEvents = filterRelevantGitHubEvents(events);
            renderHeatmap(relevantEvents);
            populateList(commitsList, extractRecentCommits(relevantEvents), 'No recent commits found.');
            populateList(mergesList, extractRecentMergedPrs(relevantEvents), 'No merged PRs found recently.');
            renderPulseUpdatedText(fromCache);
        };

        let cached = null;
        try {
            cached = readEventsCache(username);
        } catch {
            cached = null;
        }

        if (cached && cached.expiresAt && nowMs() < cached.expiresAt) {
            showFromEvents(cached.events, true);
            return;
        }

        if (cached && cached.events) {
            showFromEvents(cached.events, true);
        }

        fetchPublicEvents(username)
            .then((events) => {
                const expiresAt = nowMs() + EVENTS_CACHE_DURATION_MS;
                try {
                    writeEventsCache(username, events, expiresAt);
                } catch {
                    // ignore storage write errors
                }
                showFromEvents(events, false);
            })
            .catch((err) => {
                const resetMs = err && err.resetMs;
                if (cached && cached.events) {
                    if (resetMs && Number.isFinite(resetMs)) {
                        try {
                            writeEventsCache(username, cached.events, Math.max(resetMs, nowMs() + 60 * 1000));
                        } catch {
                            // ignore
                        }
                    }
                    return;
                }
                populateList(commitsList, [], 'Could not load commits right now.');
                populateList(mergesList, [], 'Could not load merged PRs right now.');
                renderHeatmap([]);
                renderPulseUpdatedText(true);
            });
    }

    function getJordanTimeString() {
        const now = new Date();
        const jordanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Amman' }));
        return jordanTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Amman' }) + ' GMT+3';
    }

    function initTerminalEasterEgg() {
        let stageIndex = 0;
        let firstStageAt = null;
        let opened = false;
        let overlayEl = null;
        let panelEl = null;
        let outputEl = null;
        let inputEl = null;
        const disableAnimations = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function safeLocalGet(key) {
            try { return localStorage.getItem(key); } catch { return null; }
        }
        function safeLocalSet(key, value) {
            try { localStorage.setItem(key, value); } catch { /* ignore */ }
        }

        function isDesktop() {
            const pointerFine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
            const wideEnough = window.innerWidth >= 900;
            return pointerFine && wideEnough;
        }

        function getCachedTickerText() {
            try {
                const raw = localStorage.getItem(TICKER_CACHE_PREFIX + DEFAULT_GITHUB_USERNAME);
                const parsed = safeJSONParse(raw);
                if (parsed && parsed.activity) {
                    const a = parsed.activity;
                    if (a.kind === 'push') return (a.commitMessage ? a.commitMessage : 'Updates pushed');
                    if (a.kind === 'pr_merged') return (a.prTitle ? a.prTitle : 'Merged PR');
                }
            } catch { /* ignore */ }
            return null;
        }

        function ensureOverlay() {
            if (overlayEl) return;

            overlayEl = document.createElement('div');
            overlayEl.id = 'terminal-easter-egg-overlay';
            overlayEl.setAttribute('aria-hidden', 'true');

            panelEl = document.createElement('div');
            panelEl.id = 'terminal-easter-egg-panel';
            panelEl.setAttribute('role', 'dialog');
            panelEl.setAttribute('aria-modal', 'true');
            panelEl.setAttribute('aria-label', 'Terminal easter egg');

            const topbar = document.createElement('div');
            topbar.id = 'terminal-easter-egg-topbar';
            topbar.innerHTML = `
                <div class="terminal-easter-traffic" aria-hidden="true">
                    <span class="terminal-easter-dot red"></span>
                    <span class="terminal-easter-dot yellow"></span>
                    <span class="terminal-easter-dot green"></span>
                </div>
                <div id="terminal-easter-egg-title">/dev/qusai-pro</div>
                <button id="terminal-easter-egg-close" type="button" aria-label="Close terminal">×</button>
            `;

            outputEl = document.createElement('div');
            outputEl.id = 'terminal-easter-egg-body';

            const inputRow = document.createElement('div');
            inputRow.className = 'terminal-easter-input-row';
            inputRow.innerHTML = `
                <div class="terminal-easter-prefix">qusai@pro:~$</div>
                <input id="terminal-easter-egg-input" type="text" autocomplete="off" spellcheck="false" placeholder="Type 'help' and press Enter" />
            `;

            panelEl.appendChild(topbar);
            panelEl.appendChild(outputEl);
            panelEl.appendChild(inputRow);
            overlayEl.appendChild(panelEl);
            document.body.appendChild(overlayEl);

            const closeBtn = overlayEl.querySelector('#terminal-easter-egg-close');
            inputEl = overlayEl.querySelector('#terminal-easter-egg-input');

            function close() {
                overlayEl.classList.remove('is-open');
                overlayEl.setAttribute('aria-hidden', 'true');
                opened = false;
                document.body.style.overflow = '';
            }

            closeBtn.addEventListener('click', close);
            overlayEl.addEventListener('click', (e) => {
                if (e.target === overlayEl) close();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && opened) close();
            });

            function printLine(text, opts) {
                const line = document.createElement('div');
                line.className = 'terminal-easter-line';

                const safeText = typeof text === 'string' ? text : String(text);
                if (opts && opts.prompt) {
                    const promptSpan = document.createElement('span');
                    promptSpan.className = 'terminal-easter-prompt';
                    promptSpan.textContent = safeText;
                    line.appendChild(promptSpan);
                } else {
                    line.textContent = safeText;
                }
                outputEl.appendChild(line);
                outputEl.scrollTop = outputEl.scrollHeight;
            }

            function printLines(lines, startDelayMs) {
                outputEl.textContent = '';
                const delayBase = disableAnimations ? 0 : (startDelayMs || 70);
                let t = 0;
                lines.forEach((ln) => {
                    t += delayBase;
                    setTimeout(() => printLine(ln), t);
                });
            }

            function runCommand(rawInput) {
                const input = String(rawInput || '').trim();
                if (!input) return;

                printLine('qusai@pro:~$ ' + input, { prompt: true });

                const [cmd, ...rest] = input.split(' ');
                const args = rest.join(' ').trim();

                switch (cmd.toLowerCase()) {
                    case 'help':
                        printLines([
                            'Available commands:',
                            '  help            - show this menu',
                            '  status          - quick system snapshot',
                            '  github          - open your GitHub profile',
                            '  activity        - show the cached GitHub ticker text',
                            '  theme           - toggle site theme',
                            '  clear           - clear output',
                            '  date            - Jordan time (GMT+3)',
                            '  exit            - close terminal',
                            '',
                            'Tip: this easter egg triggers after a desktop scroll sequence.'
                        ]);
                        break;
                    case 'status': {
                        const tickerText = getCachedTickerText();
                        printLines([
                            'System: online',
                            'Time: ' + getJordanTimeString(),
                            'Render mode: ' + (disableAnimations ? 'reduced-motion' : 'standard'),
                            'GitHub cache: ' + (tickerText ? tickerText : 'not loaded yet'),
                            '',
                            'Type "help" for commands.'
                        ]);
                        break;
                    }
                    case 'activity': {
                        const tickerText = getCachedTickerText();
                        printLines([
                            tickerText ? ('Cached activity: ' + tickerText) : 'No cached GitHub activity yet. Scroll a bit more, or reload the page.'
                        ]);
                        break;
                    }
                    case 'github':
                        try {
                            window.open('https://github.com/' + DEFAULT_GITHUB_USERNAME, '_blank', 'noopener');
                            printLine('Opening: https://github.com/' + DEFAULT_GITHUB_USERNAME);
                        } catch {
                            printLine('Could not open GitHub.');
                        }
                        break;
                    case 'theme': {
                        const themeToggle = document.getElementById('theme-toggle');
                        if (themeToggle) themeToggle.click();
                        printLine('Theme toggled.');
                        break;
                    }
                    case 'clear':
                        outputEl.textContent = '';
                        break;
                    case 'date':
                        printLines(['Jordan time: ' + getJordanTimeString()]);
                        break;
                    case 'exit':
                        close();
                        break;
                    case 'echo':
                        printLine(args);
                        break;
                    default:
                        printLines([
                            'Command not found: ' + cmd,
                            'Type "help" to see available commands.'
                        ]);
                        break;
                }
            }

            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    runCommand(inputEl.value);
                    inputEl.value = '';
                }
            });

            // Boot output on open.
            overlayEl._printLines = printLines;
            overlayEl._printLine = printLine;
            overlayEl._runCommand = runCommand;
            overlayEl._closeFn = close;
        }

        function openTerminal() {
            if (opened) return;
            ensureOverlay();

            opened = true;
            overlayEl.classList.add('is-open');
            overlayEl.setAttribute('aria-hidden', 'false');

            document.body.style.overflow = 'hidden';

            const bootLines = [
                'Booting terminal sandbox...',
                'Loading modules: ui, input, git',
                'Checking local cache...',
                'Ready. Type "help"'
            ];

            overlayEl._printLines(bootLines, 65);
            setTimeout(() => {
                if (inputEl) {
                    inputEl.focus();
                    inputEl.value = '';
                }
            }, disableAnimations ? 0 : 80);
        }

        // Trigger on a desktop scroll sequence.
        if (!isDesktop()) return;
        if (safeLocalGet(TRIGGERED_KEY)) return;

        let scrollHandler = null;

        const onScroll = () => {
            if (opened) return;

            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (maxScroll <= 0) return;
            const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

            if (stageIndex < SCROLL_STAGES.length && progress >= SCROLL_STAGES[stageIndex]) {
                if (stageIndex === 0) firstStageAt = nowMs();
                stageIndex += 1;

                if (stageIndex >= SCROLL_STAGES.length) {
                    const elapsed = firstStageAt ? nowMs() - firstStageAt : MIN_STAGE_DURATION_MS;
                    const waitMs = elapsed >= MIN_STAGE_DURATION_MS ? 0 : (MIN_STAGE_DURATION_MS - elapsed);

                    if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
                    safeLocalSet(TRIGGERED_KEY, '1');
                    setTimeout(openTerminal, waitMs);
                }
            }
        };

        // Use rAF-throttling so we don't spam scroll handlers.
        let ticking = false;
        scrollHandler = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                ticking = false;
                onScroll();
            });
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    function initTermEasterEggProvided() {
        const notifyEl = document.getElementById('term-notify');
        const overlayEl = document.getElementById('term-overlay');
        const inputEl = document.getElementById('term-input');
        const outputEl = document.getElementById('term-output');
        const closeBtn = document.getElementById('term-close');
        const windowEl = document.getElementById('term-window');

        // If the markup isn't present on a page, skip quietly.
        if (!notifyEl || !overlayEl || !inputEl || !outputEl || !closeBtn || !windowEl) return;

        let terminalOpen = false;
        overlayEl.setAttribute('aria-hidden', 'true');

        const prefersCoarsePointer = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const isDesktop = () => window.innerWidth >= 720 && !prefersCoarsePointer();

        const escapeHtml = (str) => {
            return String(str).replace(/[&<>"']/g, (ch) => {
                switch (ch) {
                    case '&': return '&amp;';
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '"': return '&quot;';
                    case "'": return '&#39;';
                    default: return ch;
                }
            });
        };

        function setNotificationHidden() {
            notifyEl.classList.remove('term-slide-in');
            notifyEl.classList.add('term-hidden');
        }

        function toggleTerminal() {
            terminalOpen = !terminalOpen;

            if (terminalOpen) {
                overlayEl.classList.remove('term-hidden');
                overlayEl.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                setNotificationHidden(); // Hide notification if open
                setTimeout(() => inputEl.focus(), 100);
            } else {
                overlayEl.classList.add('term-hidden');
                overlayEl.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                inputEl.blur();
            }
        }

        closeBtn.addEventListener('click', toggleTerminal);

        notifyEl.setAttribute('title', 'Open terminal');
        notifyEl.style.cursor = 'pointer';
        notifyEl.addEventListener('click', () => {
            if (notifyEl.classList.contains('term-hidden')) return;
            toggleTerminal();
        });

        const SCROLL_HINT_KEY = 'term_scroll_hint_session_v1';
        function showTermScrollHint() {
            if (!isDesktop()) return;
            if (sessionStorage.getItem(SCROLL_HINT_KEY)) return;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (maxScroll <= 80) return;
            const progress = window.scrollY / maxScroll;
            if (progress < 0.34) return;
            sessionStorage.setItem(SCROLL_HINT_KEY, '1');
            notifyEl.classList.remove('term-hidden');
            requestAnimationFrame(() => notifyEl.classList.add('term-slide-in'));
            window.setTimeout(() => {
                if (!terminalOpen) setNotificationHidden();
            }, 14000);
        }
        let hintTicking = false;
        window.addEventListener('scroll', () => {
            if (hintTicking) return;
            hintTicking = true;
            window.requestAnimationFrame(() => {
                hintTicking = false;
                showTermScrollHint();
            });
        }, { passive: true });
        showTermScrollHint();

        // 2. Keyboard Listener for opt-in terminal toggle and Escape
        document.addEventListener('keydown', (e) => {
            const isEditable = e.target && e.target.closest && e.target.closest('input, textarea, [contenteditable="true"]');
            if (e.key === '`' && isDesktop() && !isEditable) {
                e.preventDefault();
                toggleTerminal();
                return;
            }

            if (e.key === 'Escape' && terminalOpen) {
                toggleTerminal();
            }
        });

        // 3. Command Logic
        function printOutput(text, className, html = false) {
            const div = document.createElement('div');
            div.className = className;
            if (html) div.innerHTML = text;
            else div.textContent = text;
            outputEl.appendChild(div);
            windowEl.scrollTop = windowEl.scrollHeight; // Auto-scroll to bottom
        }

        function printLines(lines, className = 'sys-res') {
            (lines || []).forEach((ln) => printOutput(String(ln), className, false));
        }

        function truncateText(text, maxLen) {
            const s = String(text || '');
            if (s.length <= maxLen) return s;
            return s.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…';
        }

        function getThemeName() {
            return document.documentElement.getAttribute('data-theme') || 'dark';
        }

        function getCachedTickerTextForTerminal() {
            try {
                const raw = localStorage.getItem(TICKER_CACHE_PREFIX + DEFAULT_GITHUB_USERNAME);
                const parsed = safeJSONParse(raw);
                if (parsed && parsed.activity) {
                    const a = parsed.activity;
                    if (a.kind === 'push') return a.commitMessage ? a.commitMessage : 'Updates pushed';
                    if (a.kind === 'pr_merged') return a.prTitle ? a.prTitle : 'Merged PR';
                    if (a.text) return a.text;
                }
            } catch {
                // ignore storage errors
            }
            return null;
        }

        function formatUptime() {
            const seconds = Math.floor((performance.now() || 0) / 1000);
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            const pad2 = (n) => String(n).padStart(2, '0');
            return (h > 0 ? `${h}h ` : '') + `${pad2(m)}m ${pad2(s)}s`;
        }

        function processCommand(normalizedInput, rawInput) {
            const normalized = String(normalizedInput || '').trim();
            const raw = String(rawInput || '').trim();
            if (!normalized) return;

            // Keep the "spicy" blocklist check strict on the full raw command.
            if (normalized === 'sudo rm -rf /') {
                printLines(['Nice try. This incident will be reported to Mr. Elias.']);
                return;
            }

            const partsNorm = normalized.split(/\s+/);
            const cmd = (partsNorm[0] || '').toLowerCase();
            const argsNorm = partsNorm.slice(1).join(' ');
            const partsRaw = raw.split(/\s+/);
            const argsRaw = partsRaw.slice(1).join(' ');

            switch (cmd) {
                case 'help':
                    printLines([
                        'Available commands (terminal easter egg):',
                        '  help                          Show this menu',
                        '  whoami                        Display identity',
                        '  fetch | neofetch              System snapshot',
                        '  status                        Quick status info',
                        '  uptime                        Show page uptime',
                        '  date | time                   Jordan time (GMT+3)',
                        '  cat <file>                   Read fake files (skills.txt, about.txt, manifest.txt, system.txt)',
                        '  ls [dir]                     Fake directory listing',
                        '  tree                          ASCII project tree',
                        '  motd                          Message of the day',
                        '  fortune                       Random fortune',
                        '  roll [n]                     Roll 1..n (default 6)',
                        '  coin                          Flip a coin',
                        '  rand <a> <b>                Random integer between a and b',
                        '  echo <text>                 Echo back',
                        '  cowsay <text>               Cow says...',
                        '  ping                          Pong + simulated latency',
                        '  theme                         Toggle site theme',
                        '  github                        Open GitHub profile',
                        '  activity                      Show cached GitHub ticker',
                        '  open <site>                  Open: github, portfolio, blog, sites, recommendations, email',
                        '  clear | cls                   Clear output',
                        '  sudo                          Nice try (blocked)',
                        '  exit | q                      Close terminal'
                    ]);
                    break;

                case 'whoami':
                    printLines([
                        'qusai_ismael',
                        'Role: Security & Privacy by day, AI & SWE by night.',
                        'Status: Protecting the baseline, expanding Luck Surface Area.'
                    ]);
                    break;

                case 'fetch':
                case 'neofetch':
                    printLines([
                        'OS: Fedora Linux',
                        'DE: KDE Plasma',
                        'Host: Ryzen 9600X / RDNA4 (Desktop) | ThinkPad T480s (Mobile)',
                        'Network: Tailscale',
                        'Philosophy: 100% FOSS'
                    ]);
                    break;

                case 'status':
                    printLines([
                        'System: online',
                        'Theme: ' + getThemeName(),
                        'Viewport: ' + window.innerWidth + 'x' + window.innerHeight,
                        'Uptime: ' + formatUptime(),
                        'Time: ' + getJordanTimeString()
                    ]);
                    break;

                case 'uptime':
                    printLines(['Uptime: ' + formatUptime()]);
                    break;

                case 'date':
                case 'time':
                    printLines(['Jordan time: ' + getJordanTimeString()]);
                    break;

                case 'cat': {
                    const file = argsNorm || '';
                    if (!file) {
                        printLines(['Usage: cat <file> (try: cat skills.txt)']);
                        break;
                    }

                    switch (file) {
                        case 'skills.txt':
                            printLines([
                                'GRC',
                                '  - ISO 27001, SIEM, Threat Intel',
                                'Linux',
                                '  - Fedora/KDE, Bash',
                                'AI/ML',
                                '  - Python, Local LLMs (Quantization)'
                            ]);
                            break;
                        case 'about.txt':
                            printLines([
                                'QusaiOS terminal (mock).',
                                'The real superpower: privacy + practical engineering.',
                                'Ask boldly. Ship quietly.'
                            ]);
                            break;
                        case 'manifest.txt':
                            printLines([
                                'This easter egg is intentionally:',
                                '  - dependency-free',
                                '  - fine-pointer desktop (about 720px+ wide, not touch-primary)',
                                '  - keyboard friendly',
                                'Commands are just vibes and safe outputs.'
                            ]);
                            break;
                        case 'system.txt':
                            printLines([
                                'OS (estimated): Fedora Linux',
                                'DE (estimated): KDE Plasma',
                                'Net (hint): Tailscale',
                                'Renderer: mock terminal UI'
                            ]);
                            break;
                        default:
                            printLines(['cat: ' + file + ': No such file or directory']);
                            break;
                    }
                    break;
                }

                case 'ls': {
                    const target = argsNorm || '~';
                    if (target === '~' || target === 'home' || target === '.') {
                        printLines(['skills.txt', 'about.txt', 'manifest.txt', 'system.txt']);
                        break;
                    }
                    if (target === 'projects' || target === 'workspace') {
                        printLines(['GRC-check', 'ClipGuard', 'Readify', 'RSS-AI', 'LocalLLM', 'More_Open_Source']);
                        break;
                    }
                    printLines(['ls: cannot access \'' + target + '\': No such directory']);
                    break;
                }

                case 'tree': {
                    printLines([
                        '~',
                        '├─ skills.txt',
                        '├─ about.txt',
                        '├─ manifest.txt',
                        '└─ system.txt',
                        '',
                        'projects/',
                        '├─ GRC-check/',
                        '├─ ClipGuard/',
                        '├─ Readify/',
                        '├─ RSS-AI/',
                        '└─ LocalLLM/'
                    ]);
                    break;
                }

                case 'motd': {
                    const messages = [
                        'Welcome, operator. The baseline is defended. The surface area expands.',
                        'Fedora mode: aesthetic engaged. Scroll a bit, then ` opens the shell. Escape closes it.',
                        'Privacy is a feature. Play is a protocol.'
                    ];
                    const pick = messages[Math.floor(Math.random() * messages.length)];
                    printLines([pick]);
                    break;
                }

                case 'fortune': {
                    const fortunes = [
                        'You will debug efficiently today (and over-comment less than yesterday).',
                        'A clever refactor is hiding inside a tiny copy-paste.',
                        'Your next PR will be the one that gets celebrated.'
                    ];
                    printLines([fortunes[Math.floor(Math.random() * fortunes.length)]]);
                    break;
                }

                case 'roll': {
                    const n = parseInt(argsNorm, 10);
                    const sides = Number.isFinite(n) && n >= 2 ? n : 6;
                    const value = Math.floor(Math.random() * sides) + 1;
                    printLines(['Rolled: ' + value + ' (1..' + sides + ')']);
                    break;
                }

                case 'coin': {
                    const heads = Math.random() < 0.5;
                    printLines([
                        heads ? 'Coin: HEADS' : 'Coin: TAILS',
                        heads ? '  (•_•)  -> confident.' : '  (•_•)  -> suspicious.'
                    ]);
                    break;
                }

                case 'rand': {
                    const parts = argsNorm.split(/\s+/).filter(Boolean);
                    const a = parseInt(parts[0], 10);
                    const b = parseInt(parts[1], 10);
                    if (!Number.isFinite(a) || !Number.isFinite(b)) {
                        printLines(['Usage: rand <a> <b> (example: rand 1 100)']);
                        break;
                    }
                    const min = Math.min(a, b);
                    const max = Math.max(a, b);
                    const value = Math.floor(Math.random() * (max - min + 1)) + min;
                    printLines(['rand(' + min + ', ' + max + ') = ' + value]);
                    break;
                }

                case 'echo':
                    printLines([argsRaw || '']);
                    break;

                case 'cowsay': {
                    const msg = truncateText(argsRaw || 'moo', 48);
                    const width = Math.min(50, msg.length + 2);
                    const lineLen = Math.max(3, width);
                    printLines([
                        ' ' + '_'.repeat(lineLen),
                        '< ' + msg + (msg.length + 1 < lineLen ? ' '.repeat(lineLen - msg.length - 2) : '') + ' >',
                        ' ' + '-'.repeat(lineLen),
                        '        \\   ^__^',
                        '         \\  (oo)\\_______',
                        '            (__)\       )\\/\\',
                        '                ||----w |',
                        '                ||     ||'
                    ]);
                    break;
                }

                case 'ping': {
                    const ms = Math.floor(Math.random() * 91) + 20; // 20..110
                    printLines(['Pinging qusai@pro...']);
                    setTimeout(() => {
                        printLines(['Reply: time=' + ms + 'ms  TTL=64']);
                    }, Math.floor(Math.random() * 220) + 80);
                    break;
                }

                case 'theme': {
                    const themeToggle = document.getElementById('theme-toggle');
                    if (themeToggle && typeof themeToggle.click === 'function') {
                        themeToggle.click();
                    } else {
                        document.documentElement.setAttribute('data-theme', getThemeName() === 'light' ? 'dark' : 'light');
                    }
                    printLines(['Theme toggled. Now: ' + getThemeName()]);
                    break;
                }

                case 'github':
                    try {
                        window.open('https://github.com/' + DEFAULT_GITHUB_USERNAME, '_blank', 'noopener');
                        printLines(['Opening: https://github.com/' + DEFAULT_GITHUB_USERNAME]);
                    } catch {
                        printLines(['Could not open GitHub.']);
                    }
                    break;

                case 'activity': {
                    const tickerText = getCachedTickerTextForTerminal();
                    printLines([tickerText ? ('GitHub cache: ' + tickerText) : 'No cached GitHub activity yet. Scroll a bit more, or reload the page.']);
                    break;
                }

                case 'open': {
                    const dest = argsNorm || '';
                    const map = {
                        github: 'https://github.com/' + DEFAULT_GITHUB_USERNAME,
                        portfolio: 'portfolio.html',
                        blog: 'blog.html',
                        sites: 'sites.html',
                        recommendations: 'recommendations.html',
                        email: 'mailto:qusai@qusai.pro'
                    };
                    const url = map[dest];
                    if (!url) {
                        printLines(['Usage: open <site> (github, portfolio, blog, sites, recommendations, email)']);
                        break;
                    }
                    try {
                        window.open(url, '_blank', 'noopener');
                        printLines(['Opening: ' + url]);
                    } catch {
                        printLines(['Could not open: ' + dest]);
                    }
                    break;
                }

                case 'sudo':
                    printLines(['Nice try. This terminal is a sandbox.']);
                    break;

                case 'cls':
                case 'clear':
                    outputEl.innerHTML = '';
                    break;

                case 'exit':
                case 'q':
                    toggleTerminal();
                    break;

                default:
                    printLines(['bash: ' + normalized + ': command not found']);
                    break;
            }
        }

        inputEl.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();

            const rawInput = inputEl.value.trim();
            const normalized = rawInput.toLowerCase();
            inputEl.value = ''; // Clear input

            if (normalized === '') return;

            printOutput(`[qusai@fedora ~]$ ${rawInput}`, 'user-cmd', false);
            processCommand(normalized, rawInput);
        });

        // Keep focus on input when clicking inside terminal
        windowEl.addEventListener('click', () => inputEl.focus());
    }

    function runWhenReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    runWhenReady(function () {
        initTickers();
        initGitHubPulse();
        initTermEasterEggProvided();
    });
})();