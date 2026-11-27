(function () {
  'use strict';

  const ID = 'thanksgiving-doodle';
  const STYLE_ID = 'thanksgiving-doodle-style';
  const GIF = '/assets/deltarune/explosionlong.gif';
  const SOUND = '/assets/deltarune/delexplosion.ogg';
  const BLAST_MS = 2000;

  function thanksgivingDay(year) {
    const first = new Date(year, 10, 1);
    const offset = (4 - first.getDay() + 7) % 7;
    return 1 + offset + 21;
  }

  function isThanksgiving(date) {
    return date.getMonth() === 10 && date.getDate() === thanksgivingDay(date.getFullYear());
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ID} {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        margin-top: 0.85rem;
      }
      #${ID} .tg-line {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      #${ID} .tg-text-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
      }
      #${ID} .tg-text {
        font-family: monospace;
        font-size: 0.95rem;
        white-space: nowrap;
        color: var(--date-color, var(--text, #f2c6de));
      }
      #${ID} .tg-country {
        appearance: none;
        border: 0;
        background: none;
        color: #9aa0a6;
        font-family: monospace;
        font-size: 0.78rem;
        line-height: 1;
        padding: 0;
        cursor: pointer;
      }
      #${ID} .tg-country:hover {
        color: #c7ccd1;
      }
      #${ID} .tg-country:focus-visible {
        outline: 2px solid #ffb86b;
        outline-offset: 2px;
      }
      #${ID} .tg-explosion {
        position: absolute;
        left: 50%;
        top: 50%;
        width: max(420px, calc(100% + 8rem));
        max-width: 90vw;
        height: 140px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 3;
        object-fit: fill;
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
    if (!isThanksgiving(now) || document.getElementById(ID)) return;
    installStyle();

    const strip = document.createElement('div');
    strip.id = ID;

    const line = document.createElement('div');
    line.className = 'tg-line';

    const textWrap = document.createElement('span');
    textWrap.className = 'tg-text-wrap';
    const text = document.createElement('span');
    text.className = 'tg-text';
    text.textContent = 'Happy Thanksgiving';
    textWrap.append(text);

    const country = document.createElement('button');
    country.type = 'button';
    country.className = 'tg-country';
    country.textContent = '(Not your country?)';
    country.setAttribute('aria-label', 'Not your country? Click to explode.');

    let active = false;
    country.addEventListener('click', () => {
      if (active) return;
      active = true;

      const gif = new Image();
      gif.src = `${GIF}?start=${Date.now()}`;
      gif.alt = '';
      gif.className = 'tg-explosion';
      gif.setAttribute('aria-hidden', 'true');
      line.append(gif);

      let audio = null;
      try {
        audio = new Audio(SOUND);
        audio.volume = 0.8;
        const playing = audio.play();
        if (playing && typeof playing.catch === 'function') playing.catch(() => {});
      } catch (_) {
        audio = null;
      }

      window.setTimeout(() => {
        if (audio) {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch (_) {}
        }
        gif.remove();
        text.remove();
        country.remove();
      }, BLAST_MS);
    });

    line.append(textWrap, country);
    strip.append(line);

    const installBox = document.querySelector('.install-box');
    const search = document.querySelector('.search');
    if (installBox) installBox.insertAdjacentElement('afterend', strip);
    else if (search) search.insertAdjacentElement('afterend', strip);
    else (document.querySelector('.shell') || document.body).appendChild(strip);
  }

  init();
})();