// === script.js (optimized for smooth scroll-driven video) ===

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            closeMobileMenu();
        }
    });
});

// Mobile Menu Toggle (keeps your existing functions)
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');

function openMobileMenu() {
    hamburger.classList.add('active');
    navLinks.classList.add('active');
    navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
}
function toggleMobileMenu() {
    if (navLinks.classList.contains('active')) closeMobileMenu();
    else openMobileMenu();
}
hamburger.addEventListener('click', toggleMobileMenu);
navOverlay.addEventListener('click', closeMobileMenu);
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
        closeMobileMenu();
    }
});

// ------------------ Video scroll control (optimized) ------------------
const video = document.getElementById('bgVideo');
let hasStarted = false;

// Use actual duration if available, otherwise fallback
let videoDuration = 18;
const SMALL_DIFF_THRESHOLD = 0.005; // seconds (5 ms) - ignore micro-differences
const SMOOTH_FACTOR = 0.25;         // 0.2-0.35 usually looks great
const MIN_SEEK_INTERVAL = 33;       // ms -> ~30 updates per second max

let currentVideoTime = 0;
let targetVideoTime = 0;

let lastSeekTimestamp = 0;
let scrollUpdated = false;

// Compute mapping from scroll to video time
function updateVideoTargetFromScroll() {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const scrollFraction = Math.min(Math.max(scrollPosition / maxScroll, 0), 1);
    targetVideoTime = scrollFraction * videoDuration;

    // Hide placeholder the first time user scrolls
    if (!hasStarted && scrollPosition > 0) {
        hasStarted = true;
        const placeholder = document.querySelector('.video-placeholder');
        if (placeholder) {
            placeholder.style.transition = 'opacity 0.5s';
            placeholder.style.opacity = '0';
            setTimeout(() => {
                placeholder.style.display = 'none';
            }, 500);
        }
    }
}

// Throttle scroll updates flag (we still compute target quickly on scroll)
const onScroll = () => {
    updateVideoTargetFromScroll();
    scrollUpdated = true;
};
// Use passive listeners for smoother scroll performance
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('wheel', () => { scrollUpdated = true; }, { passive: true });
window.addEventListener('touchmove', () => { scrollUpdated = true; }, { passive: true });

// If user clicks nav links (smooth scroll) also update target
window.addEventListener('hashchange', () => {
    updateVideoTargetFromScroll();
    scrollUpdated = true;
});

// Pause updates when tab is hidden (saves CPU & avoids weird seeking)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // nothing else special — animation loop respects visibility implicitly
    } else {
        // recalc target & force a quick update when returning
        updateVideoTargetFromScroll();
        scrollUpdated = true;
    }
});

// Main animation loop (requestAnimationFrame)
function animateVideo(timestamp) {
    // Only run heavy logic when the page is visible
    if (!document.hidden && video && video.readyState >= 2) {
        const diff = targetVideoTime - currentVideoTime;

        // Only attempt seek when either scroll signaled an update OR diff is non-trivial
        if (scrollUpdated || Math.abs(diff) > SMALL_DIFF_THRESHOLD) {
            const now = performance.now();
            // Throttle actual video.currentTime writes to MIN_SEEK_INTERVAL (approx 30 FPS)
            if (now - lastSeekTimestamp >= MIN_SEEK_INTERVAL) {
                // Smoothly interpolate towards the target
                currentVideoTime += diff * SMOOTH_FACTOR;

                // If we're extremely close, snap to target for final frame
                if (Math.abs(targetVideoTime - currentVideoTime) < SMALL_DIFF_THRESHOLD) {
                    currentVideoTime = targetVideoTime;
                }

                // Clamp within duration bounds
                currentVideoTime = Math.max(0, Math.min(currentVideoTime, videoDuration - 0.001));

                try {
                    // Setting currentTime can throw on some mobile browsers if out-of-bounds;
                    // wrap in try/catch to avoid crashing.
                    video.currentTime = currentVideoTime;
                } catch (err) {
                    // ignore occasional set errors (browser-specific)
                    // console.debug('video.currentTime set error', err);
                }

                lastSeekTimestamp = now;
                scrollUpdated = false;
            }
        }
    }

    requestAnimationFrame(animateVideo);
}

// Initialize when metadata loads
video.addEventListener('loadedmetadata', () => {
    // Use actual duration (some browsers expose it); if unknown still use fallback
    if (typeof video.duration === 'number' && isFinite(video.duration) && video.duration > 0) {
        videoDuration = Math.min(video.duration, 60 * 5); // safety cap (5min)
    }
    // initialize positions
    updateVideoTargetFromScroll();
    currentVideoTime = targetVideoTime;
    // start playback in muted inline mode (do not rely on autoplay)
    // Some browsers require a play() before setting currentTime smoothly — try to play silently
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {
        // autoplay might be blocked — that's OK for scroll-driven seeking
    });

    // kick off animation loop
    requestAnimationFrame(animateVideo);
});

// If video is already loaded before script attached
if (video && video.readyState >= 2) {
    // ensure loadedmetadata handler runs behavior
    const ev = new Event('loadedmetadata');
    video.dispatchEvent(ev);
}

// ------------------ Existing nav highlight code (kept) ------------------
const sections = document.querySelectorAll('section');
const navLinksItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
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
});
