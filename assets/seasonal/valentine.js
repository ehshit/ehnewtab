(function () {
  const BASE = '/assets/seasonal/rosesarered/';
  const FADE_IN_MS = 70000;
  const ATTACK_THRESHOLD = 10;
  const ATTACK_MS = 2000;
  function isValentineTime(d) {
    return d.getMonth() === 1 && d.getDate() === 14;
  }
  function init() {
    if (document.getElementById('rosesarered-strip')) return;
    const installBox = document.querySelector('.install-box');
    const search = document.querySelector('.search');
    const host = installBox || search || document.querySelector('.shell');
    if (!host) return;
    const strip = document.createElement('div');
    strip.id = 'rosesarered-strip';
    Object.assign(strip.style, {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      marginTop: '1rem',
      opacity: '0',
      transform: 'translateY(8px)',
      transition: `opacity ${FADE_IN_MS}ms ease, transform ${FADE_IN_MS}ms ease`,
      pointerEvents: 'auto',
      cursor: 'pointer',
      willChange: 'opacity, transform',
    });
    const img = document.createElement('img');
    img.src = BASE + 'valentine.gif';
    img.alt = 'valentine doodle';
    Object.assign(img.style, {
      height: '28px',
      width: 'auto',
      verticalAlign: 'middle',
      display: 'block',
      pointerEvents: 'auto',
    });
    let armed = false;
    let clickCount = 0;
    let attackRunning = false;
    function pickRandomDiv() {
      const divs = Array.from(document.querySelectorAll('div')).filter(el => {
        if (el.id === 'rosesarered-strip') return false;
        if (el.contains(strip)) return false;
        return true;
      });
      return divs.length ? divs[Math.floor(Math.random() * divs.length)] : host;
    }
    function attack(target) {
      if (attackRunning) return;
      attackRunning = true;
      const rect = target.getBoundingClientRect();

      const attackImg = img.cloneNode(true);
      Object.assign(attackImg.style, {
        height: '28px',
        width: 'auto',
        display: 'block',
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: '999998',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      });
      if (target.style.position === 'static') target.style.position = 'relative';
      target.appendChild(attackImg);

      const overlay = document.createElement('img');
      overlay.src = '/assets/deltarune/explosion.gif';
      Object.assign(overlay.style, {
        position: 'fixed',
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.top + rect.height / 2}px`,
        width: '220px',
        height: 'auto',
        transform: 'translate(-50%, -50%)',
        zIndex: '999999',
        pointerEvents: 'none',
        userSelect: 'none',
      });
      document.body.appendChild(overlay);

      const audio = new Audio('/assets/deltarune/delexplosion.ogg');
      audio.preload = 'auto';
      audio.volume = 1;
      audio.play().catch(() => {});

      const startPos = getComputedStyle(target).position;
      if (startPos === 'static') {
        target.style.position = 'relative';
      }
      target.style.zIndex = '999997';
      target.style.transformOrigin = 'center center';
      target.style.willChange = 'transform, opacity';
      target.style.transition = 'transform 2000ms cubic-bezier(0.12, 0.75, 0.15, 1), opacity 2000ms ease';

      const dx = (Math.random() * window.innerWidth * 0.8) - (window.innerWidth * 0.4);
      const dy = (Math.random() * window.innerHeight * 0.8) - (window.innerHeight * 0.4);
      const rot = (Math.random() * 160) - 80;
      const scale = 0.85 + Math.random() * 0.15;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          target.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`;
          target.style.opacity = '0';
        });
      });

      setTimeout(() => {
        overlay.remove();
        target.remove();
        attackRunning = false;
      }, ATTACK_MS);
    }
    img.addEventListener('click', () => {
      if (attackRunning) return;
      if (!armed) {
        armed = true;
      }
      clickCount += 1;
      if (clickCount > ATTACK_THRESHOLD) {
        const target = pickRandomDiv();
        attack(target);
      }
    });
    strip.appendChild(img);
    if (installBox) installBox.insertAdjacentElement('afterend', strip);
    else if (search) search.insertAdjacentElement('afterend', strip);
    else host.appendChild(strip);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        strip.style.opacity = '1';
        strip.style.transform = 'translateY(0)';
      });
    });
  }
  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  if (isValentineTime(now)) init();
})();