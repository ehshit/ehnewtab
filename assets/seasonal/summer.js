(function () {
  const BASE = '/assets/seasonal/summer/';

  function isSummer(d) {
    return d.getMonth() >= 5 && d.getMonth() <= 7;
  }

  function isLeftPosition(d) {
    const m = d.getMonth();
    const day = d.getDate();
    const leftDates = [
      { month: 5, day: 15 },
      { month: 5, day: 30 },
      { month: 6, day: 4 },
      { month: 6, day: 18 },
      { month: 7, day: 10 },
      { month: 7, day: 25 },
    ];
    return leftDates.some(date => date.month === m && date.day === day);
  }

  function init() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 300;
    canvas.height = 300;
    canvas.style.position = 'fixed';
    canvas.style.bottom = '0px';
    const useLeft = isLeftPosition(new Date());
    
    if (useLeft) {
      canvas.style.left = '0px';
    } else {
      canvas.style.right = '0px';
    }
    
    canvas.style.width = '300px';
    canvas.style.height = '300px';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'auto';
    document.body.appendChild(canvas);

    const img0 = new Image();
    const img1 = new Image();

    const harp = new Audio(BASE + 'mus_harpnoise.ogg');
    const mus = new Audio(BASE + 'mus_options_summer.ogg');
    mus.loop = true;

    let extreme = 0;
    let extreme2 = 0;
    let siner = 0;
    let activated = false;
    let imagesLoaded = false;
    
    let flipX = 1;
    if (useLeft) {
      let currentLevel = 0;
      let prob = 0.05;
      
      const storedState = localStorage.getItem('tobdog_rare_state');
      if (storedState) {
          try {
              const parsed = JSON.parse(storedState);
              if (Math.abs(Date.now() - parsed.ts) <= 2500) {
                  currentLevel = Math.min(parsed.level + 1, 2);
              }
          } catch (e) {}
          localStorage.removeItem('tobdog_rare_state');
      }

      if (currentLevel === 1) prob = 0.03;
      else if (currentLevel === 2) prob = 0.15;

      if (Math.random() < prob) {
          flipX = 1;
          localStorage.setItem('tobdog_rare_state', JSON.stringify({ ts: Date.now(), level: currentLevel }));
      } else {
          flipX = -1;
      }
    }

    img0.onload = () => { if (img1.complete) imagesLoaded = true; };
    img1.onload = () => { if (img0.complete) imagesLoaded = true; };

    img0.src = BASE + 'spr_tobdog_summer_0.png';
    img1.src = BASE + 'spr_tobdog_summer_1.png';

    if (img0.complete && img1.complete) {
      imagesLoaded = true;
    }

    harp.addEventListener('ended', () => {
        mus.play();
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (x >= 115 && x <= 215 && y >= 200 && y <= 300) {
            if (!activated) {
                activated = true;
                harp.play();
            }
        }
    });

    const translateX = useLeft ? 130 : 170;

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!imagesLoaded) {
            requestAnimationFrame(loop);
            return;
        }

        extreme2 += 1;
        
        if (extreme2 >= 240) {
            extreme += 1;
            
            if (extreme >= 1100 && Math.abs(Math.sin(siner / 15)) < 0.1) {
                extreme = 0;
                extreme2 = 0;
            }
        }
        
        siner += 1;

        const frame = Math.floor(siner / 15) % 2;
        const img = frame === 0 ? img0 : img1;
        
        const scaleX = 0.25 + (Math.sin(siner / 15) * (0.03 + (extreme / 6000)));
        const scaleY = 0.25 - (Math.sin(siner / 15) * (0.03 + (extreme / 6000)));

        if (img.complete && img.naturalWidth !== 0) {
            ctx.save();
            ctx.translate(translateX, 290);
            ctx.scale(scaleX * flipX, scaleY);
            ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight);
            ctx.restore();
        }

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  if (isSummer(now)) init();

})();