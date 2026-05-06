/**
 * Pretext.js creative aesthetics -- flagship version.
 * Canvas-first visuals + practical typography utilities.
 */
(function () {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = () => window.innerWidth < 768;
    const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    function waitForPretext(cb) {
        if (window.Pretext) { cb(window.Pretext); return; }
        let n = 0;
        const t = setInterval(() => {
            n += 1;
            if (window.Pretext) { clearInterval(t); cb(window.Pretext); return; }
            if (n > 220) clearInterval(t);
        }, 50);
    }

    function getFontShorthand(el) {
        const s = getComputedStyle(el);
        const p = [];
        if (s.fontStyle && s.fontStyle !== 'normal') p.push(s.fontStyle);
        if (s.fontWeight && s.fontWeight !== '400' && s.fontWeight !== 'normal') p.push(s.fontWeight);
        p.push(s.fontSize, s.fontFamily);
        return p.join(' ');
    }

    function binaryTighten(P, prepared, lineHeight, originalWidth, allowedLines) {
        let lo = Math.max(80, originalWidth * 0.5), hi = originalWidth;
        while (hi - lo > 1) {
            const mid = (lo + hi) / 2;
            if (P.layout(prepared, mid, lineHeight).lineCount <= allowedLines) hi = mid;
            else lo = mid;
        }
        return Math.ceil(hi);
    }

    function lineHeightOf(el) {
        const s = getComputedStyle(el);
        const raw = parseFloat(s.lineHeight);
        return Number.isFinite(raw) ? raw : (parseFloat(s.fontSize) || 16) * 1.6;
    }

    function charWidth(P, ch, font, cache) {
        const key = font + '|' + ch;
        if (cache.has(key)) return cache.get(key);
        const prep = P.prepareWithSegments(ch || 'M', font);
        let w = 0;
        P.walkLineRanges(prep, 9999, (l) => { w = l.width; });
        const out = Math.max(2, w);
        cache.set(key, out);
        return out;
    }

    let _cachedColors = null;
    let _colorsCacheTime = 0;
    function getThemeColors() {
        const now = performance.now();
        if (_cachedColors && now - _colorsCacheTime < 1000) return _cachedColors;
        const root = getComputedStyle(document.documentElement);
        _cachedColors = {
            accent: root.getPropertyValue('--accent-color').trim() || '#D2B48C',
            text: root.getPropertyValue('--text-color').trim() || '#FAF0E6',
            heading: root.getPropertyValue('--heading-color').trim() || '#FAF0E6',
            primaryRgb: root.getPropertyValue('--primary-color-rgb').trim() || '210,180,140'
        };
        _colorsCacheTime = now;
        return _cachedColors;
    }

    /* ---------------------------------------------------------
       1) Particle Q in header
       --------------------------------------------------------- */
    function initAsciiQ(P) {
        if (reducedMotion || isMobile()) return;
        const header = document.querySelector('.header');
        if (!header) return;

        let canvas = header.querySelector('.pretext-ascii-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'pretext-ascii-canvas';
            canvas.setAttribute('aria-hidden', 'true');
            header.insertBefore(canvas, header.firstChild);
        }
        const ctx = canvas.getContext('2d', { alpha: true });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const fontSize = 11, cellW = 12, cellH = 14;
        const font = fontSize + 'px ' + getComputedStyle(document.body).fontFamily;
        const asciiPool = '!@#$%^&*<>{}[]|/\\~`?+=_-:.;0123456789abcdefghijklmnopqrstuvwxyz'.split('');
        let pointer = null, phase = 0, pulse = 0, nextPulseAt = 800;
        let particles = [], cW = 0, cH = 0, visible = true, frameId = null;

        function sampleQ(cols, rows) {
            const off = document.createElement('canvas');
            off.width = cols; off.height = rows;
            const c = off.getContext('2d');
            c.fillStyle = '#000'; c.fillRect(0, 0, cols, rows);
            c.fillStyle = '#fff';
            c.font = '700 ' + (Math.min(cols, rows) * 0.88) + 'px Georgia,serif';
            c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText('Q', cols * 0.52, rows * 0.48);
            return c.getImageData(0, 0, cols, rows).data;
        }

        function rebuild() {
            const rect = header.getBoundingClientRect();
            cW = Math.max(1, rect.width); cH = Math.max(1, rect.height);
            canvas.width = Math.round(cW * dpr);
            canvas.height = Math.round(cH * dpr);
            canvas.style.width = cW + 'px';
            canvas.style.height = cH + 'px';
            const cols = Math.ceil(cW / cellW), rows = Math.ceil(cH / cellH);
            const data = sampleQ(cols, rows);
            particles = [];
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const b = data[(y * cols + x) * 4] / 255;
                    if (b < 0.05) continue;
                    const tx = x * cellW, ty = y * cellH;
                    particles.push({
                        x: Math.random() * cW, y: Math.random() * cH,
                        vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                        tx, ty, b,
                        ch: asciiPool[rand(0, asciiPool.length - 1)],
                        nextSwap: rand(40, 220)
                    });
                }
            }
        }

        let tick = 0;
        function draw(now) {
            frameId = null;
            if (!visible) return;
            tick++;
            const colors = getThemeColors();
            const springK = 0.035 + pulse * 0.06;
            const damping = 0.88;

            if (now > nextPulseAt) { pulse = 1; nextPulseAt = now + rand(1200, 2800); }
            pulse *= 0.93;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, cW, cH);
            ctx.font = font;
            ctx.textBaseline = 'top';
            ctx.fillStyle = colors.accent;

            const jitterStrength = 0.3 + pulse * 1.8;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                // Continuous random character cycling
                p.nextSwap--;
                if (p.nextSwap <= 0) {
                    p.ch = asciiPool[rand(0, asciiPool.length - 1)];
                    p.nextSwap = rand(20, 140);
                }

                let fx = (p.tx - p.x) * springK;
                let fy = (p.ty - p.y) * springK;

                // Continuous jitter so particles never fully settle
                fx += (Math.random() - 0.5) * jitterStrength;
                fy += (Math.random() - 0.5) * jitterStrength;

                if (pointer) {
                    const dx = p.x - pointer.x, dy = p.y - pointer.y;
                    const d = Math.hypot(dx, dy);
                    if (d < 130 && d > 0.001) {
                        const f = (1 - d / 130) * 3.5;
                        fx += (dx / d) * f; fy += (dy / d) * f;
                    }
                }
                p.vx = (p.vx + fx) * damping; p.vy = (p.vy + fy) * damping;
                p.x += p.vx; p.y += p.vy;

                const alpha = clamp(0.12 + p.b * 0.55 + pulse * 0.15, 0.08, 0.72);
                ctx.globalAlpha = alpha;
                ctx.fillText(p.ch, p.x, p.y);
            }
            phase += 0.016;
            frameId = requestAnimationFrame(draw);
        }

        header.addEventListener('pointermove', (e) => {
            const r = canvas.getBoundingClientRect();
            pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
        }, { passive: true });
        header.addEventListener('pointerleave', () => { pointer = null; }, { passive: true });

        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                visible = e.isIntersecting;
                if (visible && !frameId) frameId = requestAnimationFrame(draw);
            });
        }, { threshold: 0 });
        obs.observe(header);

        rebuild();
        frameId = requestAnimationFrame(draw);

        let rt;
        window.addEventListener('resize', () => {
            clearTimeout(rt);
            rt = setTimeout(() => {
                if (isMobile()) { canvas.style.display = 'none'; visible = false; return; }
                canvas.style.display = ''; rebuild();
            }, 250);
        }, { passive: true });
    }

    /* ---------------------------------------------------------
       2) Cat overlay (walks on top of original content)
       --------------------------------------------------------- */
    function initCatOverlay() {
        if (reducedMotion || isMobile()) return;
        const about = document.querySelector('#about');
        if (!about) return;

        if (getComputedStyle(about).position === 'static') {
            about.style.position = 'relative';
        }

        let canvas = about.querySelector('.pretext-editorial-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'pretext-editorial-canvas';
            canvas.setAttribute('aria-hidden', 'true');
            about.appendChild(canvas);
        }
        const ctx = canvas.getContext('2d', { alpha: true });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const baseFontSize = Math.max(12, parseFloat(getComputedStyle(about).fontSize) || 16);
        const lineHeight = baseFontSize * 1.6;
        const catFont = `${Math.max(13, Math.round(baseFontSize * 0.82))}px "Courier New", Courier, monospace`;

        const walkFrames = [
            [' /\\_/\\', '( o.o )', ' > ^ < '],
            [' /\\_/\\', '( o.o )', ' < ^ > '],
            [' /\\_/\\', '( ^.^ )', ' > ^ < '],
        ];
        const sitFrames = [
            [' /\\_/\\', '( -.- )', '  z z z'],
            [' /\\_/\\', '( -.^ )', '  ~ ~ ~'],
        ];
        const pokedFrame = [' /\\_/\\', '( O.O )', '  !!! '];

        const cat = { x: -10, y: 0, vx: 0.35, vy: 0, settled: false, poked: 0 };
        const catW = 92, catH = 48;
        let pointer = null, phase = 0, visible = true, frameId = null;
        let sW = 0, sH = 0, contentBottom = 200;

        function measureContentZone() {
            const paragraphs = Array.from(about.querySelectorAll(':scope > p'));
            const h2 = about.querySelector('h2');
            const aboutRect = about.getBoundingClientRect();
            let bottom = 0;
            paragraphs.forEach((p) => {
                const r = p.getBoundingClientRect();
                bottom = Math.max(bottom, r.bottom - aboutRect.top);
            });
            if (h2) {
                const r = h2.getBoundingClientRect();
                bottom = Math.max(bottom, r.bottom - aboutRect.top);
            }
            const ticker = about.querySelector('.gh-ticker-container');
            if (ticker) {
                const r = ticker.getBoundingClientRect();
                bottom = Math.max(bottom, r.bottom - aboutRect.top);
            }
            contentBottom = bottom > 40 ? bottom : 200;
        }

        function sizeCanvas() {
            const rect = about.getBoundingClientRect();
            sW = rect.width;
            sH = rect.height;
            canvas.width = Math.round(sW * dpr);
            canvas.height = Math.round(sH * dpr);
            canvas.style.width = `${sW}px`;
            canvas.style.height = `${sH}px`;
            measureContentZone();
            cat.y = clamp(cat.y, 20, contentBottom - catH);
            cat.x = clamp(cat.x, -10, sW - catW);
        }

        function updateCat() {
            const yMin = 20, yMax = Math.max(yMin + 10, contentBottom - catH);
            if (!cat.settled) {
                cat.x += cat.vx;
                cat.vx = clamp(cat.vx + 0.002, 0.2, 0.6);
                if (pointer) {
                    const cx = cat.x + catW * 0.5, cy = cat.y + catH * 0.5;
                    const dx = cx - pointer.x, dy = cy - pointer.y;
                    const d = Math.hypot(dx, dy);
                    if (d < 120 && d > 1) {
                        cat.vx += (dx / d) * 0.18;
                        cat.vy += (dy / d) * 0.12;
                        if (d < 55) cat.poked = Math.min(1, cat.poked + 0.2);
                        else cat.poked *= 0.9;
                    } else { cat.poked *= 0.9; }
                } else { cat.poked *= 0.9; }
                cat.vy = cat.vy * 0.85 + Math.sin(phase * 0.9) * 0.04;
                cat.y = clamp(cat.y + cat.vy, yMin, yMax);
                if (cat.x >= sW * 0.72) {
                    cat.x = sW * 0.72;
                    cat.settled = true;
                    cat.vx = 0; cat.vy = 0;
                }
            } else if (pointer) {
                const cx = cat.x + catW * 0.5, cy = cat.y + catH * 0.5;
                const d = Math.hypot(cx - pointer.x, cy - pointer.y);
                if (d < 70) cat.poked = Math.min(1, cat.poked + 0.16);
                else cat.poked *= 0.93;
            } else { cat.poked *= 0.93; }
        }

        function draw() {
            frameId = null;
            if (!visible || sW < 10) return;
            const colors = getThemeColors();

            updateCat();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, sW, sH);

            let lines;
            if (cat.poked > 0.5) lines = pokedFrame;
            else if (cat.settled) lines = sitFrames[Math.floor(phase * 1.8) % 7 === 6 ? 1 : 0];
            else lines = walkFrames[Math.floor(phase * 5) % 3];

            const jumpY = cat.poked > 0.15 ? -Math.sin(cat.poked * Math.PI) * 12 : 0;
            ctx.font = catFont;
            ctx.textBaseline = 'top';
            ctx.globalAlpha = 0.92;
            ctx.fillStyle = colors.heading;
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], cat.x, cat.y + jumpY + i * (lineHeight * 0.72));
            }

            phase += 0.014;
            frameId = requestAnimationFrame(draw);
        }

        about.addEventListener('pointermove', (e) => {
            const r = about.getBoundingClientRect();
            pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
        }, { passive: true });
        about.addEventListener('pointerleave', () => { pointer = null; }, { passive: true });

        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                visible = e.isIntersecting;
                if (visible && !frameId) frameId = requestAnimationFrame(draw);
            });
        }, { threshold: 0 });
        obs.observe(about);

        sizeCanvas();
        // Start cat at the level of the second paragraph
        const paras = Array.from(about.querySelectorAll(':scope > p'));
        if (paras.length >= 2) {
            const r = paras[1].getBoundingClientRect();
            const ar = about.getBoundingClientRect();
            cat.y = r.top - ar.top;
        } else {
            cat.y = 60;
        }
        frameId = requestAnimationFrame(draw);

        let rt;
        window.addEventListener('resize', () => {
            clearTimeout(rt);
            rt = setTimeout(sizeCanvas, 250);
        }, { passive: true });
    }

    function runCascadeForElement(P, el, widthCache, delaySeed) {
        if (el.dataset.pretextCascade === '1') return;
        el.dataset.pretextCascade = '1';
        const font = getFontShorthand(el);
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) textNodes.push(node);
        const items = [];

        textNodes.forEach((tn) => {
            const txt = tn.nodeValue || '';
            if (!txt.trim()) return;
            const frag = document.createDocumentFragment();
            const chars = txt.split('');
            for (let i = 0; i < chars.length; i += 1) {
                const ch = chars[i];
                const span = document.createElement('span');
                span.className = 'pretext-cascade-char';
                span.style.display = 'inline-block';
                span.style.width = `${charWidth(P, ch, font, widthCache)}px`;
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                const sx = rand(-11, 11);
                const sy = rand(20, 52);
                span.style.transform = `translate(${sx}px, ${sy}px)`;
                span.style.opacity = '0';
                frag.appendChild(span);
                items.push({
                    span,
                    x: sx,
                    y: sy,
                    vx: 0,
                    vy: 0,
                    opacity: 0,
                    delay: delaySeed + (i * 16) + rand(0, 35)
                });
            }
            tn.parentNode.replaceChild(frag, tn);
        });

        if (!items.length) return;
        const startTs = performance.now();
        function tick(now) {
            const t = now - startTs;
            let active = false;
            for (let i = 0; i < items.length; i += 1) {
                const it = items[i];
                if (t < it.delay) { active = true; continue; }
                it.vx = (it.vx + (-it.x * 0.12)) * 0.8;
                it.vy = (it.vy + (-it.y * 0.12)) * 0.8;
                it.x += it.vx;
                it.y += it.vy;
                it.opacity = Math.min(1, it.opacity + 0.12);
                it.span.style.transform = `translate(${it.x.toFixed(1)}px, ${it.y.toFixed(1)}px)`;
                it.span.style.opacity = it.opacity.toFixed(2);
                if (Math.abs(it.x) > 0.3 || Math.abs(it.y) > 0.3 || it.opacity < 0.98) active = true;
            }
            if (active) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    /* ---------------------------------------------------------
       3) Heading character cascade (spring settle)
       --------------------------------------------------------- */
    function initCharCascade(P) {
        if (reducedMotion) return;
        const headings = Array.from(document.querySelectorAll('h2'));
        if (!headings.length) return;
        const widthCache = new Map();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) runCascadeForElement(P, e.target, widthCache, 0);
            });
        }, { threshold: 0.28 });
        headings.forEach((h) => observer.observe(h));
    }

    /* ---------------------------------------------------------
       4) Timeline title cascade (portfolio)
       --------------------------------------------------------- */
    function initTimelineCascade(P) {
        if (reducedMotion) return;
        const entries = Array.from(document.querySelectorAll('.timeline-entry-container .timeline-title'));
        if (!entries.length) return;
        const widthCache = new Map();
        const observer = new IntersectionObserver((nodes) => {
            nodes.forEach((node) => {
                if (!node.isIntersecting) return;
                const idx = entries.indexOf(node.target);
                runCascadeForElement(P, node.target, widthCache, Math.max(0, idx) * 100);
                observer.unobserve(node.target);
            });
        }, { threshold: 0.22 });
        entries.forEach((el) => observer.observe(el));
    }

    /* ---------------------------------------------------------
       5) Tight-wrap recommendation quotes
       --------------------------------------------------------- */
    function initTightQuotes(P) {
        const quotes = Array.from(document.querySelectorAll('.recommendation-item p, .recommendation-content p'));
        if (!quotes.length) return;

        const handles = [];
        quotes.forEach((q) => {
            const text = (q.textContent || '').trim();
            if (text.length < 32) return;
            q.style.maxWidth = '';
            const width = q.offsetWidth;
            if (!width) return;
            const lineHeight = lineHeightOf(q);
            const prepared = P.prepare(text, getFontShorthand(q));
            const base = P.layout(prepared, width, lineHeight);
            if (base.lineCount <= 1) return;
            const tight = binaryTighten(P, prepared, lineHeight, width, base.lineCount);
            q.style.maxWidth = `${tight}px`;
            q.classList.add('pretext-tight-quote');
            handles.push({ el: q, prepared, lineHeight });
        });

        let rt;
        window.addEventListener('resize', () => {
            clearTimeout(rt);
            rt = setTimeout(() => {
                handles.forEach((h) => {
                    h.el.style.maxWidth = '';
                    const width = h.el.offsetWidth;
                    if (!width) return;
                    const base = P.layout(h.prepared, width, h.lineHeight);
                    if (base.lineCount <= 1) return;
                    h.el.style.maxWidth = `${binaryTighten(P, h.prepared, h.lineHeight, width, base.lineCount)}px`;
                });
            }, 260);
        }, { passive: true });
    }

    /* ---------------------------------------------------------
       6) Photo quote one-shot wave
       --------------------------------------------------------- */
    function initCaptionWave(P) {
        if (reducedMotion) return;
        const quotes = Array.from(document.querySelectorAll('.photo-quote'));
        if (!quotes.length) return;
        const widthCache = new Map();

        function animateQuote(el) {
            if (el.dataset.pretextCaptionWave === '1') return;
            el.dataset.pretextCaptionWave = '1';
            const text = (el.textContent || '').trim();
            if (!text) return;
            const font = getFontShorthand(el);

            const chars = text.split('');
            el.innerHTML = '';
            const spans = chars.map((ch, i) => {
                const s = document.createElement('span');
                s.className = 'pretext-caption-char';
                s.style.display = 'inline-block';
                s.style.width = `${charWidth(P, ch, font, widthCache)}px`;
                s.textContent = ch === ' ' ? '\u00A0' : ch;
                s.style.transform = `translateY(${8 + Math.sin(i * 0.35) * 10}px)`;
                s.style.opacity = '0';
                el.appendChild(s);
                return { s, delay: i * 14 };
            });

            const start = performance.now();
            function tick(now) {
                const t = now - start;
                let active = false;
                for (let i = 0; i < spans.length; i += 1) {
                    const { s, delay } = spans[i];
                    const local = Math.max(0, t - delay);
                    const k = Math.min(1, local / 800);
                    const eased = 1 - Math.pow(1 - k, 3);
                    const y = (1 - eased) * (8 + Math.sin(i * 0.35) * 10);
                    s.style.transform = `translateY(${y.toFixed(2)}px)`;
                    s.style.opacity = eased.toFixed(3);
                    if (k < 1) active = true;
                }
                if (active) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) animateQuote(entry.target);
            });
        }, { threshold: 0.24 });
        quotes.forEach((q) => observer.observe(q));
    }

    /* ---------------------------------------------------------
       7) 404 particle text
       --------------------------------------------------------- */
    function init404Particles() {
        if (reducedMotion) return;
        const title = document.querySelector('.error-container h1');
        if (!title) return;
        const text = (title.textContent || '').trim();
        if (!text || !/404/.test(text)) return;

        let canvas = title.parentElement.querySelector('.pretext-404-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'pretext-404-canvas';
            canvas.setAttribute('aria-hidden', 'true');
            title.parentElement.appendChild(canvas);
        }
        if (getComputedStyle(title.parentElement).position === 'static') {
            title.parentElement.style.position = 'relative';
        }
        title.classList.add('pretext-hide-404-title');

        const ctx = canvas.getContext('2d', { alpha: true });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const ramp = ' .:-=+*#%@'.split('');
        const font = `${Math.max(24, Math.round(parseFloat(getComputedStyle(title).fontSize) * 0.22))}px ${getComputedStyle(document.body).fontFamily}`;
        let points = [];
        let w = 0, h = 0, visible = true, frameId = null, pointer = null;

        function rebuild() {
            const rect = title.getBoundingClientRect();
            w = Math.max(1, rect.width);
            h = Math.max(1, rect.height);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;

            const off = document.createElement('canvas');
            off.width = Math.max(10, Math.round(w / 8));
            off.height = Math.max(10, Math.round(h / 10));
            const oc = off.getContext('2d');
            oc.fillStyle = '#000';
            oc.fillRect(0, 0, off.width, off.height);
            oc.fillStyle = '#fff';
            oc.font = `700 ${Math.min(off.width, off.height) * 0.8}px ${getComputedStyle(title).fontFamily}`;
            oc.textAlign = 'center';
            oc.textBaseline = 'middle';
            oc.fillText('404', off.width * 0.5, off.height * 0.5);
            const data = oc.getImageData(0, 0, off.width, off.height).data;
            points = [];
            const sx = w / off.width;
            const sy = h / off.height;
            for (let y = 0; y < off.height; y += 1) {
                for (let x = 0; x < off.width; x += 1) {
                    const b = data[(y * off.width + x) * 4] / 255;
                    if (b < 0.14) continue;
                    points.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        vx: 0, vy: 0,
                        tx: x * sx,
                        ty: y * sy,
                        ch: ramp[Math.round(b * (ramp.length - 1))] || '#',
                        b
                    });
                }
            }
        }

        function draw(now) {
            frameId = null;
            if (!visible) return;
            const colors = getThemeColors();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            ctx.font = font;
            ctx.textBaseline = 'top';
            ctx.fillStyle = colors.accent;

            for (let i = 0; i < points.length; i += 1) {
                const p = points[i];
                let fx = (p.tx - p.x) * 0.025;
                let fy = (p.ty - p.y) * 0.025;
                if (pointer) {
                    const dx = p.x - pointer.x;
                    const dy = p.y - pointer.y;
                    const d = Math.hypot(dx, dy);
                    if (d < 90 && d > 0.001) {
                        const f = (1 - d / 90) * 1.6;
                        fx += (dx / d) * f;
                        fy += (dy / d) * f;
                    }
                }
                p.vx = (p.vx + fx) * 0.87;
                p.vy = (p.vy + fy) * 0.87;
                p.x += p.vx;
                p.y += p.vy;
                ctx.globalAlpha = clamp(0.08 + p.b * 0.22, 0.04, 0.3);
                ctx.fillText(p.ch, p.x, p.y);
            }
            frameId = requestAnimationFrame(draw);
        }

        title.parentElement.addEventListener('pointermove', (e) => {
            const r = canvas.getBoundingClientRect();
            pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
        }, { passive: true });
        title.parentElement.addEventListener('pointerleave', () => { pointer = null; }, { passive: true });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                visible = entry.isIntersecting;
                if (visible && !frameId) frameId = requestAnimationFrame(draw);
            });
        }, { threshold: 0 });
        observer.observe(title);

        rebuild();
        frameId = requestAnimationFrame(draw);

        let rt;
        window.addEventListener('resize', () => {
            clearTimeout(rt);
            rt = setTimeout(rebuild, 250);
        }, { passive: true });
    }

    /* ---------------------------------------------------------
       Practical typography polish
       --------------------------------------------------------- */
    function initBalancedSiteText(P) {
        const sels = ['h2', '.subtitle', '.project-content p', '.timeline-description',
            '.recommendation-content p', '.photo-quote', '.photo-caption',
            '.error-subtitle', '.gpg-section > p'];
        const targets = Array.from(document.querySelectorAll(sels.join(',')));
        const handles = [];
        targets.forEach((el) => {
            const text = (el.textContent || '').trim();
            if (text.length < 18) return;
            el.style.maxWidth = '';
            const w = el.offsetWidth;
            if (!w) return;
            const lh = lineHeightOf(el);
            const prep = P.prepare(text, getFontShorthand(el));
            const base = P.layout(prep, w, lh);
            if (base.lineCount <= 1) return;
            el.style.maxWidth = binaryTighten(P, prep, lh, w, base.lineCount) + 'px';
            el.classList.add('pretext-balanced');
            handles.push({ el, prep, lh });
        });
        let rt;
        window.addEventListener('resize', () => {
            clearTimeout(rt);
            rt = setTimeout(() => {
                handles.forEach((h) => {
                    h.el.style.maxWidth = '';
                    const w = h.el.offsetWidth;
                    if (!w) return;
                    const base = P.layout(h.prep, w, h.lh);
                    if (base.lineCount <= 1) return;
                    h.el.style.maxWidth = binaryTighten(P, h.prep, h.lh, w, base.lineCount) + 'px';
                });
            }, 280);
        }, { passive: true });
    }

    function initTightBlogHeadlines(P) {
        const grids = ['#recent-medium-posts', '#medium-posts'].map((id) => document.querySelector(id)).filter(Boolean);
        if (!grids.length) return;
        function run(scope) {
            scope.querySelectorAll('.blog-post').forEach((post) => {
                const h = post.querySelector('h3');
                if (!h) return;
                const text = (h.textContent || '').trim();
                if (!text) return;
                h.style.maxWidth = '';
                const w = h.offsetWidth || post.clientWidth - 24;
                if (!w) return;
                const lh = lineHeightOf(h);
                const prep = P.prepareWithSegments(text, getFontShorthand(h));
                let lines = 0;
                P.walkLineRanges(prep, w, () => { lines++; });
                if (lines <= 1) return;
                let lo = Math.max(110, w * 0.45), hi = w;
                while (hi - lo > 1) {
                    const mid = (lo + hi) / 2;
                    let n = 0; P.walkLineRanges(prep, mid, () => { n++; });
                    if (n <= lines) hi = mid; else lo = mid;
                }
                h.style.maxWidth = Math.ceil(hi) + 'px';
                post.classList.add('pretext-tight-card');
            });
        }
        grids.forEach((g) => {
            const mo = new MutationObserver(() => requestAnimationFrame(() => run(g)));
            mo.observe(g, { childList: true, subtree: true });
            requestAnimationFrame(() => run(g));
        });
    }

    function initNoShiftLoading(P) {
        const grids = ['#recent-medium-posts', '#medium-posts'].map((id) => document.querySelector(id)).filter(Boolean);
        grids.forEach((g) => {
            if (g.querySelector('.blog-post')) return;
            const w = Math.max(280, Math.min(360, g.clientWidth || 320));
            const bf = getComputedStyle(document.body).fontFamily;
            const th = P.layout(P.prepare('Loading a polished article title', '700 1.2rem ' + bf), w - 48, 28).height;
            const dh = P.layout(P.prepare('A concise excerpt for a layout placeholder.', '1rem ' + bf), w - 48, 22).height;
            g.style.minHeight = Math.round(th + dh + 96) + 'px';
            g.classList.add('pretext-reserved-height');
            const mo = new MutationObserver(() => {
                setTimeout(() => {
                    g.style.minHeight = '';
                    g.classList.remove('pretext-reserved-height');
                    const cards = Array.from(g.querySelectorAll('.blog-post'));
                    cards.forEach((card) => {
                        const h3 = card.querySelector('h3');
                        const p = card.querySelector('p');
                        if (!h3 || !p) return;
                        const cardW = Math.max(240, card.clientWidth - 32);
                        const hPrep = P.prepare((h3.textContent || '').trim(), getFontShorthand(h3));
                        const pPrep = P.prepare((p.textContent || '').trim(), getFontShorthand(p));
                        const hH = P.layout(hPrep, cardW, lineHeightOf(h3)).height;
                        const pH = P.layout(pPrep, cardW, lineHeightOf(p)).height;
                        const predicted = Math.ceil(hH + pH + 120);
                        card.style.maxHeight = `${predicted}px`;
                        card.classList.add('pretext-card-measured');
                    });
                }, 100);
                mo.disconnect();
            });
            mo.observe(g, { childList: true });
        });
    }

    /* ---------------------------------------------------------
       Magnetic jump on project h3 titles
       --------------------------------------------------------- */
    function initMagneticTitles(P) {
        if (reducedMotion || isMobile()) return;
        const cards = Array.from(document.querySelectorAll('.project-card-enhanced'));
        if (!cards.length) return;
        const widthCache = new Map();

        cards.forEach((card) => {
            const h3 = card.querySelector('.project-header h3');
            if (!h3 || h3.dataset.pretextMag === '1') return;
            h3.dataset.pretextMag = '1';
            const font = getFontShorthand(h3);
            const text = (h3.textContent || '').trim();
            if (!text) return;

            h3.style.overflow = 'visible';
            h3.style.position = 'relative';
            h3.style.zIndex = '2';

            const chars = text.split('');
            h3.textContent = '';
            const items = [];
            chars.forEach((ch) => {
                const s = document.createElement('span');
                s.className = 'pretext-mag-char';
                s.style.display = 'inline-block';
                s.style.width = `${charWidth(P, ch, font, widthCache)}px`;
                s.textContent = ch === ' ' ? '\u00A0' : ch;
                h3.appendChild(s);
                items.push({ s, ox: 0, oy: 0, vx: 0, vy: 0 });
            });
            if (!items.length) return;

            let frameId = null, hovered = false, pointer = null;

            function tick() {
                frameId = null;
                let anyActive = false;
                for (let i = 0; i < items.length; i++) {
                    const it = items[i];
                    let tx = 0, ty = 0;

                    if (hovered && pointer) {
                        const r = it.s.getBoundingClientRect();
                        const cx = r.left + r.width * 0.5;
                        const cy = r.top + r.height * 0.5;
                        const dx = cx - pointer.x;
                        const dy = cy - pointer.y;
                        const d = Math.hypot(dx, dy);
                        if (d < 180 && d > 0.5) {
                            const mag = Math.pow(1 - d / 180, 1.5) * 28;
                            tx = (dx / d) * mag;
                            ty = (dy / d) * mag - 6;
                        }
                    } else if (hovered) {
                        // Card hovered but no pointer coords yet: gentle upward bounce
                        ty = -4 - Math.sin((performance.now() * 0.004) + i * 0.5) * 3;
                    }

                    const springK = 0.14;
                    const damp = 0.68;
                    it.vx = (it.vx + (tx - it.ox) * springK) * damp;
                    it.vy = (it.vy + (ty - it.oy) * springK) * damp;
                    it.ox += it.vx;
                    it.oy += it.vy;
                    it.s.style.transform = `translate(${it.ox.toFixed(1)}px,${it.oy.toFixed(1)}px)`;
                    if (Math.abs(it.vx) > 0.08 || Math.abs(it.vy) > 0.08 ||
                        Math.abs(it.ox - tx) > 0.2 || Math.abs(it.oy - ty) > 0.2) {
                        anyActive = true;
                    }
                }
                if (anyActive || hovered) frameId = requestAnimationFrame(tick);
            }

            function startLoop() {
                if (!frameId) frameId = requestAnimationFrame(tick);
            }

            card.addEventListener('pointerenter', () => {
                hovered = true;
                startLoop();
            }, { passive: true });
            card.addEventListener('pointermove', (e) => {
                pointer = { x: e.clientX, y: e.clientY };
                hovered = true;
                startLoop();
            }, { passive: true });
            card.addEventListener('pointerleave', () => {
                hovered = false;
                pointer = null;
                startLoop();
            }, { passive: true });
        });
    }

    /* ---------------------------------------------------------
       Hover jump on h2 headings
       --------------------------------------------------------- */
    function initHoverJump() {
        if (reducedMotion || isMobile()) return;
        const headings = Array.from(document.querySelectorAll('h2'));
        if (!headings.length) return;

        headings.forEach((h2) => {
            if (h2.dataset.pretextHover === '1') return;
            h2.dataset.pretextHover = '1';

            let spans = null;
            let items = null;
            let frameId = null;
            let pointer = null;
            let hovered = false;

            function ensureSpans() {
                if (spans) return true;
                spans = Array.from(h2.querySelectorAll('.pretext-cascade-char'));
                if (spans.length > 0) {
                    items = spans.map((s) => ({ s, ox: 0, oy: 0, vx: 0, vy: 0 }));
                    return true;
                }
                spans = null;
                items = null;
                return false;
            }

            function tick() {
                frameId = null;
                if (!items) return;
                let anyActive = false;
                for (let i = 0; i < items.length; i++) {
                    const it = items[i];
                    let tx = 0, ty = 0;
                    if (hovered && pointer) {
                        const r = it.s.getBoundingClientRect();
                        const cx = r.left + r.width * 0.5;
                        const cy = r.top + r.height * 0.5;
                        const dx = cx - pointer.x;
                        const dy = cy - pointer.y;
                        const d = Math.hypot(dx, dy);
                        if (d < 160 && d > 0.5) {
                            const mag = Math.pow(1 - d / 160, 1.4) * 22;
                            tx = (dx / d) * mag;
                            ty = (dy / d) * mag - 5;
                        }
                    } else if (hovered) {
                        ty = -3 - Math.sin(performance.now() * 0.005 + i * 0.6) * 3;
                    }
                    it.vx = (it.vx + (tx - it.ox) * 0.15) * 0.7;
                    it.vy = (it.vy + (ty - it.oy) * 0.15) * 0.7;
                    it.ox += it.vx;
                    it.oy += it.vy;
                    it.s.style.transform = `translate(${it.ox.toFixed(1)}px,${it.oy.toFixed(1)}px)`;
                    if (Math.abs(it.vx) > 0.06 || Math.abs(it.vy) > 0.06 ||
                        Math.abs(it.ox - tx) > 0.15 || Math.abs(it.oy - ty) > 0.15) {
                        anyActive = true;
                    }
                }
                if (anyActive || hovered) frameId = requestAnimationFrame(tick);
            }

            function start() {
                if (!ensureSpans()) return;
                if (!frameId) frameId = requestAnimationFrame(tick);
            }

            h2.addEventListener('pointerenter', () => { hovered = true; start(); }, { passive: true });
            h2.addEventListener('pointermove', (e) => {
                pointer = { x: e.clientX, y: e.clientY };
                hovered = true;
                start();
            }, { passive: true });
            h2.addEventListener('pointerleave', () => {
                hovered = false; pointer = null; start();
            }, { passive: true });
        });
    }

    /* ---------------------------------------------------------
       Dancing ASCII figure in contact section
       --------------------------------------------------------- */
    function initDancingFigure() {
        if (reducedMotion) return;
        const contact = document.querySelector('#contact');
        if (!contact) return;
        const gpg = contact.querySelector('.gpg-section');
        if (!gpg) return;

        const container = document.createElement('div');
        container.className = 'pretext-dancer-wrap';
        container.setAttribute('aria-hidden', 'true');
        gpg.parentNode.insertBefore(container, gpg);

        const canvas = document.createElement('canvas');
        canvas.className = 'pretext-dancer-canvas';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const W = 200, H = 160;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);

        // Stick figure with physics joints
        const joints = {
            head:  { x: W/2, y: 30 },
            neck:  { x: W/2, y: 42 },
            hip:   { x: W/2, y: 82 },
            lHand: { x: W/2 - 28, y: 55 },
            rHand: { x: W/2 + 28, y: 55 },
            lFoot: { x: W/2 - 18, y: 130 },
            rFoot: { x: W/2 + 18, y: 130 },
        };

        // Keyframes: each is [lHandAngle, rHandAngle, lFootAngle, rFootAngle, headBob]
        const keyframes = [
            [-1.3,  1.3,  -0.3,  0.3,  0],
            [ 0.5, -0.5,   0.4, -0.4, -4],
            [-0.8,  2.0,   0.2, -0.3, -2],
            [ 2.0, -0.8,  -0.3,  0.2, -2],
            [-1.6,  1.6,  -0.5,  0.5, -6],
            [ 0.0,  0.0,   0.3, -0.3,  0],
            [ 1.2, -1.8,   0.5, -0.5, -3],
            [-1.8,  1.2,  -0.5,  0.5, -3],
            [-2.2,  2.2,  -0.2,  0.2, -8],
            [ 0.3, -0.3,   0.4, -0.4, -1],
            [ 1.5, -0.2,  -0.4,  0.6, -5],
            [-0.2,  1.5,   0.6, -0.4, -5],
        ];

        let pointer = null;
        let visible = false;
        let rafId = null;
        const armLen = 32, legLen = 48;

        function lerp(a, b, t) { return a + (b - a) * t; }

        function draw(now) {
            rafId = null;
            if (!visible) return;
            const t = now * 0.0018;
            const kfIdx = Math.floor(t) % keyframes.length;
            const kfNext = (kfIdx + 1) % keyframes.length;
            const frac = t - Math.floor(t);
            const smooth = frac * frac * (3 - 2 * frac);
            const kf = keyframes[kfIdx];
            const kn = keyframes[kfNext];
            const la = lerp(kf[0], kn[0], smooth);
            const ra = lerp(kf[1], kn[1], smooth);
            const ll = lerp(kf[2], kn[2], smooth);
            const rl = lerp(kf[3], kn[3], smooth);
            const hb = lerp(kf[4], kn[4], smooth);

            const baseX = W / 2 + Math.sin(t * 1.7) * 8;
            const baseY = 82;
            const neckX = baseX;
            const neckY = 42 + hb * 0.3;
            const headY = 28 + hb;

            // Mouse influence
            let mfx = 0, mfy = 0;
            if (pointer) {
                const dx = pointer.x - baseX;
                const dy = pointer.y - baseY;
                mfx = clamp(dx * 0.08, -12, 12);
                mfy = clamp(dy * 0.05, -8, 8);
            }

            const lhx = neckX + Math.sin(la) * armLen + mfx * 0.5;
            const lhy = neckY + Math.cos(la) * armLen + mfy * 0.3;
            const rhx = neckX + Math.sin(ra) * armLen + mfx * 0.5;
            const rhy = neckY + Math.cos(ra) * armLen + mfy * 0.3;
            const lfx = baseX + Math.sin(ll) * legLen + mfx * 0.2;
            const lfy = baseY + Math.cos(ll) * legLen;
            const rfx = baseX + Math.sin(rl) * legLen + mfx * 0.2;
            const rfy = baseY + Math.cos(rl) * legLen;

            const colors = getThemeColors();
            ctx.clearRect(0, 0, W, H);
            ctx.strokeStyle = colors.accent;
            ctx.fillStyle = colors.accent;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.85;

            // Head
            ctx.beginPath();
            ctx.arc(baseX + mfx * 0.3, headY + mfy * 0.2, 11, 0, Math.PI * 2);
            ctx.stroke();
            // Eyes
            ctx.globalAlpha = 0.6;
            const eyeY = headY + mfy * 0.2 - 1;
            ctx.fillRect(baseX + mfx * 0.3 - 4, eyeY, 2, 2);
            ctx.fillRect(baseX + mfx * 0.3 + 3, eyeY, 2, 2);
            ctx.globalAlpha = 0.85;

            // Spine
            ctx.beginPath();
            ctx.moveTo(neckX + mfx * 0.3, neckY);
            ctx.lineTo(baseX, baseY);
            ctx.stroke();
            // Arms
            ctx.beginPath();
            ctx.moveTo(neckX + mfx * 0.3, neckY);
            ctx.lineTo(lhx, lhy);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(neckX + mfx * 0.3, neckY);
            ctx.lineTo(rhx, rhy);
            ctx.stroke();
            // Legs
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(lfx, lfy);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(rfx, rfy);
            ctx.stroke();

            // Floor shadow
            ctx.globalAlpha = 0.12;
            ctx.beginPath();
            ctx.ellipse(baseX, H - 14, 28 + Math.abs(hb), 4, 0, 0, Math.PI * 2);
            ctx.fill();

            rafId = requestAnimationFrame(draw);
        }

        container.addEventListener('pointermove', (e) => {
            const r = canvas.getBoundingClientRect();
            pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
        }, { passive: true });
        container.addEventListener('pointerleave', () => { pointer = null; }, { passive: true });

        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                visible = e.isIntersecting;
                if (visible && !rafId) rafId = requestAnimationFrame(draw);
            });
        }, { threshold: 0.1 });
        obs.observe(container);
    }

    function initAll(P) {
        initAsciiQ(P);
        initCatOverlay();
        init404Particles();
        initCharCascade(P);
        initTimelineCascade(P);
        initTightQuotes(P);
        initCaptionWave(P);
        initMagneticTitles(P);
        initHoverJump();
        initDancingFigure();
        initBalancedSiteText(P);
        initTightBlogHeadlines(P);
        initNoShiftLoading(P);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => waitForPretext(initAll), { once: true });
    } else {
        waitForPretext(initAll);
    }
})();
