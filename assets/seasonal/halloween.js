(function () {
  const BASE = '/assets/deltarune/';
  const STORAGE_KEY = 'halloween_killed';
  const PUMPKIN_W = 57;
  const PUMPKIN_H = 65;
  const GAP = 6;

  const killed = localStorage.getItem(STORAGE_KEY);
  if (killed && Date.now() - parseInt(killed) < 86400000) return;

  function isHalloween(date) {
    return date.getMonth() === 9 && date.getDate() === 31;
  }

  function init() {
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';

    const music = new Audio(BASE + 'pumpkin_boss.ogg');
    music.loop = true;

    let musicStarted = false;
    let dead = false;
    let started = false;
    let activePumpkins = [];
    let bottomTimer = null;
    let topTimer = null;
    let topUnlocked = false;
    let spawnCount = 0;

    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const isDesktop = vw >= 768 && vh >= 500;
    const walkSpeed = Math.max(0.05, vw / 35000);
    const interval = Math.round((PUMPKIN_W + GAP) / walkSpeed);

    function startBottomTimer() {
      if (dead || bottomTimer) return;
      bottomTimer = setInterval(() => {
        spawnCount++;
        tryUnlockTop();
        spawnPumpkin(false);
      }, interval);
    }

    function startTopTimer() {
      if (dead || topTimer) return;
      topTimer = setInterval(() => spawnPumpkin(true), interval);
    }

    function stopTimers() {
      clearInterval(bottomTimer);
      clearInterval(topTimer);
      bottomTimer = null;
      topTimer = null;
    }

    document.addEventListener('visibilitychange', () => {
      if (dead || !started) return;
      if (document.hidden) {
        stopTimers();
      } else {
        startBottomTimer();
        if (topUnlocked) startTopTimer();
      }
    });

    function spawnPumpkin(isTop) {
      if (dead) return;

      const img = document.createElement('img');
      img.src = BASE + 'jackenstein.gif';
      img.draggable = false;

      let x = vw + PUMPKIN_W * 2;
      let rafId = null;
      let running = true;

      Object.assign(img.style, {
        position:       'fixed',
        width:          PUMPKIN_W + 'px',
        height:         PUMPKIN_H + 'px',
        left:           x + 'px',
        zIndex:         '9000',
        cursor:         'pointer',
        imageRendering: 'pixelated',
        userSelect:     'none',
        visibility:     'hidden',
      });

      img.style[isTop ? 'top' : 'bottom'] = '0px';
      if (isTop) img.style.transform = 'rotate(180deg)';

      document.body.appendChild(img);

      const entry = {
        el: img,
        cancel: () => {
          running = false;
          if (rafId !== null) cancelAnimationFrame(rafId);
        }
      };
      activePumpkins.push(entry);

      let last = null;
      let firstFrame = true;

      function step(ts) {
        if (!running || dead) return;
        if (firstFrame) {
          firstFrame = false;
          img.style.visibility = 'visible';
          last = ts;
          rafId = requestAnimationFrame(step);
          return;
        }
        const dt = Math.min(ts - last, 50);
        last = ts;
        x -= walkSpeed * dt;
        img.style.left = x + 'px';
        if (x < -PUMPKIN_W * 2) {
          running = false;
          img.remove();
          activePumpkins = activePumpkins.filter(p => p !== entry);
          return;
        }
        rafId = requestAnimationFrame(step);
      }

      rafId = requestAnimationFrame(step);
      img.addEventListener('click', onPumpkinClick);
    }

    function tryUnlockTop() {
      if (topUnlocked || !isDesktop) return;
      const chance = 1 - Math.pow(0.995, spawnCount);
      if (Math.random() < chance) {
        topUnlocked = true;
        spawnPumpkin(true);
        startTopTimer();
      }
    }

    function onPumpkinClick() {
      if (dead) return;
      if (!musicStarted) {
        music.currentTime = 0;
        music.play().catch(() => {});
        musicStarted = true;
        return;
      }
      triggerExplosion();
    }

    function triggerExplosion() {
      dead = true;
      stopTimers();

      music.pause();
      music.currentTime = 0;

      activePumpkins.forEach(({ el, cancel }) => {
        cancel();
        const canvas = document.createElement('canvas');
        canvas.width = PUMPKIN_W;
        canvas.height = PUMPKIN_H;
        try {
          canvas.getContext('2d').drawImage(el, 0, 0, PUMPKIN_W, PUMPKIN_H);
          el.src = canvas.toDataURL('image/png');
        } catch (e) {}
      });

      setTimeout(() => {
        activePumpkins.forEach(({ el }) => el.remove());
        activePumpkins = [];

        const sfx = new Audio(BASE + 'delexplosion.ogg');

        const showBoom = () => {
          const boom = document.createElement('img');
          boom.src = BASE + 'explosionlong.gif?t=' + Date.now();
          Object.assign(boom.style, {
            position:       'fixed',
            top:            '50%',
            left:           '50%',
            transform:      'translate(-50%, -50%)',
            minWidth:       '100vw',
            minHeight:      '100vh',
            width:          'auto',
            height:         'auto',
            zIndex:         '99999',
            pointerEvents:  'none',
            imageRendering: 'pixelated',
          });
          document.body.appendChild(boom);
          setTimeout(() => {
            boom.remove();
            document.documentElement.style.overflowX = '';
            document.body.style.overflowX = '';
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
          }, 2500);
        };

        sfx.addEventListener('play', showBoom, { once: true });
        sfx.play().catch(showBoom);
      }, 500);
    }

    setTimeout(() => {
      if (dead) return;
      started = true;
      spawnPumpkin(false);
      startBottomTimer();
    }, 1500);
  }

  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  if (isHalloween(now)) init();

})();