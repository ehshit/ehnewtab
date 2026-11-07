(function () {
  function isQueenTime(d) {
    return d.getMonth() === 8 && d.getDate() === 21;
  }
  function init() {
    const BASE = '/assets/seasonal/queen/';
    const now = () => (window.MEW_NOW ? window.MEW_NOW() : new Date());
    const nextMidnight = (date) => {
      const next = new Date(date);
      next.setHours(24, 0, 0, 0);
      return next.getTime();
    };
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'none';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.imageRendering = 'crisp-edges';
    document.body.appendChild(canvas);
    const isStanding = Math.random() < 0.15;
    const frameImages = {
      queenstand: new Image(),
      queenaltchairidle: Array.from({length: 4}, (_, i) => {
        const img = new Image();
        img.src = BASE + `queenaltchairidle${i + 1}.png`;
        return img;
      }),
      queenlaugh: Array.from({length: 2}, (_, i) => {
        const img = new Image();
        img.src = BASE + `queenlaugh${i + 1}.png`;
        return img;
      }),
      queenaltchairlaugh: Array.from({length: 2}, (_, i) => {
        const img = new Image();
        img.src = BASE + `queenaltchairlaugh${i + 1}.png`;
        return img;
      })
    };
    frameImages.queenstand.src = BASE + 'queenstand.png';
    const laughSfx = new Audio(BASE + 'snd_queen_laugh.ogg');
    const laugh1Sfx = new Audio(BASE + 'snd_queen_laugh1.ogg');
    laughSfx.preload = 'auto';
    laugh1Sfx.preload = 'auto';
    let laughDuration = 2000;
    let laugh1Duration = 2000;
    laughSfx.addEventListener('loadedmetadata', () => {
      laughDuration = laughSfx.duration * 1000;
    });
    laugh1Sfx.addEventListener('loadedmetadata', () => {
      laugh1Duration = laugh1Sfx.duration * 1000;
    });
    const queen = {
      x: 0,
      y: 0,
      scale: 3,
      isStanding: isStanding,
      state: 'idle',
      animationFrame: 0,
      frameTimer: 0,
      hitbox: null,
      canClick: true,
      currentAudio: null,
      audioEndTime: 0,
      opacity: 1,
      disappearAt: nextMidnight(now()),
      fadeoutEndsAt: 0
    };
    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    document.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    });
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;
    }
    window.addEventListener('resize', resize);
    resize();
    if (queen.isStanding) {
      queen.x = window.innerWidth / 2 + (45 * 3);
      queen.y = window.innerHeight - 20;
    } else {
      queen.x = window.innerWidth / 2;
      queen.y = window.innerHeight - 20;
    }
    function update() {
      if (queen.state !== 'fadeout' && now().getTime() >= queen.disappearAt) {
        queen.state = 'fadeout';
        queen.canClick = false;
        queen.animationFrame = 0;
        queen.frameTimer = 0;
        queen.fadeoutEndsAt = performance.now() + 2000;
        const useLaugh1 = Math.random() < 0.042;
        const sfx = useLaugh1 ? laugh1Sfx : laughSfx;
        const duration = useLaugh1 ? laugh1Duration : laughDuration;
        const clonedAudio = sfx.cloneNode();
       
        queen.currentAudio = clonedAudio;
        queen.audioEndTime = performance.now() + duration;
       
        clonedAudio.play().catch(() => {});
      }
      if (queen.state === 'fadeout') {
        queen.frameTimer++;
        const frameDuration = 15;
       
        if (queen.frameTimer >= frameDuration) {
          queen.frameTimer = 0;
          queen.animationFrame++;
         
          const laughFrames = 2;
          if (queen.animationFrame >= laughFrames) {
            queen.animationFrame = 0;
          }
        }
        queen.opacity = Math.max(0, (queen.fadeoutEndsAt - performance.now()) / 2000);
        if (performance.now() >= queen.fadeoutEndsAt) {
          canvas.style.opacity = '0';
          canvas.style.transition = 'opacity 2s ease-out';
          setTimeout(() => {
            canvas.remove();
          }, 2000);
          return;
        }
      } else if (queen.state === 'laugh') {
        queen.frameTimer++;
        const frameDuration = 15;
       
        if (queen.frameTimer >= frameDuration) {
          queen.frameTimer = 0;
          queen.animationFrame++;
         
          const laughFrames = queen.isStanding ? 2 : 2;
          if (queen.animationFrame >= laughFrames) {
            queen.animationFrame = 0;
          }
        }
        if (queen.currentAudio && performance.now() >= queen.audioEndTime) {
          queen.state = 'idle';
          queen.animationFrame = 0;
          queen.currentAudio = null;
          queen.canClick = true;
        }
      } else if (queen.state === 'idle' && !queen.isStanding) {
        queen.frameTimer++;
        const frameDuration = 20;
       
        if (queen.frameTimer >= frameDuration) {
          queen.frameTimer = 0;
          queen.animationFrame = (queen.animationFrame + 1) % 4;
        }
      }
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let img = null;
      if (queen.state === 'laugh' || queen.state === 'fadeout') {
        const laughFrames = queen.isStanding ? frameImages.queenlaugh : frameImages.queenaltchairlaugh;
        img = laughFrames[Math.min(queen.animationFrame, laughFrames.length - 1)];
      } else {
        if (queen.isStanding) {
          img = frameImages.queenstand;
        } else {
          img = frameImages.queenaltchairidle[queen.animationFrame % 4];
        }
      }
      if (img && img.complete && img.naturalWidth > 0) {
        const hw = (img.naturalWidth / 2) * queen.scale;
        const h = img.naturalHeight * queen.scale;
        ctx.save();
        ctx.globalAlpha = queen.opacity;
        ctx.translate(queen.x, queen.y);
        ctx.scale(queen.scale, queen.scale);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight);
        ctx.restore();
        queen.hitbox = {
          x: queen.x - hw,
          y: queen.y - h,
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
    const interceptEvents = ['mousedown', 'touchstart'];
    interceptEvents.forEach(type => {
      window.addEventListener(type, (e) => {
        if (!queen.hitbox || !queen.canClick || queen.state === 'laugh') return;
       
        let clickX = e.clientX;
        let clickY = e.clientY;
       
        if (e.type.startsWith('touch')) {
          if (e.touches && e.touches.length > 0) {
            clickX = e.touches[0].clientX;
            clickY = e.touches[0].clientY;
          }
        }
       
        const hb = queen.hitbox;
        if (clickX >= hb.x && clickX <= hb.x + hb.w &&
            clickY >= hb.y && clickY <= hb.y + hb.h) {
         
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          queen.state = 'laugh';
          queen.animationFrame = 0;
          queen.frameTimer = 0;
          queen.canClick = false;
          const useLaugh1 = Math.random() < 0.042;
          const sfx = useLaugh1 ? laugh1Sfx : laughSfx;
          const duration = useLaugh1 ? laugh1Duration : laughDuration;
          const clonedAudio = sfx.cloneNode();
         
          queen.currentAudio = clonedAudio;
          queen.audioEndTime = performance.now() + duration;
         
          clonedAudio.play().catch(() => {});
        }
      }, { capture: true, passive: false });
    });
    requestAnimationFrame(loop);
  }
  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  if (isQueenTime(now)) init();
})();