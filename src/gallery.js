/* ============================================
   Accessible Photo Gallery (Dynamic JSON Loader)
   ============================================ */

(function () {
    'use strict';

    var BEHOLD_FEED_URL = 'https://feeds.behold.so/ejGxzOQacoDxD3xiP62S';
    var PHOTOS = [];
    var currentIndex = 0;

    var modal = null;
    var modalImage = null;
    var modalQuote = null;
    var modalCaption = null;
    var closeButton = null;
    var prevButton = null;
    var nextButton = null;
    var opener = null;
    var originalLink = null;

    function originalUrl(post) {
        var link = post.permalink || post.postUrl || '';
        return /^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?[^\s]*)?$/.test(link) ? link : 'https://instagram.com/qusai.pro';
    }

    /**
     * Escapes unsafe HTML characters to prevent XSS and malformed attributes.
     *
     * @param {string} str Input string
     * @returns {string} Escaped string
     */
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Resolves media URL using multi-tier size cascade.
     * For 'card': large -> medium -> small -> mediaUrl -> thumbnailUrl
     * For 'modal': full -> large -> medium -> small -> mediaUrl -> thumbnailUrl
     *
     * @param {Object} item Raw post or child object
     * @param {'card'|'modal'} tier Target display tier
     * @returns {string} Resolved image/media URL
     */
    function resolveMediaUrl(item, tier) {
        if (!item) return '';

        if (item.sizes) {
            if (tier === 'modal' && item.sizes.full && item.sizes.full.mediaUrl) {
                return item.sizes.full.mediaUrl;
            }
            if (item.sizes.large && item.sizes.large.mediaUrl) {
                return item.sizes.large.mediaUrl;
            }
            if (item.sizes.medium && item.sizes.medium.mediaUrl) {
                return item.sizes.medium.mediaUrl;
            }
            if (item.sizes.small && item.sizes.small.mediaUrl) {
                return item.sizes.small.mediaUrl;
            }
        }

        if (item.mediaUrl) return item.mediaUrl;
        if (item.thumbnailUrl) return item.thumbnailUrl;
        return '';
    }

    /**
     * Formats ISO 8601 timestamp to "MMM D, YYYY" (e.g. "May 31, 2026").
     *
     * @param {string} timestamp ISO 8601 date string
     * @returns {string} Formatted date string or empty string
     */
    function formatPostDate(timestamp) {
        if (!timestamp) return '';
        var d = new Date(timestamp);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'
        });
    }

    /**
     * Normalizes Behold feed payload into an array of raw post objects.
     * Supports:
     * - Post[] (standard Behold array endpoint response)
     * - { posts: Post[] } (wrapper object)
     * - { data: Post[] } (Graph API / alternate wrapper)
     *
     * @param {any} data Raw JSON response
     * @returns {Array<Object>} Array of raw post objects
     */
    function normalizeFeedPayload(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'object') {
            if (Array.isArray(data.posts)) return data.posts;
            if (Array.isArray(data.data)) return data.data;
        }
        return [];
    }

    /**
     * Transforms raw Behold posts into flat GalleryItem array, unpacking carousels.
     *
     * @param {Array<Object>} rawPosts
     * @returns {Array<Object>} Flat array of GalleryItem objects
     */
    function processPosts(rawPosts) {
        var items = [];

        rawPosts.forEach(function (post, postIdx) {
            if (!post || typeof post !== 'object') return;

            var captionText = post.prunedCaption || post.caption || '';
            var dateStr = formatPostDate(post.timestamp);
            var isAlbum = (post.mediaType === 'CAROUSEL_ALBUM' || (post.children && post.children.length > 0));

            if (isAlbum && post.children && post.children.length > 0) {
                var total = post.children.length;
                post.children.forEach(function (child, idx) {
                    if (!child) return;
                    var seqStr = (idx + 1) + '/' + total;
                    var quoteStr = dateStr ? (dateStr + ' · ' + seqStr) : seqStr;
                    var altStr = captionText ? (captionText + (total > 1 ? ' (' + seqStr + ')' : '')) : ('Instagram photo ' + seqStr);
                    var childIsVideo = child.mediaType === 'VIDEO';

                    items.push({
                        id: String(post.id || ('photo_' + postIdx)) + '_' + String(child.id || idx),
                        src: resolveMediaUrl(child, 'card'),
                        fullSrc: resolveMediaUrl(child, 'modal'),
                        alt: altStr,
                        caption: captionText,
                        quote: quoteStr,
                        isVideo: childIsVideo,
                        originalUrl: originalUrl(post),
                        isCarousel: idx === 0 && total > 1
                    });
                });
            } else {
                var isVideo = post.mediaType === 'VIDEO';
                items.push({
                    id: String(post.id || ('photo_' + postIdx)),
                    src: resolveMediaUrl(post, 'card'),
                    fullSrc: resolveMediaUrl(post, 'modal'),
                    alt: captionText || 'Instagram photo',
                    caption: captionText,
                    quote: dateStr,
                    isVideo: isVideo,
                    originalUrl: originalUrl(post),
                    isCarousel: false
                });
            }
        });

        return items;
    }

    /**
     * Renders fallback Instagram Archive card when feed is unavailable or fails.
     *
     * @param {HTMLElement} gallery
     */
    function renderFallback(gallery) {
        if (!gallery) return;
        gallery.classList.remove('photo-gallery');
        gallery.innerHTML = `
            <div class="under-construction-card" data-aos="fade-up">
                <div class="under-construction-badge">
                    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    <span>INSTAGRAM ARCHIVE</span>
                </div>
                <h2>The gallery couldn't load this time<span class="accent-dot">.</span></h2>
                <p>The photos are still there. Instagram is just taking the scenic route. You can see them directly on my profile.</p>
                <div class="construction-actions">
                    <a href="https://instagram.com/qusai.pro" target="_blank" rel="noopener noreferrer" class="see-more instagram-btn">Visit @qusai.pro on Instagram ↗</a>
                    <a href="/life/" class="see-more">Explore Life &amp; Interests →</a>
                </div>
            </div>
        `;
    }

    /**
     * Renders photo cards in responsive grid layout with data-index and indicator badges.
     *
     * @param {HTMLElement} gallery
     */
    function renderGalleryGrid(gallery) {
        if (!gallery) return;
        if (!PHOTOS || PHOTOS.length === 0) {
            renderFallback(gallery);
            return;
        }

        gallery.innerHTML = '';
        gallery.classList.add('photo-gallery');

        PHOTOS.forEach(function (photo, index) {
            var card = document.createElement('button');
            card.type = 'button';
            card.className = 'gallery-card';
            card.setAttribute('data-index', String(index));
            card.setAttribute('data-aos', 'fade-up');
            card.setAttribute('aria-label', (photo.isVideo ? 'Video preview · ' : '') + (photo.alt || ('View photo ' + (index + 1))));
            card.addEventListener('click', function () {
                openPhotoModal(index);
            });

            var mediaIndicator = '';
            if (photo.isVideo) {
                mediaIndicator = '<div class="media-indicator" aria-label="Video">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">' +
                    '<polygon points="6 4 20 12 6 20 6 4"></polygon>' +
                    '</svg></div>';
            } else if (photo.isCarousel) {
                mediaIndicator = '<div class="media-indicator" aria-label="Carousel">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">' +
                    '<rect x="7" y="3" width="14" height="14" rx="2" ry="2"></rect>' +
                    '<path d="M3 7v12a2 2 0 0 0 2 2h12"></path>' +
                    '</svg></div>';
            }

            card.innerHTML = 
                '<div class="gallery-card-media">' +
                    '<img src="' + escapeHTML(photo.src) + '" alt="' + escapeHTML(photo.alt) + '" loading="lazy" decoding="async">' +
                    mediaIndicator +
                    '<div class="card-overlay">' +
                        '<div class="card-caption">' +
                            '<span class="card-title">' + escapeHTML(photo.caption || photo.quote) + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            gallery.appendChild(card);
        });
    }

    /**
     * Fetches photos from Behold JSON feed, normalizes payload, processes items, and renders grid.
     */
    async function fetchPhotos() {
        var gallery = document.getElementById('photo-gallery');
        if (!gallery) return;

        var controller = typeof AbortController === 'function' ? new AbortController() : null;
        var timeout = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;
        try {
            var res = await fetch(BEHOLD_FEED_URL, controller ? { signal: controller.signal } : undefined);
            if (!res.ok) {
                throw new Error('HTTP ' + res.status + ' (' + res.statusText + ')');
            }
            var data = await res.json();
            var rawPosts = normalizeFeedPayload(data);

            if (!rawPosts || rawPosts.length === 0) {
                renderFallback(gallery);
                return;
            }

            PHOTOS = processPosts(rawPosts);
            if (PHOTOS.length === 0) {
                renderFallback(gallery);
                return;
            }

            renderGalleryGrid(gallery);
        } catch (err) {
            renderFallback(gallery);
        } finally {
            if (timeout) clearTimeout(timeout);
        }
    }

    /**
     * Updates modal image, quote, and caption based on currentIndex.
     */
    function updateModalContent() {
        var photo = PHOTOS[currentIndex];
        if (!photo || !modalImage) return;

        modalImage.src = photo.fullSrc || photo.src;
        modalImage.alt = photo.alt;
        modalQuote.textContent = photo.quote ? '“' + photo.quote + '”' : '';
        modalCaption.textContent = photo.caption || '';
        if (originalLink) {
            originalLink.href = photo.originalUrl;
            originalLink.hidden = false;
            originalLink.textContent = photo.isVideo ? 'Video preview · Watch on Instagram ↗' : 'View original on Instagram ↗';
        }
    }

    /**
     * Opens photo modal viewer at specified index.
     *
     * @param {number} index
     */
    function openPhotoModal(index) {
        if (!PHOTOS[index] || !modal || !modalImage) return;

        if (!modal.classList.contains('active')) {
            opener = document.activeElement;
        }
        currentIndex = index;
        updateModalContent();

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (closeButton && typeof closeButton.focus === 'function') {
            closeButton.focus();
        }
    }

    /**
     * Closes photo modal viewer and restores focus to previous opener.
     */
    function closePhotoModal() {
        if (!modal || !modal.classList.contains('active')) return;

        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        modalImage.removeAttribute('src');
        modalImage.alt = '';
        document.body.style.overflow = '';

        if (opener && typeof opener.focus === 'function') {
            try {
                opener.focus();
            } catch (e) {
                // Defensive guard against detached DOM elements
            }
        }
        opener = null;
    }

    /**
     * Advances to next photo (cyclic).
     */
    function nextPhoto() {
        if (!PHOTOS || PHOTOS.length === 0) return;
        currentIndex = (currentIndex + 1) % PHOTOS.length;
        updateModalContent();
    }

    /**
     * Returns to previous photo (cyclic).
     */
    function prevPhoto() {
        if (!PHOTOS || PHOTOS.length === 0) return;
        currentIndex = (currentIndex - 1 + PHOTOS.length) % PHOTOS.length;
        updateModalContent();
    }

    /**
     * Initializes modal DOM element references and event handlers.
     */
    function initModal() {
        modal = document.getElementById('photo-modal');
        modalImage = document.getElementById('modal-image');
        modalQuote = document.getElementById('modal-quote');
        modalCaption = document.getElementById('modal-caption');
        closeButton = document.getElementById('photo-modal-close');
        prevButton = document.getElementById('photo-modal-prev');
        nextButton = document.getElementById('photo-modal-next');
        originalLink = document.getElementById('modal-original');

        if (!modal || !modalImage || !modalQuote || !modalCaption || !closeButton) return;

        closeButton.addEventListener('click', closePhotoModal);

        if (prevButton) prevButton.addEventListener('click', function (e) { e.stopPropagation(); prevPhoto(); });
        if (nextButton) nextButton.addEventListener('click', function (e) { e.stopPropagation(); nextPhoto(); });

        modal.addEventListener('click', function (event) {
            if (event.target === modal || event.target.classList.contains('photo-modal-content')) {
                closePhotoModal();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (!modal.classList.contains('active')) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                closePhotoModal();
                return;
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                nextPhoto();
                return;
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                prevPhoto();
                return;
            }
            if (event.key === 'Tab') {
                var focusable = [closeButton, prevButton, nextButton, originalLink].filter(function (btn) {
                    return btn && !btn.hidden && typeof btn.focus === 'function';
                });
                if (focusable.length === 0) {
                    event.preventDefault();
                    return;
                }
                var firstEl = focusable[0];
                var lastEl = focusable[focusable.length - 1];

                if (event.shiftKey) {
                    if (document.activeElement === firstEl || focusable.indexOf(document.activeElement) === -1) {
                        event.preventDefault();
                        lastEl.focus();
                    }
                } else {
                    if (document.activeElement === lastEl || focusable.indexOf(document.activeElement) === -1) {
                        event.preventDefault();
                        firstEl.focus();
                    }
                }
            }
        });
    }

    function init() {
        initModal();
        fetchPhotos();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
