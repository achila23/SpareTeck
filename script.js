/* ===== script.js (full updated) ===== */

/* -------------------------
   Smooth scrolling for anchor links
   ------------------------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            if (typeof closeMobileMenu === 'function') closeMobileMenu();
        }
    });
});

/* -------------------------
   Mobile menu toggle + overlay
   ------------------------- */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');

function openMobileMenu() {
    if (!hamburger || !navLinks || !navOverlay) return;
    hamburger.classList.add('active');
    navLinks.classList.add('active');
    navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
    if (!hamburger || !navLinks || !navOverlay) return;
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
}
function toggleMobileMenu() {
    if (!navLinks) return;
    if (navLinks.classList.contains('active')) closeMobileMenu();
    else openMobileMenu();
}

if (hamburger) hamburger.addEventListener('click', toggleMobileMenu);
if (navOverlay) navOverlay.addEventListener('click', closeMobileMenu);

// Close menu on resize (desktop fallback)
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navLinks && navLinks.classList.contains('active')) {
        closeMobileMenu();
    }
});

/* -------------------------
   Scroll-driven background video (batched seeks)
   - batched seeks (~25fps)
   - small-diff threshold to ignore micro adjustments
   - idle stop to save CPU
   - visibility handling
   ------------------------- */
const video = document.getElementById('bgVideo');

const VIDEO_FALLBACK_DURATION = 18; // seconds if metadata not available
const SMALL_DIFF_THRESHOLD = 0.006; // 6 ms (ignore micro seeks)
const SMOOTH_FACTOR = 0.45;         // 0..1 (higher = snappier)
const SEEK_BATCH_MS = 40;          // throttle seeks to ~25 updates/sec
const IDLE_STOP_MS = 250;          // stop batching when idle

let videoDuration = VIDEO_FALLBACK_DURATION;
let targetVideoTime = 0;
let currentVideoTime = 0;

let lastScrollTime = 0;
let batchTimer = null;
let lastSeekAt = 0;
let isActiveBatch = false;

// Safety: if video element missing, skip video logic
function computeTargetFromScroll() {
    if (!video) return;
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const scrollFraction = Math.min(Math.max(scrollPosition / maxScroll, 0), 1);
    targetVideoTime = scrollFraction * videoDuration;
}

// Called on scroll/wheel/touch/hashchange to indicate we need updates
function markScrollUpdated() {
    if (!video) return;
    computeTargetFromScroll();
    lastScrollTime = performance.now();
    if (!isActiveBatch) startBatchTimer();
}

// Start a short batching interval for interpolation + seeks
function startBatchTimer() {
    if (isActiveBatch || !video) return;
    isActiveBatch = true;
    // Immediate pass for snappy response
    performBatchPass();

    batchTimer = setInterval(() => {
        const now = performance.now();
        // Stop if idle
        if (now - lastScrollTime > IDLE_STOP_MS) {
            stopBatchTimer();
            return;
        }
        performBatchPass();
    }, SEEK_BATCH_MS);
}

// Stop batching to save CPU
function stopBatchTimer() {
    if (!isActiveBatch) return;
    clearInterval(batchTimer);
    batchTimer = null;
    isActiveBatch = false;
}

// One interpolation + optional seek pass
function performBatchPass() {
    if (!video || video.readyState < 2 || document.hidden) return;

    const diff = targetVideoTime - currentVideoTime;

    // Snap if very close
    if (Math.abs(diff) <= SMALL_DIFF_THRESHOLD) {
        currentVideoTime = targetVideoTime;
        // final small seek if video.currentTime significantly different
        if (Math.abs(video.currentTime - currentVideoTime) > 0.001) {
            try { video.currentTime = currentVideoTime; } catch (e) {}
            lastSeekAt = performance.now();
        }
        return;
    }

    // Interpolate toward target (exponential-like)
    currentVideoTime += diff * SMOOTH_FACTOR;

    // Clamp
    currentVideoTime = Math.max(0, Math.min(currentVideoTime, videoDuration - 0.001));

    const now = performance.now();
    if (now - lastSeekAt >= SEEK_BATCH_MS) {
        try {
            video.currentTime = currentVideoTime;
        } catch (err) {
            // mobile browsers sometimes throw; ignore
        }
        lastSeekAt = now;
    }
}

// Hook events with passive listeners for better scroll performance
if (typeof window !== 'undefined') {
    window.addEventListener('scroll', markScrollUpdated, { passive: true });
    window.addEventListener('wheel', markScrollUpdated, { passive: true });
    window.addEventListener('touchmove', markScrollUpdated, { passive: true });
    window.addEventListener('hashchange', () => {
        computeTargetFromScroll();
        markScrollUpdated();
    });
}

// Visibility handling: stop while hidden, resume when visible
document.addEventListener('visibilitychange', () => {
    if (!video) return;
    if (document.hidden) {
        stopBatchTimer();
    } else {
        computeTargetFromScroll();
        markScrollUpdated();
    }
});

// When metadata loaded, set duration and warm decoder
if (video) {
    video.addEventListener('loadedmetadata', () => {
        if (typeof video.duration === 'number' && isFinite(video.duration) && video.duration > 0) {
            // Limit duration to avoid accidental huge video mapping
            videoDuration = Math.min(video.duration, 60 * 5);
        } else {
            videoDuration = VIDEO_FALLBACK_DURATION;
        }

        // Initialize mapping
        computeTargetFromScroll();
        currentVideoTime = targetVideoTime;

        // Try to warm up decoder (muted play may be blocked; ignore errors)
        try {
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.play().catch(() => { /* autoplay blocked - ok */ });
        } catch (e) {}

        // initial seek to correct frame
        try { video.currentTime = currentVideoTime; } catch (e) {}
    });

    // If video already loaded before script ran
    if (video.readyState >= 2) {
        // simulate loadedmetadata to initialize
        video.dispatchEvent(new Event('loadedmetadata'));
    }
}

/* -------------------------
   Navigation link highlight based on sections
   ------------------------- */
const sections = document.querySelectorAll('section');
const navLinksItems = document.querySelectorAll('.nav-links a');

function highlightNav() {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinksItems.forEach(link => {
        link.style.color = '#ffffff';
        if (link.getAttribute('href').slice(1) === current) {
            link.style.color = '#FFD700';
        }
    });
}

// Use passive scroll for highlight too; run at reasonable rate
window.addEventListener('scroll', highlightNav, { passive: true });
// run once on load
highlightNav();

/* -------------------------
   Optional: small safety polyfills / no-ops if elements missing
   ------------------------- */
if (!hamburger) {
    // no hamburger — nothing to do
}
