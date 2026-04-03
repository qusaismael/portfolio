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
        const ramp = ' .:-=+*#%@'.split('');
        let pointer = null, phase = 0, pulse = 0, nextPulseAt = 2200;
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
            const cx = cW / 2, cy = cH / 2;
            particles = [];
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const b = data[(y * cols + x) * 4] / 255;
                    if (b < 0.05) continue;
                    const tx = x * cellW, ty = y * cellH;
                    particles.push({
                        x: Math.random() * cW, y: Math.random() * cH,
                        vx: (Math.random() - 0.5) * 2.2, vy: (Math.random() - 0.5) * 2.2,
                        tx, ty, b,
                        ch: ramp[Math.round(b * (ramp.length - 1))] || '#'
                    });
                }
            }
        }

        function draw(now) {
            frameId = null;
            if (!visible) return;
            const colors = getThemeColors();
            const springK = 0.028 + pulse * 0.05;
            const damping = 0.87;
            const wobble = 0.9 + Math.sin(phase * 0.45) * 0.22;

            if (now > nextPulseAt) { pulse = 1; nextPulseAt = now + rand(2600, 4300); }
            pulse *= 0.94;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, cW, cH);
            ctx.font = font;
            ctx.textBaseline = 'top';
            ctx.fillStyle = colors.accent;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                let fx = (p.tx - p.x) * springK;
                let fy = (p.ty - p.y) * springK;
                if (pointer) {
                    const dx = p.x - pointer.x, dy = p.y - pointer.y;
                    const d = Math.hypot(dx, dy);
                    if (d < 90 && d > 0.001) {
                        const f = (1 - d / 90) * 1.7;
                        fx += (dx / d) * f; fy += (dy / d) * f;
                    }
                }
                p.vx = (p.vx + fx) * damping; p.vy = (p.vy + fy) * damping;
                p.x += p.vx; p.y += p.vy;
                ctx.globalAlpha = clamp((0.07 + p.b * 0.18) * wobble, 0.03, 0.28);
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
       2) Editorial orb reflow (layoutNextLine)
       --------------------------------------------------------- */
    function initEditorialReflow(P) {
        if (reducedMotion || isMobile()) return;
        const about = document.querySelector('#about');
        if (!about) return;
        const paragraphs = Array.from(about.querySelectorAll(':scope > p'));
        if (!paragraphs.length) return;
        const h2El = about.querySelector('h2');

        let canvas = about.querySelector('.pretext-editorial-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'pretext-editorial-canvas';
            canvas.setAttribute('aria-hidden', 'true');
            about.appendChild(canvas);
        }
        const ctx = canvas.getContext('2d', { alpha: true });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        paragraphs.forEach((p) => p.classList.add('pretext-editorial-source'));

        const sourceText = paragraphs
            .map((p) => (p.textContent || '').replace(/\s+/g, ' ').trim())
            .filter(Boolean).join('\n\n');
        if (!sourceText) return;

        const font = getFontShorthand(paragraphs[0]);
        const lineHeight = lineHeightOf(paragraphs[0]);
        const prepared = P.prepareWithSegments(sourceText, font, { whiteSpace: 'pre-wrap' });
        let pointer = null, phase = 0, visible = true, frameId = null;
        let sW = 0, sH = 0, textTop = 36;

        const orbs = [];
        for (let i = 0; i < 3; i++) {
            orbs.push({
                x: 160 + i * 140, y: 180 + i * 40,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                r: 42 + i * 12
            });
        }

        function sizeCanvas() {
            const rect = about.getBoundingClientRect();
            sW = rect.width; sH = rect.height;
            textTop = h2El ? h2El.offsetHeight + 20 : 36;
            canvas.width = Math.round(sW * dpr);
            canvas.height = Math.round(sH * dpr);
            canvas.style.width = sW + 'px';
            canvas.style.height = sH + 'px';
            for (let i = 0; i < orbs.length; i++) {
                const o = orbs[i];
                o.x = clamp(o.x, o.r + 14, sW - o.r - 14);
                o.y = clamp(o.y, textTop + o.r, sH - 18 - o.r);
            }
        }

        function updateOrbs() {
            const textBottom = sH - 18;
            for (let i = 0; i < orbs.length; i++) {
                const o = orbs[i];
                o.x += o.vx; o.y += o.vy;
                o.vx *= 0.996; o.vy *= 0.996;
                o.vx += Math.sin(phase + i * 0.9) * 0.003;
                o.vy += Math.cos(phase * 1.1 + i * 0.7) * 0.003;
                if (pointer) {
                    const dx = o.x - pointer.x, dy = o.y - pointer.y;
                    const d = Math.hypot(dx, dy);
                    if (d < 140 && d > 0.001) {
                        const push = (1 - d / 140) * 0.36;
                        o.vx += (dx / d) * push; o.vy += (dy / d) * push;
                    }
                }
                if (o.x < o.r + 14) { o.x = o.r + 14; o.vx = Math.abs(o.vx) * 0.95; }
                else if (o.x > sW - o.r - 14) { o.x = sW - o.r - 14; o.vx = -Math.abs(o.vx) * 0.95; }
                if (o.y < textTop + o.r) { o.y = textTop + o.r; o.vy = Math.abs(o.vy) * 0.95; }
                else if (o.y > textBottom - o.r) { o.y = textBottom - o.r; o.vy = -Math.abs(o.vy) * 0.95; }
            }
        }

        function draw() {
            frameId = null;
            if (!visible || sW < 10) return;
            const colors = getThemeColors();
            const textLeft = 8, textRight = sW - 8, textBottom = sH - 18;

            updateOrbs();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, sW, sH);
            ctx.font = font; ctx.textBaseline = 'top'; ctx.fillStyle = colors.text;

            let cursor = { segmentIndex: 0, graphemeIndex: 0 };
            let y = textTop, guard = 0;
            while (guard < 300 && y <= textBottom) {
                guard++;
                const lineMid = y + lineHeight * 0.52;
                let slotL = textLeft, slotR = textRight;

                for (let i = 0; i < orbs.length; i++) {
                    const o = orbs[i];
                    const dy = lineMid - o.y;
                    if (Math.abs(dy) >= o.r) continue;
                    const half = Math.sqrt(o.r * o.r - dy * dy);
                    const bL = o.x - half - 10, bR = o.x + half + 10;
                    if (bL <= slotL && bR >= slotR) { slotL = slotR; break; }
                    if (bL > slotL && bR < slotR) {
                        const leftW = bL - slotL, rightW = slotR - bR;
                        if (leftW >= rightW) slotR = bL;
                        else slotL = bR;
                    } else if (bL <= slotL) { slotL = Math.max(slotL, bR); }
                    else if (bR >= slotR) { slotR = Math.min(slotR, bL); }
                }

                const avail = slotR - slotL;
                if (avail < 60) { y += lineHeight; continue; }
                const line = P.layoutNextLine(prepared, cursor, avail);
                if (!line) break;
                ctx.globalAlpha = 0.92;
                ctx.fillText(line.text, slotL, y);
                cursor = line.end;
                y += lineHeight;
            }

            ctx.fillStyle = colors.accent;
            for (let i = 0; i < orbs.length; i++) {
                const o = orbs[i];
                const grad = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, o.r * 1.4);
                grad.addColorStop(0, 'rgba(' + colors.primaryRgb + ',0.22)');
                grad.addColorStop(0.6, 'rgba(' + colors.primaryRgb + ',0.10)');
                grad.addColorStop(1, 'rgba(' + colors.primaryRgb + ',0)');
                ctx.globalAlpha = 1; ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 1.4, 0, 6.2832); ctx.fill();
                ctx.fillStyle = colors.accent;
                ctx.globalAlpha = 0.55 + Math.sin(phase + i) * 0.08;
                ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.22, 0, 6.2832); ctx.fill();
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
        frameId = requestAnimationFrame(draw);

        let rt;
        window.addEventListener('resize', () => {
            clearTimeout(rt);
            rt = setTimeout(sizeCanvas, 250);
        }, { passive: true });
    }

    /* ---------------------------------------------------------
       3) Heading character cascade (spring settle)
       --------------------------------------------------------- */
    function initCharCascade(P) {
        if (reducedMotion) return;
        const headings = Array.from(document.querySelectorAll('h2'));
        if (!headings.length) return;
        const widthCache = new Map();

        function animateChars(items) {
            const startTs = performance.now();
            function tick(now) {
                const t = now - startTs;
                let active = false;
                for (let i = 0; i < items.length; i++) {
                    const it = items[i];
                    if (t < it.delay) { active = true; continue; }
                    it.vx = (it.vx + (-it.x * 0.12)) * 0.8;
                    it.vy = (it.vy + (-it.y * 0.12)) * 0.8;
                    it.x += it.vx; it.y += it.vy;
                    it.opacity = Math.min(1, it.opacity + 0.12);
                    it.span.style.transform = 'translate(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px)';
                    it.span.style.opacity = it.opacity.toFixed(2);
                    if (Math.abs(it.x) > 0.3 || Math.abs(it.y) > 0.3 || it.opacity < 0.98) active = true;
                }
                if (active) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }

        function revealHeading(el) {
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
                for (let i = 0; i < chars.length; i++) {
                    const ch = chars[i];
                    const span = document.createElement('span');
                    span.className = 'pretext-cascade-char';
                    span.style.display = 'inline-block';
                    span.style.width = charWidth(P, ch, font, widthCache) + 'px';
                    span.textContent = ch === ' ' ? '\u00A0' : ch;
                    const sx = rand(-11, 11), sy = rand(20, 52);
                    span.style.transform = 'translate(' + sx + 'px,' + sy + 'px)';
                    span.style.opacity = '0';
                    frag.appendChild(span);
                    items.push({ span, x: sx, y: sy, vx: 0, vy: 0, opacity: 0, delay: i * 16 + rand(0, 35) });
                }
                tn.parentNode.replaceChild(frag, tn);
            });
            if (items.length) animateChars(items);
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) revealHeading(e.target); });
        }, { threshold: 0.28 });
        headings.forEach((h) => observer.observe(h));
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
                setTimeout(() => { g.style.minHeight = ''; g.classList.remove('pretext-reserved-height'); }, 100);
                mo.disconnect();
            });
            mo.observe(g, { childList: true });
        });
    }

    function initAll(P) {
        initAsciiQ(P);
        initEditorialReflow(P);
        initCharCascade(P);
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
