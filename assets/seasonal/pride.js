(function () {
  'use strict';

  const QUALITY = window.MEW_DOODLE_QUALITY || 'full';
  const LOW_END = QUALITY === 'low';
  const MID_END = QUALITY === 'normal';

  const ID = 'pride-ribbon';
  const STYLE_ID = 'pride-ribbon-style';
  const DEFAULT_LABEL = 'Happy Pride Month! (you silliers :3)';
  const FINAL_LABEL = 'Shall the pride be forever with you';

  const RAINBOW = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#24408e', '#732982'];
  const PROGRESS = [
    '#000000', '#7a3f00', '#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8',
    '#5bcefa', '#e40303', '#ff8c00', '#ffed00', '#008026', '#24408e',
  ];
  const TRANS = ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa'];

  const FLAGS = {
    pride: {
      label: 'Pride Month',
      alt: 'progress pride flag: trans stripes, brown and black stripes, and the rainbow',
      colors: PROGRESS,
    },
    families: {
      label: 'Families Day',
      alt: 'progress pride flag for LGBTQ families',
      colors: PROGRESS,
    },
    aro: {
      label: 'Aro Day',
      alt: 'aromantic pride flag: green, light green, white, grey and black stripes',
      colors: ['#3da542', '#7fb539', '#ffffff', '#a8a8a8', '#2b2b2b'],
    },
    rainbow: {
      label: 'Rainbow Flag Day',
      alt: 'six-color rainbow pride flag',
      colors: RAINBOW,
    },
    equality: {
      label: 'Equality Day',
      alt: 'rainbow pride flag for marriage equality',
      colors: RAINBOW,
    },
    gay: {
      label: 'Gay Pride',
      alt: 'rainbow pride flag for Gay Pride Day',
      colors: RAINBOW,
    },
    transVisibility: {
      label: 'Trans Visibility Day',
      alt: 'transgender pride flag: light blue, pink and white stripes',
      colors: TRANS,
    },
    transHistory: {
      label: 'Trans History Week',
      alt: 'transgender pride flag for trans history week',
      colors: TRANS,
    },
    transFlag: {
      label: 'Trans Flag Day',
      alt: 'transgender pride flag for Trans Flag Day',
      colors: TRANS,
    },
    transAwareness: {
      label: 'Trans Awareness Week',
      alt: 'transgender pride flag for trans awareness week',
      colors: TRANS,
    },
    transRemembrance: {
      label: 'Trans Day of Remembrance',
      alt: 'transgender pride flag for Trans Day of Remembrance',
      colors: TRANS,
      respectful: true,
    },
  };

  const DAY_FLAGS = {
    '03-31': 'transVisibility',
    '05-04': 'transHistory',
    '05-05': 'transHistory',
    '05-06': 'transHistory',
    '05-07': 'transHistory',
    '05-08': 'transHistory',
    '05-09': 'transHistory',
    '05-10': 'transHistory',
    '06-01': 'families',
    '06-05': 'aro',
    '06-25': 'rainbow',
    '06-26': 'equality',
    '06-28': 'gay',
    '08-19': 'transFlag',
    '11-13': 'transAwareness',
    '11-14': 'transAwareness',
    '11-15': 'transAwareness',
    '11-16': 'transAwareness',
    '11-17': 'transAwareness',
    '11-18': 'transAwareness',
    '11-19': 'transAwareness',
    '11-20': 'transRemembrance',
  };

  function monthDay(date) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function isFinalDate(date) {
    return date.getMonth() === 5 && date.getDate() === 30;
  }

  function labelFor(key) {
    const flag = FLAGS[key];
    return flag.respectful ? flag.label : `Happy ${flag.label}!`;
  }

  function uniqueFlagKeys() {
    const seen = new Set();
    return Object.keys(FLAGS).filter((key) => {
      const signature = FLAGS[key].colors.join('|');
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }

  function resolveMode() {
    const date = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
    const forced = window.MEW_FORCE_DOODLE;

    if (forced === 'prideAll' || isFinalDate(date)) {
      return { all: true, key: 'pride', label: FINAL_LABEL, fixed: true };
    }
    if (forced && FLAGS[forced] && forced !== 'pride') {
      return { all: false, key: forced, label: labelFor(forced), fixed: true };
    }
    const key = DAY_FLAGS[monthDay(date)];
    if (key) {
      return { all: false, key, label: labelFor(key), fixed: true };
    }
    if (date.getMonth() === 5) {
      return { all: false, key: 'pride', label: DEFAULT_LABEL, fixed: false };
    }
    return null;
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
        gap: 0.6rem;
        width: 100%;
        margin-top: 0.85rem;
        pointer-events: auto;
        cursor: pointer;
      }
      #${ID} .pride-flags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
      }
      #${ID} .pride-flag {
        display: flex;
        flex: 0 0 auto;
        width: 132px;
        height: 16px;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
        transform: rotate(-1deg);
      }
      #${ID} .pride-flag:hover,
      #${ID} .pride-flag:focus-visible {
        transform: rotate(0deg) scale(1.04);
      }
      #${ID} .pride-stripe {
        flex: 1 1 0;
        height: 100%;
        ${LOW_END ? '' : `animation: pride-ribbon-wave 2.8s ease-in-out infinite alternate;
        animation-delay: calc(var(--i) * -0.16s);`}
        ${LOW_END || MID_END ? '' : 'will-change: transform;'}
      }
      #${ID} .pride-text {
        font-family: monospace;
        font-size: 0.95rem;
        font-weight: 400;
        letter-spacing: normal;
        white-space: nowrap;
        color: var(--date-color, var(--text, #f2c6de));
      }
      @keyframes pride-ribbon-wave {
        from {
          transform: translateY(0) scaleY(0.96);
        }
        to {
          transform: translateY(-2px) scaleY(1.08);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        #${ID},
        #${ID} .pride-flag,
        #${ID} .pride-stripe {
          animation: none !important;
          transition: none !important;
          transform: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function paintFlag(flag, key) {
    const flagData = FLAGS[key];
    flag.dataset.flag = key;
    flag.setAttribute('alt', flagData.alt);
    flag.setAttribute('aria-label', flagData.alt);
    flag.setAttribute('data-alt', flagData.alt);
    const colors = flagData.colors;
    Array.from(flag.children).forEach((stripe, index) => {
      stripe.style.background = colors[index % colors.length];
    });
  }

  function makeFlag(key) {
    const flag = document.createElement('div');
    flag.className = 'pride-flag';
    flag.setAttribute('role', 'img');
    for (let index = 0; index < 12; index += 1) {
      const stripe = document.createElement('span');
      stripe.className = 'pride-stripe';
      stripe.style.setProperty('--i', String(index));
      flag.append(stripe);
    }
    paintFlag(flag, key);
    return flag;
  }

  function spinOrder(origin, total) {
    if (origin < 0 || origin >= total) return Array.from({ length: total }, (_, index) => index);
    if (origin === 0) return Array.from({ length: total }, (_, index) => index);
    if (origin >= total - 1) return Array.from({ length: total }, (_, index) => total - 1 - index);
    const order = [origin];
    for (let offset = 1; order.length < total; offset += 1) {
      if (origin + offset < total) order.push(origin + offset);
      if (origin - offset >= 0) order.push(origin - offset);
    }
    return order;
  }

  function buildRibbon(mode) {
    const strip = document.createElement('div');
    strip.id = ID;
    strip.setAttribute('role', 'button');
    strip.tabIndex = 0;

    const wrap = document.createElement('div');
    wrap.className = 'pride-flags';
    const keys = mode.all ? uniqueFlagKeys() : [mode.key];
    const flags = keys.map(makeFlag);
    flags.forEach((flag) => wrap.append(flag));

    const text = document.createElement('span');
    text.className = 'pride-text';
    text.textContent = mode.label;

    strip.append(wrap, text);

    const buttonAlt = mode.all ? 'all pride flags' : FLAGS[mode.key].alt;
    strip.title = buttonAlt;
    strip.setAttribute('aria-label', buttonAlt);

    let currentKey = mode.key;
    let spins = [];
    const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clickedIndex = (target) => flags.findIndex((flag) => flag === target || flag.contains(target));
    const spin = (event) => {
      if (LOW_END || reduced()) return;
      let origin = -1;
      if (mode.all && event) {
        if (typeof event.clientX === 'number') {
          let bestDistance = Infinity;
          flags.forEach((flag, index) => {
            const rect = flag.getBoundingClientRect();
            const distance = Math.abs(rect.left + rect.width / 2 - event.clientX);
            if (distance < bestDistance) {
              bestDistance = distance;
              origin = index;
            }
          });
        } else if (event.target) {
          origin = clickedIndex(event.target);
        }
      }
      const order = mode.all ? spinOrder(origin, flags.length) : flags.map((_, index) => index);
      spins.forEach((animation) => animation.cancel());
      spins = order.map((flagIndex, step) => flags[flagIndex].animate(
        [
          { transform: 'rotate(-1deg) scale(1)' },
          { transform: 'rotate(179deg) scale(1.06)', offset: 0.5 },
          { transform: 'rotate(359deg) scale(1)' },
        ],
        {
          duration: 620,
          delay: mode.all ? step * 45 : 0,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        },
      ));
    };
    const cycle = () => {
      const allKeys = uniqueFlagKeys();
      currentKey = allKeys[(allKeys.indexOf(currentKey) + 1) % allKeys.length];
      paintFlag(flags[0], currentKey);
      const alt = FLAGS[currentKey].alt;
      strip.title = alt;
      strip.setAttribute('aria-label', alt);
      spin();
    };
    const activate = (event) => {
      if (mode.fixed || mode.all) spin(event);
      else cycle();
    };

    strip.addEventListener('click', activate);
    strip.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate(event);
      }
    });
    return strip;
  }

  function init() {
    const mode = resolveMode();
    if (!mode || document.getElementById(ID)) return;
    installStyle();
    const strip = buildRibbon(mode);
    const installBox = document.querySelector('.install-box');
    const search = document.querySelector('.search');
    if (installBox) installBox.insertAdjacentElement('afterend', strip);
    else if (search) search.insertAdjacentElement('afterend', strip);
    else (document.querySelector('.shell') || document.body).appendChild(strip);
  }

  init();
})();