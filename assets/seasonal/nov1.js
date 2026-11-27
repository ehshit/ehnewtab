(function () {
  const BASE = '/assets/seasonal/november/';
  const QUALITY = window.MEW_DOODLE_QUALITY || 'full';
  const MUSIC = window.MEW_DOODLE_MUSIC !== false;
  const LOW_END = QUALITY === 'low';

  function isNov1(d) { return d.getMonth() === 10 && d.getDate() === 1; }

  function init() {
    const music = (LOW_END || !MUSIC) ? null : new Audio(BASE + 'darkchurch_intro.ogg');
    if (music) {
      music.loop = true;
      music.volume = 0.6;
      const ac = new AbortController();
      const unlock = () => { music.play().catch(() => {}); ac.abort(); };
      document.addEventListener('click',   unlock, { signal: ac.signal });
      document.addEventListener('keydown', unlock, { signal: ac.signal });
    }

    const radius = LOW_END ? 90 : 120;
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position:      'fixed',
      top:           '-50vh',
      left:          '-50vw',
      width:         '200vw',
      height:        '200vh',
      pointerEvents: 'none',
      zIndex:        '9500',
      willChange:    QUALITY === 'full' ? 'transform' : 'auto',
      background:    `radial-gradient(circle ${radius}px at 50% 50%, transparent 0%, transparent 55%, rgba(0,0,0,0.97) 100%)`,
    });
    document.body.appendChild(overlay);

    let queued = false;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    const paint = () => {
      queued = false;
      overlay.style.transform = `translate3d(${pointerX - window.innerWidth / 2}px, ${pointerY - window.innerHeight / 2}px, 0)`;
    };
    const queue = (x, y) => {
      pointerX = x;
      pointerY = y;
      if (queued) return;
      queued = true;
      requestAnimationFrame(paint);
    };

    document.addEventListener('mousemove', e => queue(e.clientX, e.clientY));
    document.addEventListener('touchmove', e => {
      const t = e.touches[0];
      if (t) queue(t.clientX, t.clientY);
    }, { passive: true });
  }

  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  if (isNov1(now)) init();

})();