/* Accessible, progressively enhanced local photo gallery. */
(function () {
    'use strict';
    var PHOTOS = [];
    var currentIndex = 0;
    var modal, modalImage, modalQuote, modalCaption, closeButton, prevButton, nextButton;
    var opener, originalLink, retryButton, modalImageStatus;

    function originalUrl(post) {
        var link = post.permalink || '';
        return /^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?[^\s]*)?$/.test(link) ? link : 'https://instagram.com/qusai.pro';
    }

    function initGallery() {
        var gallery = document.getElementById('photo-gallery');
        if (!gallery) return;
        var cards = gallery.querySelectorAll('.gallery-card');
        cards.forEach(function (card, index) {
            var image = card.querySelector('img');
            var fallback = card.querySelector('.gallery-image-fallback');
            var label = card.getAttribute('aria-label');
            PHOTOS.push({
                src: image.getAttribute('src'), fullSrc: card.dataset.fullSrc || card.getAttribute('href'),
                alt: image.alt, caption: card.querySelector('.card-title').textContent.trim(),
                quote: card.dataset.quote || '', originalUrl: originalUrl({ permalink: card.dataset.originalUrl }),
                isVideo: card.dataset.video === 'true'
            });
            card.addEventListener('click', function (event) {
                // Keep normal open-in-new-tab gestures and no-script navigation intact.
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                openPhotoModal(index);
            });
            function showImageState() {
                var failed = image.complete && image.naturalWidth === 0;
                image.hidden = failed;
                if (fallback) fallback.hidden = !failed;
                card.setAttribute('aria-label', label + (failed ? ' — Photo unavailable. Open to try again.' : ''));
            }
            image.addEventListener('error', showImageState);
            image.addEventListener('load', showImageState);
            if (image.complete) showImageState();
        });
        gallery.dataset.galleryReady = 'true';
    }

    /**
     * Updates modal image, quote, and caption based on currentIndex.
     */
    function setModalImageState(state) {
        modal.dataset.imageState = state;
        modalImage.hidden = state !== 'ready';
        modalImageStatus.hidden = state === 'ready';
        modalImageStatus.textContent = state === 'error'
            ? 'This photo could not load. Try again or view it on Instagram.'
            : state === 'loading' ? 'Loading photo…' : '';
        retryButton.hidden = state !== 'error';
    }

    function updateModalContent() {
        var photo = PHOTOS[currentIndex];
        if (!photo || !modalImage) return;

        setModalImageState('loading');
        modalImage.removeAttribute('src');
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
        modal.removeAttribute('data-image-state');
        modalImageStatus.hidden = true;
        modalImageStatus.textContent = '';
        retryButton.hidden = true;
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
        retryButton = document.getElementById('photo-modal-retry');
        modalImageStatus = document.getElementById('modal-image-status');

        if (!modal || !modalImage || !modalQuote || !modalCaption || !closeButton || !retryButton || !modalImageStatus) return;

        closeButton.addEventListener('click', closePhotoModal);
        retryButton.addEventListener('click', function () {
            closeButton.focus();
            updateModalContent();
        });
        modalImage.addEventListener('load', function () {
            if (modal.classList.contains('active')) setModalImageState('ready');
        });
        modalImage.addEventListener('error', function () {
            if (modal.classList.contains('active')) setModalImageState('error');
        });

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
                var focusable = [closeButton, prevButton, nextButton, retryButton, originalLink].filter(function (btn) {
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
        initGallery();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
