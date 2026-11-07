(function () {
  const BASE = '/assets/seasonal/november/';

  function isNov1(d) { return d.getMonth() === 10 && d.getDate() === 1; }

  function init() {
    const music = new Audio(BASE + 'darkchurch_intro.ogg');
    music.loop = true;
    music.volume = 0.6;

    const ac = new AbortController();
    const unlock = () => { music.play().catch(() => {}); ac.abort(); };
    document.addEventListener('click',   unlock, { signal: ac.signal });
    document.addEventListener('keydown', unlock, { signal: ac.signal });

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position:      'fixed',
      top:           '0',
      left:          '0',
      width:         '100vw',
      height:        '100vh',
      pointerEvents: 'none',
      zIndex:        '9500',
      background:    'radial-gradient(circle 120px at -9999px -9999px, transparent 0%, transparent 55%, rgba(0,0,0,0.97) 100%)',
    });
    document.body.appendChild(overlay);

    document.addEventListener('mousemove', e => {
      overlay.style.background = `radial-gradient(circle 120px at ${e.clientX}px ${e.clientY}px, transparent 0%, transparent 55%, rgba(0,0,0,0.97) 100%)`;
    });

    document.addEventListener('touchmove', e => {
      const t = e.touches[0];
      overlay.style.background = `radial-gradient(circle 120px at ${t.clientX}px ${t.clientY}px, transparent 0%, transparent 55%, rgba(0,0,0,0.97) 100%)`;
    }, { passive: true });
  }

  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  if (isNov1(now)) init();

})();