(function () {
  'use strict';

  const BASE = '/assets/seasonal/yuri/';
  const QUALITY = window.MEW_DOODLE_QUALITY || 'full';
  const LOW_END = QUALITY === 'low';
  const MID_END = QUALITY === 'normal';
  const START_MONTH = 0;
  const START_DAY = 16;
  const TOTAL_DAYS = 15;

  function dayIndex(date) {
    if (date.getMonth() !== START_MONTH) return -1;
    const index = date.getDate() - START_DAY;
    return index >= 0 && index < TOTAL_DAYS ? index : -1;
  }

  function play(audio) {
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      const pending = audio.play();
      if (pending && typeof pending.catch === 'function') pending.catch(() => {});
    } catch {}
  }

  function makeImage(src, alt) {
    const img = new Image();
    img.src = src;
    img.alt = alt;
    img.draggable = false;
    img.decoding = 'async';
    Object.assign(img.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      imageRendering: 'pixelated',
      userSelect: 'none',
    });
    return img;
  }

  function addSpin(img) {
    let angle = 0;
    img.style.transformOrigin = 'center center';
    img.style.transition = (img.style.transition ? img.style.transition + ', ' : '') + 'rotate 420ms ease';
    img.addEventListener('click', (event) => {
      event.preventDefault();
      angle += 360;
      img.style.rotate = `${angle}deg`;
    });
  }

  function installStatic() {
    const img = makeImage(BASE + 'blahaj.png', 'You found the blahaj!');
    Object.assign(img.style, {
      bottom: '16px',
      left: '16px',
      top: 'auto',
      width: '80px',
      height: '80px',
      objectFit: 'contain',
      zIndex: '9000',
      pointerEvents: 'auto',
      cursor: 'pointer',
      transformOrigin: 'center center',
      transition: 'transform 420ms ease',
    });
    addSpin(img);
    document.body.appendChild(img);
  }

  function installFast(index, freezeDay) {
    const variants = [
      { dir: 1, speed: 10, lane: 0.78, amp: 16, freq: 0.004 },
      { dir: -1, speed: 16, lane: 0.54, amp: 26, freq: 0.006 },
      { dir: 1, speed: 23, lane: 0.34, amp: 38, freq: 0.008 },
      { dir: -1, speed: 31, lane: 0.18, amp: 52, freq: 0.01 },
    ];
    const variant = variants[index - 3] || variants[0];
    const size = LOW_END ? 64 : MID_END ? 76 : 88;
    const pad = LOW_END ? 16 : MID_END ? 24 : 30;
    const hit = document.createElement('div');
    Object.assign(hit.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      width: size + pad * 2 + 'px',
      height: size + pad * 2 + 'px',
      zIndex: '9000',
      pointerEvents: 'auto',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      willChange: 'transform',
    });
    const spinner = document.createElement('div');
    Object.assign(spinner.style, {
      width: size + 'px',
      height: size + 'px',
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
    const img = makeImage(BASE + 'blahaj.png', 'You found the blahaj!');
    Object.assign(img.style, {
      position: 'static',
      left: 'auto',
      top: 'auto',
      width: size + 'px',
      height: size + 'px',
      objectFit: 'contain',
      pointerEvents: 'none',
      transform: `scaleX(${variant.dir})`,
      willChange: 'transform',
    });
    spinner.appendChild(img);
    hit.appendChild(spinner);
    hit.title = 'click to stop, click to go again';
    document.body.appendChild(hit);

    const bell = new Audio(BASE + 'snd_bell.wav');
    let x = variant.dir > 0 ? -size - 24 : window.innerWidth + 24;
    let y = window.innerHeight * variant.lane;
    let elapsed = 0;
    let frozen = false;

    function toggle() {
      frozen = !frozen;
      play(bell);
    }

    hit.addEventListener('click', toggle);

    let last = 0;
    let raf = 0;
    function frame(ts) {
      if (!last) last = ts;
      const dt = Math.min(ts - last, 50);
      last = ts;
      if (!frozen && !document.hidden) {
        elapsed += dt;
        x += variant.dir * variant.speed * dt / 16.67;
        y = window.innerHeight * variant.lane + Math.sin(elapsed * variant.freq) * variant.amp;
        y = Math.max(8, Math.min(window.innerHeight - size - 8, y));
        if (variant.dir > 0 && x > window.innerWidth + size + 24) x = -size - 24;
        if (variant.dir < 0 && x < -size - 48) x = window.innerWidth + 24;
        hit.style.transform = `translate3d(${x - pad}px, ${y - pad}px, 0)`;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) last = performance.now();
    });
    window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
  }

  function installBattle() {
    const size = LOW_END ? 110 : MID_END ? 140 : 180;
    const alertW = LOW_END ? 56 : MID_END ? 72 : 96;
    const alertH = alertW / 2;
    const sweatSize = LOW_END ? 34 : MID_END ? 48 : 64;
    const touchRadius = size / 2 + 60;
    const sweatMs = LOW_END ? 380 : MID_END ? 400 : 400;
    const runCue = 0.4;
    const runSpeed = LOW_END ? 60 : MID_END ? 85 : 120;
    const ghostGap = LOW_END ? 70 : MID_END ? 45 : 30;
    const splashGap = 420;
    const hit = document.createElement('div');
    Object.assign(hit.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      width: size + 'px',
      height: size + 'px',
      zIndex: '9000',
      pointerEvents: 'auto',
      cursor: 'pointer',
      willChange: 'transform',
    });
    const spinner = document.createElement('div');
    Object.assign(spinner.style, {
      width: size + 'px',
      height: size + 'px',
      pointerEvents: 'auto',
    });
    const img = makeImage(BASE + 'blahaj.png', 'You found the blahaj!');
    Object.assign(img.style, {
      position: 'static',
      left: 'auto',
      top: 'auto',
      width: size + 'px',
      height: size + 'px',
      objectFit: 'contain',
      pointerEvents: 'none',
      transform: 'scaleX(1)',
      willChange: 'transform',
    });
    spinner.appendChild(img);
    hit.appendChild(spinner);
    hit.title = 'blåhaj found you';
    addSpin(spinner);
    document.body.appendChild(hit);

    const sndB = new Audio(BASE + 'snd_b.wav');
    const sndRun = new Audio(BASE + 'snd_defeatrun.wav');
    const pointer = { x: -9999, y: -9999 };

    let x = -size - 20;
    let y = window.innerHeight * 0.72;
    let dir = 1;
    let speed = 1.5;
    let state = 'patrol';
    let alertTimer = 0;
    let sweatTimer = 0;
    let runTimer = 0;
    let elapsed = 0;
    let lastGhostTick = 0;
    let sweatEl = null;
    let splashDone = false;
    let ghosts = [];
    let done = false;
    let last = 0;
    let raf = 0;

    document.addEventListener('pointermove', (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });

    function centerX() {
      return x + size / 2;
    }

    function centerY() {
      return y + size / 2;
    }

    function distanceToPointer() {
      const dx = pointer.x - centerX();
      const dy = pointer.y - centerY();
      return Math.sqrt(dx * dx + dy * dy);
    }

    function showAlert() {
      const exc = makeImage(BASE + 'spr_exc_0.png', '!');
      Object.assign(exc.style, {
        width: alertW + 'px',
        height: alertH + 'px',
        zIndex: '9001',
        pointerEvents: 'none',
      });
      exc.style.transform = `translate3d(${centerX() - alertW / 2}px, ${y - alertH - 14}px, 0)`;
      document.body.appendChild(exc);
      setTimeout(() => exc.remove(), LOW_END ? 420 : 560);
    }

    function showSweat() {
      if (sweatEl) sweatEl.remove();
      const sweat = makeImage(BASE + 'spr_defeatsweat_0.png', 'sweat');
      Object.assign(sweat.style, {
        width: sweatSize + 'px',
        height: sweatSize + 'px',
        zIndex: '9002',
        pointerEvents: 'none',
      });
      sweat.style.transform = `translate3d(${x - sweatSize / 2}px, ${y - sweatSize / 2}px, 0)`;
      document.body.appendChild(sweat);
      sweatEl = sweat;
      if (sweat.animate) {
        sweat.animate(
          [
            { opacity: 1, offset: 0 },
            { opacity: 1, offset: 0.4 },
            { opacity: 0, offset: 0.4 },
            { opacity: 0, offset: 0.6 },
            { opacity: 1, offset: 0.6 },
            { opacity: 1, offset: 0.933 },
            { opacity: 0, offset: 0.933 },
            { opacity: 0, offset: 1 },
          ],
          { duration: sweatMs, iterations: 1, easing: 'linear' }
        );
      }
      setTimeout(() => {
        if (sweatEl === sweat) sweatEl = null;
        sweat.remove();
      }, sweatMs + 40);
    }

    function clearAfterimages() {
      for (const ghost of ghosts) ghost.remove();
      ghosts = [];
    }

    function addAfterimage(ghostX, ghostY, opacity) {
      const ghost = makeImage(BASE + 'blahaj.png', 'You found the blahaj!');
      Object.assign(ghost.style, {
        width: size + 'px',
        height: size + 'px',
        objectFit: 'contain',
        opacity: String(opacity),
        zIndex: '8999',
        pointerEvents: 'none',
      });
      ghost.style.transform = `translate3d(${ghostX}px, ${ghostY}px, 0)`;
      document.body.appendChild(ghost);
      ghosts.push(ghost);
      setTimeout(() => {
        ghost.remove();
        ghosts = ghosts.filter((item) => item !== ghost);
      }, LOW_END ? 220 : 340);
    }

    function showAfterimages() {
      const count = LOW_END ? 10 : MID_END ? 24 : 40;
      for (let i = 0; i < count; i++) {
        addAfterimage(x + 4 * i, y, Math.max(0.04, Math.min(0.8, 0.4 + i / 200)));
      }
    }

    function finish() {
      if (done) return;
      done = true;
      clearAfterimages();
      hit.remove();
      if (sweatEl) {
        sweatEl.remove();
        sweatEl = null;
      }
      cancelAnimationFrame(raf);
    }

    function defeat() {
      if (done || state === 'sweat' || state === 'run') return;
      state = 'sweat';
      sweatTimer = 0;
      runTimer = 0;
      lastGhostTick = 0;
      splashDone = false;
      dir = 1;
      play(sndRun);
      showSweat();
      img.style.opacity = '1';
    }

    hit.addEventListener('click', defeat);

    function frame(ts) {
      if (!last) last = ts;
      const dt = Math.min(ts - last, 50);
      last = ts;
      if (!document.hidden && !done) {
        if (state === 'patrol') {
          elapsed += dt;
          x += dir * speed * dt / 16.67;
          y = window.innerHeight * 0.72 + Math.sin(elapsed * 0.006) * 18;
          if (x > window.innerWidth + size + 20) {
            x = -size - 20;
            dir = 1;
          }
          if (x < -size - 40) {
            x = window.innerWidth + 20;
            dir = -1;
          }
          if (distanceToPointer() <= touchRadius) {
            state = 'alert';
            speed = 0;
            alertTimer = 0;
            play(sndB);
            showAlert();
          }
        } else if (state === 'alert') {
          alertTimer += dt;
          if (alertTimer >= (LOW_END ? 200 : 333)) {
            defeat();
          }
        } else if (state === 'sweat') {
          sweatTimer += dt;
          if (sweatEl) {
            sweatEl.style.transform = `translate3d(${x - sweatSize / 2}px, ${y - sweatSize / 2}px, 0)`;
          }
          if (sweatTimer >= sweatMs && (sndRun.currentTime >= runCue || sweatTimer >= sweatMs + 250)) {
            state = 'run';
            runTimer = 0;
            lastGhostTick = 0;
            dir = 1;
            showAfterimages();
          }
        } else if (state === 'run') {
          runTimer += dt;
          x += runSpeed * dt / 16.67;
          if (!splashDone && runTimer >= splashGap) {
            splashDone = true;
            clearAfterimages();
            showAfterimages();
          }
          if (runTimer - lastGhostTick >= ghostGap) {
            lastGhostTick = runTimer;
            addAfterimage(x - size - 16, y, 0.28);
          }
          if (x > window.innerWidth + size + 60) finish();
        }
        if (!done) {
          hit.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          img.style.transform = `scaleX(${dir})`;
        }
      }
      if (!done) raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) last = performance.now();
    });
    window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
  }

  function installLastDay() {
    const nowFn = () => (window.MEW_NOW ? window.MEW_NOW() : new Date());
    const midnight = new Date(nowFn());
    midnight.setHours(24, 0, 0, 0);
    const midnightMs = midnight.getTime();

    const img = makeImage(BASE + 'blahaj.png', 'You found the blahaj!');
    const size = LOW_END ? 84 : MID_END ? 108 : 132;
    Object.assign(img.style, {
      position: 'static',
      left: 'auto',
      top: 'auto',
      display: 'block',
      width: size + 'px',
      height: size + 'px',
      objectFit: 'contain',
      margin: '0.5rem auto 0',
      pointerEvents: 'auto',
      cursor: 'pointer',
      opacity: '1',
      transformOrigin: 'center center',
      transition: 'transform 420ms ease',
    });

    const attr = document.getElementById('attr') || document.querySelector('.attr');
    const anchor = attr || document.querySelector('.search') || document.querySelector('.install-box');
    if (anchor) anchor.insertAdjacentElement('afterend', img);
    else document.body.appendChild(img);

    const sfx = new Audio(BASE + 'blahajgo.mp3');
    let clicks = 0;
    let spinReady = false;
    let started = false;
    let raf = 0;

    img.addEventListener('click', (event) => {
      event.preventDefault();
      clicks += 1;
      if (clicks >= 350 && !spinReady) {
        spinReady = true;
        addSpin(img);
      }
    });

    function tick() {
      const remaining = midnightMs - nowFn().getTime();
      if (!started && remaining <= 0) {
        started = true;
        play(sfx);
        const start = performance.now();
        const duration = 5000;
        const fade = (ts) => {
          const p = Math.min(1, (ts - start) / duration);
          img.style.opacity = String(1 - p);
          if (p >= 1) {
            img.remove();
            return;
          }
          requestAnimationFrame(fade);
        };
        requestAnimationFrame(fade);
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
  }

  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  const index = dayIndex(now);
  if (index < 0) return;

  if (index <= 2) installStatic();
  else if (index <= 6) installFast(index, false);
  else if (index === 7) installFast(index, true);
  else if (index === 14) installLastDay();
  else installBattle();
})();