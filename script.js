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
            
            // Close mobile menu after clicking a link
            closeMobileMenu();
        }
    });
});

// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');

function openMobileMenu() {
    hamburger.classList.add('active');
    navLinks.classList.add('active');
    navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
}

function closeMobileMenu() {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
}

function toggleMobileMenu() {
    if (navLinks.classList.contains('active')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

// Hamburger click event
hamburger.addEventListener('click', toggleMobileMenu);

// Overlay click event - close menu when clicking outside
navOverlay.addEventListener('click', closeMobileMenu);

// Close menu on window resize if opened
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
        closeMobileMenu();
    }
});

// Video control based on scroll
const video = document.getElementById('bgVideo');
let hasStarted = false;
let currentVideoTime = 0;
let targetVideoTime = 0;

// Calculate video playback based on scroll position
function updateVideoTime() {
    const scrollPosition = window.pageYOffset;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollFraction = scrollPosition / maxScroll;
    
    // Map scroll to video time (0-18 seconds)
    const videoDuration = 18; // 18 seconds total
    targetVideoTime = scrollFraction * videoDuration;
    
    // Hide placeholder once video starts
    if (!hasStarted && scrollPosition > 0) {
        hasStarted = true;
        const placeholder = document.querySelector('.video-placeholder');
        if (placeholder) {
            placeholder.style.opacity = '0';
            placeholder.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                placeholder.style.display = 'none';
            }, 500);
        }
    }
}

let scrollUpdated = false;

window.addEventListener('scroll', () => {
    scrollUpdated = true;
    updateVideoTime();
});


// Smooth video playback animation
function animateVideo() {
    if (video.readyState >= 2) {

        const diff = targetVideoTime - currentVideoTime;

        // Skip micro updates under ~5ms
        if (Math.abs(diff) > 0.005) {
            currentVideoTime += diff * 0.25;
            video.currentTime = currentVideoTime;
        }
    }

    requestAnimationFrame(animateVideo);
}


// Start animation loop
animateVideo();

// Update target time on scroll
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateVideoTime();
            ticking = false;
        });
        ticking = true;
    }
});

// Initialize video on load
video.addEventListener('loadedmetadata', () => {
    updateVideoTime();
});

// Add active state to navigation links
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