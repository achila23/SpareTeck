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
        }
    });
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
    const videoDuration = 2; // 18 seconds total
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

// Smooth video playback animation
function animateVideo() {
    if (video.readyState >= 2) {
        // Smooth interpolation towards target time
        const diff = targetVideoTime - currentVideoTime;
        currentVideoTime += diff * 0.65; // Smooth factor (0.1 = smooth, 1 = instant)
        
        // Set video time
        video.currentTime = currentVideoTime;
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
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.style.color = '#ffffff';
        if (link.getAttribute('href').slice(1) === current) {
            link.style.color = '#FFD700';
        }
    });
});