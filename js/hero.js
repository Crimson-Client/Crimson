// Life on the first screen: warm fireflies drifting over the estate at dusk, each glowing and fading at its own
// pace. Drawn only while the first screen is in view and the tab is visible; none with reduced motion.
(function () {
  const canvas = document.querySelector('.hero-fireflies');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const flies = [];
  let w = 0, h = 0, dpr = 1, visible = true, raf = 0, last = 0;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const want = Math.round(Math.min(60, w * h / 32000));
    while (flies.length < want) flies.push(spawn(true));
    flies.length = want;
  }
  function spawn(anywhere) {
    return {
      x: Math.random() * w,
      y: anywhere ? h * (0.35 + Math.random() * 0.6) : h * (0.6 + Math.random() * 0.4),
      vx: (Math.random() - 0.5) * 12, vy: -4 - Math.random() * 8,       // pixels per second, drifting up
      r: 1 + Math.random() * 1.6, phase: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 1.2,
    };
  }
  function frame(t) {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    ctx.clearRect(0, 0, w, h);
    for (const f of flies) {
      f.phase += dt * f.speed;
      f.vx += (Math.random() - 0.5) * 6 * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.y < h * 0.2 || f.x < -20 || f.x > w + 20) Object.assign(f, spawn(false));
      const glow = 0.25 + 0.75 * Math.max(0, Math.sin(f.phase));
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
      g.addColorStop(0, `rgba(255, 236, 170, ${0.9 * glow})`);
      g.addColorStop(0.25, `rgba(255, 200, 110, ${0.35 * glow})`);
      g.addColorStop(1, 'rgba(255, 180, 90, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 7, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  function run() {
    cancelAnimationFrame(raf);
    if (visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); }
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(canvas);
  document.addEventListener('visibilitychange', run);
  resize();
  run();
})();
