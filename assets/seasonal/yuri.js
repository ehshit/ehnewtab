(function () {
  'use strict';

  const ID = 'yuri-doodle';
  const STYLE_ID = 'yuri-doodle-style';
  const BASE = '/assets/seasonal/yuri/';
  const DATES = ['04-09', '02-18', '12-23'];

  function monthDay(date) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function isYuriDay(date) {
    return DATES.includes(monthDay(date));
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ID} {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        margin-top: 0.85rem;
        cursor: pointer;
      }
      #${ID} .yuri-pair {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
      }
      #${ID} .yuri-shark {
        display: block;
        height: 42px;
        width: auto;
      }
      #${ID} .yuri-left {
        transform: scaleX(-1);
      }
      #${ID} .yuri-heart {
        position: absolute;
        left: 50%;
        top: 50%;
        opacity: 0;
        color: #ff8fb1;
        font-family: var(--font-mono, monospace);
        font-size: 18px;
        line-height: 1;
        pointer-events: none;
      }
      #${ID} .yuri-flag {
        display: flex;
        width: 96px;
        height: 8px;
        border-radius: 2px;
        overflow: hidden;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
      }
      #${ID} .yuri-flag span {
        flex: 1 1 0;
      }
      #${ID} .yuri-text {
        font-family: monospace;
        font-size: 0.95rem;
        white-space: nowrap;
        color: var(--date-color, var(--text, #f2c6de));
      }
      @media (prefers-reduced-motion: reduce) {
        #${ID},
        #${ID} .yuri-shark {
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
    if (!isYuriDay(now) || document.getElementById(ID)) return;
    installStyle();

    const strip = document.createElement('div');
    strip.id = ID;
    strip.setAttribute('role', 'button');
    strip.tabIndex = 0;
    strip.title = 'You know you can click on em? No? then Hi!';
    strip.setAttribute('aria-label', 'You know you can click on em? No? then Hi!');

    const pair = document.createElement('div');
    pair.className = 'yuri-pair';
    const left = new Image();
    left.src = BASE + 'blahaj.png';
    left.alt = 'blåhaj';
    left.className = 'yuri-shark yuri-left';
    const right = new Image();
    right.src = BASE + 'blahaj.png';
    right.alt = 'blåhaj';
    right.className = 'yuri-shark yuri-right';
    pair.append(left, right);

    const flag = document.createElement('div');
    flag.className = 'yuri-flag';
    flag.setAttribute('role', 'img');
    flag.setAttribute('aria-label', 'sapphic pride flag: orange, white and pink stripes');
    for (const color of ['#e0823f', '#ffffff', '#d06f9e']) {
      const stripe = document.createElement('span');
      stripe.style.background = color;
      flag.append(stripe);
    }

    const label = document.createElement('span');
    label.className = 'yuri-text';
    label.textContent = 'Happy Yuri Day!';

    strip.append(pair, flag, label);

    const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spawnHeart = () => {
      const heart = document.createElement('span');
      heart.className = 'yuri-heart';
      heart.textContent = '♥';
      heart.setAttribute('aria-hidden', 'true');
      pair.append(heart);
      const drift = (Math.random() * 12 - 6).toFixed(1);
      const frames = reduced()
        ? [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }]
        : [
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.6) rotate(0deg)' },
            { opacity: 1, transform: `translate(calc(-50% + ${drift}px), calc(-50% - 12px)) scale(1) rotate(-6deg)`, offset: 0.3 },
            { opacity: 1, transform: `translate(calc(-50% + ${drift}px), calc(-50% - 28px)) scale(1.05) rotate(6deg)`, offset: 0.7 },
            { opacity: 0, transform: `translate(calc(-50% + ${drift}px), calc(-50% - 44px)) scale(0.9) rotate(0deg)` },
          ];
      const animation = heart.animate(frames, { duration: reduced() ? 500 : 900, easing: 'ease-out' });
      animation.onfinish = () => heart.remove();
      animation.oncancel = () => heart.remove();
    };
    const boop = () => {
      spawnHeart();
      if (reduced()) return;
      left.animate(
        [
          { transform: 'scaleX(-1) translateX(0)' },
          { transform: 'scaleX(-1) translateX(-10px) rotate(-4deg)' },
          { transform: 'scaleX(-1) translateX(0)' },
        ],
        { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      );
      right.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-10px) rotate(4deg)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      );
    };

    strip.addEventListener('click', boop);
    strip.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        boop();
      }
    });

    const installBox = document.querySelector('.install-box');
    const search = document.querySelector('.search');
    if (installBox) installBox.insertAdjacentElement('afterend', strip);
    else if (search) search.insertAdjacentElement('afterend', strip);
    else (document.querySelector('.shell') || document.body).appendChild(strip);
  }

  init();
})();