(function () {
  const BASE = '/assets/seasonal/newyear/';
  const _t = (key, vars, fallback) => window.i18n ? (window.i18n.t(key, vars) || fallback) : fallback;

  function isSnowSeason(d) {
    return (d.getMonth() === 11) ||
           (d.getMonth() === 0  && d.getDate() <= 4);
  }

  function isNewYear(d) {
    return d.getMonth() === 0 && d.getDate() === 1;
  }

  function isCountdownVisible(d) {
    return (d.getMonth() === 11 && d.getDate() >= 27) ||
           (d.getMonth() === 0  && d.getDate() <= 4);
  }

  function getNextNewYear(d) {
    return new Date(d.getFullYear() + 1, 0, 1);
  }

  let _xmasResizeTimer = null;
  let _xmasResizeBound = false;

  function initLights() {
    const colors = ['#ff3b3b','#ffdd00','#3bff6e','#3bb5ff','#ff3bff','#ff8c00'];

    const build = () => {
      const count = Math.max(1, Math.ceil(window.innerWidth / 30));
      const topbar = document.querySelector('.topbar');
      const topOffset = document.documentElement.dataset.theme === 'material2' && topbar
        ? Math.round(topbar.getBoundingClientRect().height)
        : 0;

      const oldUl = document.getElementById('xmas-lights');
      if (oldUl) oldUl.remove();
      const oldStyle = document.getElementById('xmas-lights-style');
      if (oldStyle) oldStyle.remove();

      const style = document.createElement('style');
      style.id = 'xmas-lights-style';
      style.textContent = `
        #xmas-lights{
          position:fixed; top:${topOffset}px; left:0; right:0;
          display:grid;
          grid-template-columns:repeat(${count}, 1fr);
          z-index:9100;
          pointer-events:none;
          margin:0; padding:0; list-style:none;
          box-sizing:border-box;
          height:22px;
          overflow:hidden;
        }
        #xmas-lights li{
          position:relative;
          margin:0; padding:0;
          height:22px;
          list-style:none;
        }
        #xmas-lights li::before{
          content:'';
          position:absolute;
          top:0;
          left:50%;
          transform:translateX(-50%);
          width:2px;
          height:10px;
          background:#555;
        }
        #xmas-lights li span{
          position:absolute;
          top:6px;
          left:50%;
          transform:translateX(-50%);
          display:block;
          width:12px;
          height:16px;
          border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
          animation:xglow 1.5s infinite alternate;
        }
        @keyframes xglow{
          from{filter:brightness(0.7);}
          to{filter:brightness(1.4) drop-shadow(0 0 5px currentColor);}
        }
      `;
      document.head.appendChild(style);

      const ul = document.createElement('ul');
      ul.id = 'xmas-lights';
      for (let i = 0; i < count; i++) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        const color = colors[i % colors.length];
        span.style.cssText = `background:${color};color:${color};animation-delay:${(i * 0.15) % 1.5}s`;
        li.appendChild(span);
        ul.appendChild(li);
      }
      document.body.prepend(ul);
    };

    build();

    if (_xmasResizeBound) return;
    _xmasResizeBound = true;
    window.addEventListener('resize', () => {
      clearTimeout(_xmasResizeTimer);
      _xmasResizeTimer = setTimeout(build, 80);
    });
  }

  let _snowMusic = null;

  function initSnowMusic(d) {
    const track = isNewYear(d) ? 'themejan1.mp3'
      : (Math.random() < 0.12 ? 'themealt2.mp3' : 'theme.mp3');
    _snowMusic = new Audio(BASE + track);
    _snowMusic.loop = true;
    _snowMusic.volume = 0.5;
    const ac = new AbortController();
    const unlock = () => { _snowMusic.play().catch(() => {}); ac.abort(); };
    document.addEventListener('click',   unlock, { signal: ac.signal });
    document.addEventListener('keydown', unlock, { signal: ac.signal });
  }

  function initSnow(d) {
    const script = document.createElement('script');
    script.src = '/assets/seasonal/snowflakes.js';
    script.onload = () => {
      new Snowflakes({
        color: '#ffffff', count: 60,
        minSize: 8, maxSize: 22,
        speed: 1.2, wind: true,
        rotation: true, minOpacity: 0.4,
        maxOpacity: 0.9, zIndex: 8000,
      });
      initSnowMusic(d);
    };
    document.head.appendChild(script);
  }

  function triggerNewYear(strip) {
    if (_snowMusic) { _snowMusic.pause(); _snowMusic.currentTime = 0; }

    const sfx = new Audio(BASE + 'happynewyear.mp3');
    const year = new Date().getFullYear() + 1;
    localStorage.setItem('ny_celebrated', String(year));

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100vw', height: '100vh',
      zIndex: '99999', pointerEvents: 'none', overflow: 'hidden',
    });
    document.body.appendChild(overlay);

    const showGifs = () => {
      for (let i = 0; i < 18; i++) {
        const img = document.createElement('img');
        img.src = BASE + 'happynewyear.gif?t=' + Date.now() + i;
        Object.assign(img.style, {
          position: 'fixed', width: '280px',
          left: Math.random() * (window.innerWidth - 280) + 'px',
          top:  Math.random() * (window.innerHeight - 80) + 'px',
          zIndex: '99999', pointerEvents: 'none',
        });
        overlay.appendChild(img);
      }
    };

    sfx.addEventListener('play', showGifs, { once: true });

    sfx.addEventListener('ended', () => {
      overlay.remove();
      if (strip) strip.innerHTML = `<span>${_t('christmas.message', { year }, `🎉 Happy New Year ${year}!`)}</span>`;
      const jan1music = new Audio(BASE + 'themejan1.mp3');
      jan1music.loop = true; jan1music.volume = 0.5;
      jan1music.play().catch(() => {});
      _snowMusic = jan1music;
    }, { once: true });

    sfx.play().catch(() => {
      overlay.remove();
      if (strip) strip.innerHTML = `<span>${_t('christmas.message', { year }, `🎉 Happy New Year ${year}!`)}</span>`;
    });
  }

  function initStrip(d) {
    const installBox = document.querySelector('.install-box');
    const search = document.querySelector('.search');
    const shell = document.querySelector('.shell');
    if (!installBox && !search && !shell) return;

    const strip = document.createElement('div');
    strip.id = 'ny-strip';
    Object.assign(strip.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '0.75rem', marginTop: '1.25rem', fontFamily: 'monospace',
      fontSize: '0.95rem', color: 'rgba(255,255,255,0.55)', width: '100%',
    });
    if (installBox) installBox.after(strip);
    else if (search) search.insertAdjacentElement('afterend', strip);
    else shell.appendChild(strip);

    if (isNewYear(d)) {
      const year = d.getFullYear();
      const showGif = Math.random() < 0.5;
      strip.innerHTML = showGif
        ? `<img src="${BASE}happynewyear.gif" style="height:28px;vertical-align:middle;margin-right:4px;">`
        : `<span>${_t('christmas.message', { year }, `🎉 Happy New Year ${year}!`)}</span>`;
      return;
    }

    if (d.getMonth() === 11 && d.getDate() === 31) {
      const target = getNextNewYear(d);
      const clock = document.createElement('span');
      strip.appendChild(clock);
      let fired = false;
      function tick() {
        const diff = target - (window.MEW_NOW ? window.MEW_NOW() : new Date());
        if (diff <= 0) { if (!fired) { fired = true; clock.textContent = _t('christmas.zero', null, '🎉 00:00:00'); triggerNewYear(strip); } return; }
        const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        clock.textContent = '🎄 ' + String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        setTimeout(tick, 500);
      }
      tick(); return;
    }

    if (d.getMonth() === 11 && d.getDate() >= 27) {
      const target = getNextNewYear(d);
      const clock = document.createElement('span');
      strip.appendChild(clock);
      function tick() {
        const diff = target - (window.MEW_NOW ? window.MEW_NOW() : new Date());
        if (diff <= 0) { clock.textContent = _t('christmas.hny', null, '🎉 Happy New Year!'); return; }
        const days = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        clock.textContent = days > 0
          ? `🎄 ${days}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
          : `🎄 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        setTimeout(tick, 500);
      }
      tick(); return;
    }

    strip.innerHTML = `<span>${_t('christmas.coming', null, "🎄 new year's coming...")}</span>`;
  }

