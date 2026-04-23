
// animation.js
document.addEventListener('DOMContentLoaded', () => {
    // --- HERO ANIMATION (Three.js) ---
    const container = document.getElementById('hero-animation');
    if (container) {
        // SCENE
        const scene = new THREE.Scene();

        // Use a fixed square aspect ratio for the camera to keep sphere circular
        const size = Math.min(container.clientWidth, container.clientHeight);

        // CAMERA - Fixed 1:1 aspect ratio
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 1.8;

        // RENDERER - Square canvas
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(size, size);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Position canvas at left edge, vertically centered
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.top = '50%';
        renderer.domElement.style.transform = 'translateY(-50%)';

        container.appendChild(renderer.domElement);

        // GEOMETRY - increased size
        const geometry = new THREE.IcosahedronGeometry(1.2, 4);

        // MATERIAL
        const material = new THREE.MeshBasicMaterial({
            color: 0xf8d648,
            wireframe: true,
            transparent: true,
            opacity: 0.8,
            wireframeLinewidth: 2,
        });

        // MESH - No scaling needed now!
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = -1.2; // Moved right to show ~50-60% of sphere
        scene.add(sphere);

        // ANIMATION LOOP
        function animate() {
            requestAnimationFrame(animate);
            sphere.rotation.y += 0.0005;
            sphere.rotation.x += 0.0002;
            renderer.render(scene, camera);
        }
        animate();

        // RESIZE HANDLE
        window.addEventListener('resize', () => {
            const newSize = Math.min(container.clientWidth, container.clientHeight);
            renderer.setSize(newSize, newSize);
            // Camera aspect stays 1:1, no update needed
        });
    }

    // --- SCROLLYTELLING LOGIC (scoped per section, always runs) ---
    const svgElements = {
        // Super Performant section
        'va-confidential': [document.getElementById('va-confidential')],
        'va-evolving': [document.getElementById('va-evolving')],
        'va-verification': [document.getElementById('va-verification')]
    };

    // Initialize each scrolly section independently
    document.querySelectorAll('.scrolly-section').forEach(section => {
        const sectionTriggers = section.querySelectorAll('.trigger');
        const sectionPanels = section.querySelectorAll('.text-panel');

        // Set first panel + highlight as active
        if (sectionPanels.length > 0) {
            sectionPanels[0].classList.add('active');
        }
        if (sectionTriggers.length > 0) {
            const firstHighlight = sectionTriggers[0].getAttribute('data-highlight');
            if (svgElements[firstHighlight]) {
                svgElements[firstHighlight].forEach(el => { if (el) el.classList.add('highlighted'); });
            }
        }

        if (sectionTriggers.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const highlightId = entry.target.getAttribute('data-highlight');
                        const panelId = entry.target.getAttribute('data-panel');

                        // Only deactivate panels within THIS section
                        sectionPanels.forEach(p => p.classList.remove('active'));
                        const activePanel = document.getElementById(panelId);
                        if (activePanel) activePanel.classList.add('active');

                        // Only clear highlights for triggers in THIS section
                        sectionTriggers.forEach(t => {
                            const hid = t.getAttribute('data-highlight');
                            if (svgElements[hid]) {
                                svgElements[hid].forEach(el => { if (el) el.classList.remove('highlighted'); });
                            }
                        });
                        if (svgElements[highlightId]) {
                            svgElements[highlightId].forEach(el => { if (el) el.classList.add('highlighted'); });
                        }
                    }
                });
            }, { root: null, rootMargin: '-40% 0px -40% 0px', threshold: 0 });

            sectionTriggers.forEach(trigger => observer.observe(trigger));
        }
    });

    // --- LOGO CAROUSEL (Social Proof) ---
    const logoTrack = document.getElementById('logo-carousel-track');
    if (logoTrack) {
        const logoItems = Array.from(logoTrack.children);
        const numLogos = logoItems.length;

        // Clone logos multiple times for seamless infinite scroll
        for (let i = 0; i < 3; i++) {
            logoItems.forEach(item => {
                const clone = item.cloneNode(true);
                logoTrack.appendChild(clone);
            });
        }

        let logoPosition = 0;
        const logoScrollSpeed = 0.3;
        const logoGap = 64; // 4rem = 64px
        const logoWidth = logoItems[0].offsetWidth + logoGap;
        const totalLogoWidth = numLogos * logoWidth;

        function animateLogos() {
            logoPosition += logoScrollSpeed;

            if (logoPosition >= totalLogoWidth) {
                logoPosition = 0;
            }

            logoTrack.style.transform = `translateX(-${logoPosition}px)`;
            requestAnimationFrame(animateLogos);
        }

        animateLogos();
    }

    // --- SCROLL-REVEAL for .animate-up elements ---
    const revealElements = document.querySelectorAll('.animate-up');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => revealObserver.observe(el));
    }
});
