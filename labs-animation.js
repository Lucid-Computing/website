(function() {
    var canvas = document.getElementById('labs-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var width, height;
    var symbols = [];
    var mouse = { x: -1000, y: -1000 };

    var GLYPHS = [
        '\u222B', '\u03A3', '\u2202', '\u2207', '\u221E', '\u03C0',
        '\u222E', '\u0394', '\u03BB', '\u03A9', '\u03BC', '\u03B8',
        '\u2295', '\u2297', '\u2261', '\u221D', '\u2118',
        '\u2234', '\u2235', '\u2248', '\u00D7', '\u2113'
    ];

    function resize() {
        var section = canvas.closest('.labs-hero') || canvas.parentElement;
        width = canvas.width = section.clientWidth;
        height = canvas.height = section.clientHeight || window.innerHeight;
    }

    function createSymbol() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            size: 18 + Math.random() * 36,
            opacity: 0.05 + Math.random() * 0.13,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.002,
            parallaxFactor: 0.5 + Math.random() * 0.5
        };
    }

    function init() {
        resize();
        var count = Math.floor((width * height) / 25000);
        count = Math.min(count, 40);
        symbols = [];
        for (var i = 0; i < count; i++) {
            symbols.push(createSymbol());
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        for (var i = 0; i < symbols.length; i++) {
            var s = symbols[i];

            s.x += s.vx;
            s.y += s.vy;
            s.rotation += s.rotationSpeed;

            if (s.x < -50) s.x = width + 50;
            if (s.x > width + 50) s.x = -50;
            if (s.y < -50) s.y = height + 50;
            if (s.y > height + 50) s.y = -50;

            var dx = s.x - mouse.x;
            var dy = s.y - mouse.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var offsetX = 0, offsetY = 0;
            if (dist < 150) {
                var force = (150 - dist) / 150 * 20 * s.parallaxFactor;
                offsetX = (dx / dist) * force;
                offsetY = (dy / dist) * force;
            }

            ctx.save();
            ctx.translate(s.x + offsetX, s.y + offsetY);
            ctx.rotate(s.rotation);
            ctx.globalAlpha = s.opacity;
            ctx.font = s.size + 'px "Space Mono", monospace';
            ctx.fillStyle = '#f8d648';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.glyph, 0, 0);
            ctx.restore();
        }

        requestAnimationFrame(draw);
    }

    canvas.addEventListener('mousemove', function(e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', function() {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    window.addEventListener('resize', function() {
        resize();
        var count = Math.floor((width * height) / 25000);
        count = Math.min(count, 40);
        while (symbols.length < count) {
            symbols.push(createSymbol());
        }
        while (symbols.length > count) {
            symbols.pop();
        }
    });

    init();
    draw();
})();
