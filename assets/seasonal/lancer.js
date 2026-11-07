(function () {
  function isLancerTime(d) {
    return d.getMonth() === 8 && d.getDate() >= 8 && d.getDate() <= 14;
  }

  function init() {
    const BASE = '/assets/seasonal/lancer/';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const frameImages = {
      wave: Array.from({length: 9}, (_, i) => {
        const img = new Image();
        img.src = BASE + `wave_${i + 1}.png`;
        return img;
      }),
      spin: Array.from({length: 4}, (_, i) => {
        const img = new Image();
        img.src = BASE + `spin_${i + 1}.png`;
        return img;
      }),
      up_flip: Array.from({length: 2}, (_, i) => {
        const img = new Image();
        img.src = BASE + `up_flip_${i + 1}.png`;
        return img;
      }),
      eep: Array.from({length: 2}, (_, i) => {
        const img = new Image();
        img.src = BASE + `spr_lancer_sleep_${i}.png`;
        return img;
      }),
      walk_right: new Image(),
      walk_left: new Image(),
      walk_down: new Image(),
      walk_up: new Image(),
      jump_prepare: new Image(),
      tongue: new Image(),
      relax: new Image()
    };

    frameImages.walk_right.src = BASE + 'walk/right.png';
    frameImages.walk_left.src = BASE + 'walk/left.png';
    frameImages.walk_down.src = BASE + 'walk/down.png';
    frameImages.walk_up.src = BASE + 'walk/up.png';
    frameImages.jump_prepare.src = BASE + 'jump_prepare.png';
    frameImages.tongue.src = BASE + 'tongue.png';
    frameImages.relax.src = BASE + 'spr_lancer_dark_relax.png';

    const splatSfx = new Audio(BASE + 'splat.mp3');

    const lancer = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      gravity: 0,
      scale: 3,
      currentAction: 'WAVE',
      currentAnimation: 'wave',
      animationFrame: 0,
      frameTimer: 0,
      isIdle: false,
      idleTimer: 0,
      isAction: false,
      actionTimer: 0,
      actionsDone: 0,
      minX: 0,
      maxX: 0,
      maxY: 0,
      hitbox: null,
      walkAnimation: null,
      lastAction: 'WAVE',
      cooldowns: { relax: 0, eep: 0 }
    };

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;

      const limitWidth = Math.min(360 * lancer.scale, window.innerWidth - 50);
      lancer.minX = window.innerWidth / 2 - limitWidth / 2;
      lancer.maxX = window.innerWidth / 2 + limitWidth / 2;
      lancer.maxY = window.innerHeight - 10;
      
      if (lancer.y > lancer.maxY) {
        lancer.y = lancer.maxY;
      }
      if (lancer.x < lancer.minX) {
        lancer.x = lancer.minX;
      } else if (lancer.x > lancer.maxX) {
        lancer.x = lancer.maxX;
      }
    }
    window.addEventListener('resize', resize);
    resize();

    lancer.x = window.innerWidth / 2;
    lancer.y = lancer.maxY;

    function startAction() {
      lancer.isIdle = false;
      lancer.isAction = false;
      lancer.animationFrame = 0;
      lancer.frameTimer = 0;

      if (lancer.currentAction === 'WAVE') {
        lancer.currentAnimation = 'wave';
      } else if (lancer.currentAction === 'WALK') {
        lancer.vx = Math.random() < 0.5 ? 4 : -4;
        if (Math.random() < 1/3) {
          lancer.currentAnimation = 'up_flip';
          lancer.walkAnimation = 'up_flip';
        } else {
          const anim = lancer.vx > 0 ? 'walk_right' : 'walk_left';
          lancer.currentAnimation = anim;
          lancer.walkAnimation = anim;
        }
        lancer.actionTimer = 16;
        lancer.isAction = true;
      } else if (lancer.currentAction === 'JUMP_PREPARE') {
        lancer.currentAnimation = 'jump_prepare';
        lancer.actionTimer = 20;
        lancer.isAction = true;
      } else if (lancer.currentAction === 'RELAX') {
        lancer.currentAnimation = 'relax';
        lancer.actionTimer = 900;
        lancer.isAction = true;
      } else if (lancer.currentAction === 'EEP') {
        lancer.currentAnimation = 'eep';
        lancer.actionTimer = 1500;
        lancer.isAction = true;
      }
    }

    function processActionEnd() {
      lancer.isAction = false;

      if (lancer.currentAction === 'WALK') {
        if (Math.random() < 1/3) {
          lancer.currentAnimation = 'walk_down';
        } else {
          lancer.currentAnimation = 'up_flip';
          lancer.animationFrame = 0;
          lancer.frameTimer = 0;
        }
        lancer.vx = 0;
        lancer.vy = 0;
        lancer.gravity = 0;
        lancer.idleTimer = 30;
        lancer.isIdle = true;
        lancer.currentAction = 'IDLE';
      } else if (lancer.currentAction === 'JUMP_PREPARE') {
        const multiplier = Math.random() < 0.5 ? 1 : 2;
        lancer.vy = -4 * multiplier;
        lancer.gravity = 0.25;
        lancer.vx = (Math.random() < 0.5 ? -1 : 1) * multiplier;
        lancer.currentAnimation = 'spin';
        lancer.animationFrame = 0;
        lancer.frameTimer = 0;
        lancer.currentAction = 'JUMP';
        lancer.actionTimer = 16 * multiplier;
        lancer.isAction = true;
      } else if (lancer.currentAction === 'JUMP') {
        lancer.vx = 0;
        lancer.vy = 0;
        lancer.gravity = 0;
        lancer.currentAnimation = 'tongue';
        lancer.currentAction = 'TONGUE';
        lancer.actionTimer = 60;
        lancer.isAction = true;
      } else if (lancer.currentAction === 'TONGUE') {
        lancer.currentAnimation = 'walk_down';
        lancer.currentAction = 'DROP_DOWN';
        lancer.gravity = 0.25;
      } else if (['RELAX', 'EEP'].includes(lancer.currentAction)) {
        lancer.vx = 0;
        lancer.vy = 0;
        lancer.gravity = 0;
        lancer.idleTimer = 30;
        lancer.isIdle = true;
        lancer.currentAction = 'IDLE';
      }
    }

    function update() {
      if (lancer.isIdle) lancer.idleTimer--;
      if (lancer.isAction) lancer.actionTimer--;

      if (['wave', 'spin', 'up_flip', 'eep'].includes(lancer.currentAnimation)) {
        lancer.frameTimer++;
        
        if (lancer.currentAnimation === 'wave' && lancer.frameTimer >= 12) {
          lancer.frameTimer = 0;
          if (lancer.animationFrame < 8) {
            lancer.animationFrame++;
          } else if (lancer.currentAction === 'WAVE') {
            lancer.idleTimer = 30;
            lancer.isIdle = true;
            lancer.currentAction = 'IDLE';
          }
        } else if (lancer.currentAnimation === 'spin' && lancer.frameTimer >= 12) {
          lancer.frameTimer = 0;
          lancer.animationFrame = (lancer.animationFrame + 1) % 4;
        } else if (lancer.currentAnimation === 'up_flip' && lancer.frameTimer >= 12) {
          lancer.frameTimer = 0;
          lancer.animationFrame = (lancer.animationFrame + 1) % 2;
        } else if (lancer.currentAnimation === 'eep' && lancer.frameTimer >= 30) {
          lancer.frameTimer = 0;
          lancer.animationFrame = (lancer.animationFrame + 1) % 2;
        }
      }

      if (['WALK', 'JUMP'].includes(lancer.currentAction)) {
        if ((lancer.x < lancer.minX && lancer.vx < 0) || (lancer.x > lancer.maxX && lancer.vx > 0)) {
          lancer.vx = -lancer.vx;
          if (lancer.walkAnimation === 'walk_right') {
            lancer.currentAnimation = 'walk_left';
            lancer.walkAnimation = 'walk_left';
          } else if (lancer.walkAnimation === 'walk_left') {
            lancer.currentAnimation = 'walk_right';
            lancer.walkAnimation = 'walk_right';
          }
        }
      }

      if (lancer.isAction && lancer.actionTimer <= 0) {
        processActionEnd();
      }

      if (lancer.currentAction === 'DROP_DOWN' && lancer.y >= lancer.maxY) {
        lancer.vx = 0;
        lancer.vy = 0;
        lancer.gravity = 0;
        lancer.y = lancer.maxY;
        lancer.idleTimer = 24;
        lancer.isIdle = true;
        lancer.currentAction = 'IDLE';
      }

      if (lancer.isIdle && lancer.idleTimer <= 0) {
        lancer.vx = 0;
        lancer.vy = 0;
        lancer.gravity = 0;
        
        lancer.cooldowns.relax--;
        lancer.cooldowns.eep--;

        let available = ['WALK', 'JUMP_PREPARE'];
        if (lancer.cooldowns.relax <= 0) available.push('RELAX');
        if (lancer.cooldowns.eep <= 0) available.push('EEP');

        available = available.filter(a => a !== lancer.lastAction);
        if (available.length === 0) available = ['WALK'];

        const weights = {
          'WALK': 60,
          'JUMP_PREPARE': 35,
          'RELAX': 3,
          'EEP': 3
        };

        let total = available.reduce((sum, a) => sum + weights[a], 0);
        let roll = Math.random() * total;
        let chosen = available[0];

        for (let a of available) {
          roll -= weights[a];
          if (roll <= 0) {
            chosen = a;
            break;
          }
        }

        lancer.lastAction = chosen;
        if (chosen === 'RELAX') lancer.cooldowns.relax = 15;
        if (chosen === 'EEP') lancer.cooldowns.eep = 15;

        lancer.currentAction = chosen;
        lancer.actionsDone++;
        startAction();
      }

      lancer.x += lancer.vx;
      lancer.y += lancer.vy;
      if (lancer.gravity > 0) {
        lancer.vy += lancer.gravity;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let img = null;
      if (['wave', 'spin', 'up_flip', 'eep'].includes(lancer.currentAnimation)) {
        const frames = frameImages[lancer.currentAnimation];
        img = frames[Math.min(lancer.animationFrame, frames.length - 1)];
      } else {
        img = frameImages[lancer.currentAnimation];
      }

      if (img && img.complete && img.naturalWidth > 0) {
        const hw = (img.naturalWidth / 2) * lancer.scale;
        const h = img.naturalHeight * lancer.scale;

        ctx.save();
        ctx.translate(lancer.x, lancer.y);
        ctx.scale(lancer.scale, lancer.scale);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight);
        ctx.restore();

        lancer.hitbox = {
          x: lancer.x - hw,
          y: lancer.y - h,
          w: hw * 2,
          h: h
        };
      }
    }

    let lastTime = performance.now();
    let accumulator = 0;
    const STEP = 1000 / 60;

    function loop(time) {
      requestAnimationFrame(loop);
      
      const dt = Math.min(time - lastTime, 100);
      lastTime = time;
      accumulator += dt;

      while (accumulator >= STEP) {
        update();
        accumulator -= STEP;
      }

      draw();
    }

    const interceptEvents = ['mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchend'];

    interceptEvents.forEach(type => {
      window.addEventListener(type, (e) => {
        if (!lancer.hitbox) return;
        
        let clickX = e.clientX;
        let clickY = e.clientY;
        
        if (e.type.startsWith('touch')) {
          if (e.touches && e.touches.length > 0) {
            clickX = e.touches[0].clientX;
            clickY = e.touches[0].clientY;
          } else if (e.changedTouches && e.changedTouches.length > 0) {
            clickX = e.changedTouches[0].clientX;
            clickY = e.changedTouches[0].clientY;
          }
        }
        
        const hb = lancer.hitbox;
        if (clickX >= hb.x && clickX <= hb.x + hb.w &&
            clickY >= hb.y && clickY <= hb.y + hb.h) {
          
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          if (type === 'mousedown' || type === 'touchstart') {
            splatSfx.cloneNode().play().catch(() => {});
          }
        }
      }, { capture: true, passive: false });
    });

    startAction();
    requestAnimationFrame(loop);
  }

  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  if (isLancerTime(now)) init();
})();