function initTree() {
    if (document.getElementById('xmas-tree')) return;

    const style = document.createElement('style');
    style.id = 'xmas-tree-style';
    style.textContent = `
      #xmas-tree{
        position:fixed; right:12px; bottom:8px;
        width:170px; height:auto;
        z-index:9000; pointer-events:none;
        transform-origin:bottom center;
        animation:xtsway 6s ease-in-out infinite;
        filter:drop-shadow(0 10px 14px rgba(0,0,0,0.35));
      }
      #xmas-tree img{ display:block; width:100%; height:auto; }
      @keyframes xtsway{ 0%,100%{transform:rotate(-1deg);} 50%{transform:rotate(1deg);} }
      @media (prefers-reduced-motion: reduce){
        #xmas-tree{ animation:none; }
      }
    `;
    document.head.appendChild(style);

    const tree = document.createElement('div');
    tree.id = 'xmas-tree';
    tree.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.src = BASE + 'animated-tree.svg';
    img.alt = '';
    tree.appendChild(img);
    document.body.appendChild(tree);
  }

  function initShat() {
    if (document.getElementById('xmas-shat')) return;
    const block = document.querySelector('.clock-block');
    if (!block) return;
    if (getComputedStyle(block).position === 'static') block.style.position = 'relative';
    document.body.classList.add('has-xmas-hat');

    const img = document.createElement('img');
    img.id = 'xmas-shat';
    img.src = '/img/shat.png';
    img.alt = '';
    Object.assign(img.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      pointerEvents: 'none',
      zIndex: '9000',
      width: 'clamp(48px, 5.5vw, 78px)',
      height: 'auto',
      transform: 'translate(-50%, -100%)',
      filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.35))',
    });
    img.addEventListener('load', positionHat, { once: true });
    block.appendChild(img);

    function positionHat() {
      const hour = document.querySelector('.clock .hour');
      if (!hour) return;
      const blockRect = block.getBoundingClientRect();
      const hourRect = hour.getBoundingClientRect();
      const style = getComputedStyle(hour);
      const fontSize = parseFloat(style.fontSize) || hourRect.height;
      const lineHeight = style.lineHeight === 'normal' ? fontSize * 1.2 : parseFloat(style.lineHeight);
      const glyphTop = hourRect.top + Math.max(0, (lineHeight - fontSize) * 0.5 + fontSize * 0.91);
      const letterSpacing = parseFloat(style.letterSpacing) || 0;
      const bias = letterSpacing < 0 ? letterSpacing * 0.25 : 0;
      let centerX = hourRect.left - blockRect.left + hourRect.width / 2 + bias;
      const text = hour.firstChild;
      if (text && text.nodeType === Node.TEXT_NODE && text.textContent.length > 1) {
        const range = document.createRange();
        range.setStart(text, 0);
        range.setEnd(text, 1);
        const digitRect = range.getBoundingClientRect();
        if (digitRect.width > 0) {
          centerX = digitRect.left - blockRect.left + digitRect.width / 2;
        }
      }
      centerX -= fontSize * 0.15;
      const hatW = Math.round(Math.max(fontSize * 0.86, 40));
      const brimGap = hatW * (29 / 512);
      let top = glyphTop - blockRect.top + brimGap;
      if (document.documentElement.dataset.theme === 'material2') {
        const shell = document.querySelector('.shell');
        if (shell) {
          const shellRect = shell.getBoundingClientRect();
          const shellPadTop = parseFloat(getComputedStyle(shell).paddingTop) || 0;
          top = Math.max(top, shellRect.top + shellPadTop - blockRect.top);
        }
      }
      img.style.width = hatW + 'px';
      img.style.left = centerX + 'px';
      img.style.top = top + 'px';
      img.style.transform = 'translate(-50%, -100%)';
    }

    const clockEl = document.querySelector('.clock');
    if (clockEl) {
      const observer = new MutationObserver(positionHat);
      observer.observe(clockEl, { childList: true, subtree: false });
      window.addEventListener('resize', positionHat);
    }
    if (img.complete) positionHat();
  }

  function run(d) {
    initLights();
    initTree();
    initShat();
    if (isSnowSeason(d)) initSnow(d);
    if (isSnowSeason(d) || isCountdownVisible(d)) initStrip(d);
  }

  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  if (isSnowSeason(now) || isCountdownVisible(now)) run(now);

})();