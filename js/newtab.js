(() => {
  'use strict';

  const ext = globalThis.browser ?? globalThis.chrome;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const unlockAudio = () => {
    try {
      const silent = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=');
      silent.volume = 0;
      silent.play().catch(() => {});
    } catch {}
    try {
      const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (AudioCtx) new AudioCtx().resume().catch(() => {});
    } catch {}
    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };

  const isChrome = /Chrome\//.test(navigator.userAgent) &&
    !/Edg\//.test(navigator.userAgent) &&
    !/OPR\//.test(navigator.userAgent);

  const useBrowserSearch = globalThis.EH_BROWSER_SEARCH === true;

  if (isChrome) {
    document.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  }

  const BUILTIN_ENGINES = [
    { id: 'ddg', name: 'DuckDuckGo', short: 'ddg', url: 'https://duckduckgo.com/?q=%s' },
    { id: 'google', name: 'Google', short: 'google', url: 'https://www.google.com/search?q=%s' },
    { id: 'brave', name: 'Brave Search', short: 'brave', url: 'https://search.brave.com/search?q=%s' },
    { id: 'startpage', name: 'Startpage', short: 'startpage', url: 'https://www.startpage.com/sp/search?query=%s' },
    { id: 'bing', name: 'Bing', short: 'bing', url: 'https://www.bing.com/search?q=%s' },
    { id: 'mojeek', name: 'Mojeek', short: 'mojeek', url: 'https://www.mojeek.com/search?q=%s' },
    { id: 'wikipedia', name: 'Wikipedia', short: 'wiki', url: 'https://en.wikipedia.org/w/index.php?search=%s' },
  ];

  const DEFAULTS = {
    source: 'safebooru',
    subreddit: 'Animewallpaper',
    query: 'flair:"Desktop"',
    sort: 'top',
    time: 'year',
    nsfw: false,
    redditClientId: '',
    useRedlib: false,
    redlibUrl: '',
    safebooruTags: 'sort:score:desc',
    bgUrl: '',
    dim: 42,
    blur: 0,
    doodles: true,
    doodlePick: 'auto',
    doodleDate: '',
    engine: 'ddg',
    customEngines: [],
    clock24: true,
    theme: 'eh',
    searchPos: 'center',
    clockPos: 'non-center',
    heroPos: 'non-center',
    customCss: '',
  };

  const LIGHT_KEYS = [
    'source',
    'subreddit',
    'query',
    'sort',
    'time',
    'nsfw',
    'redditClientId',
    'useRedlib',
    'redlibUrl',
    'safebooruTags',
    'bgUrl',
    'dim',
    'blur',
    'doodles',
    'doodlePick',
    'doodleDate',
    'engine',
    'customEngines',
    'clock24',
    'theme',
    'searchPos',
    'clockPos',
    'heroPos',
    'customCss',
  ];

  const POOL_TTL = 6 * 60 * 60 * 1000;
  const TOKEN_MARGIN = 120 * 1000;

  let state = { ...DEFAULTS };
  let saveTimer = 0;
  let toastTimer = 0;
  let bgToken = 0;
  let settingsTab = 'look';

  const getEngines = () => [
    ...BUILTIN_ENGINES,
    ...(Array.isArray(state.customEngines) ? state.customEngines : []),
  ];

  const loadState = async () => {
    try {
      const stored = await ext.storage.local.get(null);
      return { ...DEFAULTS, ...stored };
    } catch {
      return { ...DEFAULTS };
    }
  };

  const saveSoon = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveLight, 450);
  };

  const saveLight = async () => {
    clearTimeout(saveTimer);
    const snapshot = {};
    for (const key of LIGHT_KEYS) snapshot[key] = state[key];
    try {
      await ext.storage.local.set(snapshot);
      flashSaved();
    } catch (error) {
      console.warn('[mew tab] save failed', error);
    }
  };

  const flashSaved = () => {
    const el = $('#saveState');
    if (!el) return;
    el.textContent = 'saved';
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  };

  const applyAppearance = () => {
    const root = document.documentElement;
    root.style.setProperty('--dim', String(Math.max(0, Math.min(100, Number(state.dim) || 0)) / 100));
    root.style.setProperty('--blur', `${Math.max(0, Math.min(30, Number(state.blur) || 0))}px`);
  };

  const applyCustomCss = () => {
    let el = document.getElementById('customStyle');
    if (!el) {
      el = document.createElement('style');
      el.id = 'customStyle';
      document.head.append(el);
    }
    el.textContent = state.theme === 'custom' ? state.customCss || '' : '';
  };

  const applyTheme = () => {
    const theme = ['eh', 'material2', 'custom'].includes(state.theme) ? state.theme : 'eh';
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.searchPos = state.searchPos === 'non-center' ? 'non-center' : 'center';
    document.documentElement.dataset.clockPos = state.clockPos === 'center' ? 'center' : 'non-center';
    document.documentElement.dataset.heroPos = state.heroPos === 'center' ? 'center' : 'non-center';
    applyCustomCss();
    const wrap = $('#customWrap');
    if (wrap) wrap.classList.toggle('show', theme === 'custom');
    const posWrap = $('#searchPosWrap');
    if (posWrap) posWrap.hidden = false;
    const heroWrap = $('#heroPosWrap');
    if (heroWrap) heroWrap.hidden = !['material2', 'custom'].includes(theme);
    $$('.seg[data-theme-choice]').forEach((button) => {
      button.classList.toggle('active', button.dataset.themeChoice === theme);
    });
    $$('.seg[data-search-pos]').forEach((button) => {
      button.classList.toggle('active', button.dataset.searchPos === state.searchPos);
    });
    $$('.seg[data-clock-pos]').forEach((button) => {
      button.classList.toggle('active', button.dataset.clockPos === state.clockPos);
    });
    $$('.seg[data-hero-pos]').forEach((button) => {
      button.classList.toggle('active', button.dataset.heroPos === state.heroPos);
    });
  };

  const renderClockTick = () => {
    const now = new Date();
    const clock = $('#clock');
    const parts = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !state.clock24,
    }).formatToParts(now);
    clock.textContent = '';
    for (const part of parts) {
      const span = document.createElement('span');
      span.className = part.type === 'dayPeriod' ? 'ampm' : part.type === 'literal' ? 'colon' : part.type;
      span.textContent = part.value;
      clock.append(span);
    }
    $('#date').textContent = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const startSeasonalDoodles = () => {
    if (!state.doodles || !window.MEW_SEASONAL) return;
    const pick = window.MEW_SEASONAL.SEASONAL[state.doodlePick] ? state.doodlePick : 'auto';
    const dates = window.MEW_SEASONAL.SEASONAL[pick]?.dates || [];
    const dateValue = dates.some((date) => date.value === state.doodleDate) ? state.doodleDate : '';
    window.MEW_SEASONAL.start(pick, dateValue);
  };

  const lockEngineUi = () => {
    const pill = $('#engine');
    const setting = $('#engineSetting');
    if (pill) {
      pill.textContent = '';
      pill.append(new Option('browser', 'browser'));
      pill.value = 'browser';
      pill.disabled = true;
      pill.title = 'managed by your browser settings';
    }
    if (setting) {
      setting.textContent = '';
      setting.append(new Option("your browser's default", 'browser'));
      setting.value = 'browser';
      setting.disabled = true;
    }
    for (const selector of ['#engineName', '#engineShort', '#engineUrl', '#addEngine']) {
      const el = $(selector);
      if (el) el.disabled = true;
    }
    $$('#tab-engine > section').forEach((section) => {
      section.hidden = section.id !== 'engineLocked';
    });
    const locked = $('#engineLocked');
    if (locked) locked.hidden = false;
    const tab = $('.settings-tab[data-settings-tab="engine"]');
    if (tab) tab.classList.add('locked');
    const display = $('#engineDisplay');
    if (display) {
      display.textContent = '';
      const br1 = document.createElement('span');
      br1.className = 'br';
      br1.textContent = '[';
      const short = document.createElement('span');
      short.className = 'short';
      short.textContent = 'browser';
      const br2 = document.createElement('span');
      br2.className = 'br';
      br2.textContent = ']';
      display.append(br1, short, br2);
    }
    const input = $('#q');
    if (input) input.placeholder = 'Search with your default engine';
  };

  const fillEngineSelects = () => {
    if (useBrowserSearch) {
      lockEngineUi();
      return;
    }
    const pill = $('#engine');
    const setting = $('#engineSetting');
    const engines = getEngines();
    pill.textContent = '';
    setting.textContent = '';
    for (const engine of engines) {
      pill.append(new Option(engine.short, engine.id));
      setting.append(new Option(engine.name, engine.id));
    }
    if (!engines.some((engine) => engine.id === state.engine)) {
      state.engine = engines[0] ? engines[0].id : 'ddg';
    }
    pill.value = state.engine;
    setting.value = state.engine;
    updateEngineDisplay();
  };

  const updateEngineDisplay = () => {
    const display = $('#engineDisplay');
    if (!display) return;
    const engines = getEngines();
    const engine = engines.find((item) => item.id === state.engine) || engines[0];
    display.textContent = '';
    const br1 = document.createElement('span');
    br1.className = 'br';
    br1.textContent = '[';
    const short = document.createElement('span');
    short.className = 'short';
    short.textContent = engine ? engine.short : 'ddg';
    const br2 = document.createElement('span');
    br2.className = 'br';
    br2.textContent = ']';
    display.append(br1, short, br2);
    const input = $('#q');
    if (input) input.placeholder = engine ? `Search with ${engine.name}` : 'search the meowverse';
  };

  const renderEngineList = () => {
    if (useBrowserSearch) return;
    const list = $('#engineList');
    if (!list) return;
    list.textContent = '';
    const custom = Array.isArray(state.customEngines) ? state.customEngines : [];
    if (!custom.length) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'no custom engines yet.';
      list.append(empty);
      return;
    }
    for (const engine of custom) {
      const row = document.createElement('div');
      row.className = 'engine-item';
      const meta = document.createElement('div');
      meta.className = 'engine-meta';
      const name = document.createElement('span');
      name.className = 'engine-name';
      name.textContent = `${engine.name} [${engine.short}]`;
      const url = document.createElement('span');
      url.className = 'engine-url';
      url.textContent = engine.url;
      meta.append(name, url);
      const del = document.createElement('button');
      del.className = 'engine-del';
      del.type = 'button';
      del.textContent = 'remove';
      del.addEventListener('click', () => {
        state.customEngines = (state.customEngines || []).filter((item) => item.id !== engine.id);
        if (state.engine === engine.id) state.engine = 'ddg';
        saveLight();
        fillEngineSelects();
        renderEngineList();
      });
      row.append(meta, del);
      list.append(row);
    }
  };

  const addCustomEngine = () => {
    const name = $('#engineName').value.trim();
    const short = $('#engineShort').value.trim();
    const url = $('#engineUrl').value.trim();
    if (!name || !short || !url) {
      toast('name, short, and url are all needed');
      return;
    }
    if (!url.includes('%s')) {
      toast('the url needs %s where the search goes');
      return;
    }
    let parsed;
    try {
      parsed = new URL(url.replace('%s', 'test'));
    } catch {
      toast('that url is not valid');
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      toast('only http and https urls');
      return;
    }
    const engine = {
      id: `custom-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      name,
      short: short.slice(0, 12),
      url,
    };
    state.customEngines = [...(state.customEngines || []), engine];
    state.engine = engine.id;
    $('#engineName').value = '';
    $('#engineShort').value = '';
    $('#engineUrl').value = '';
    saveLight();
    fillEngineSelects();
    renderEngineList();
    toast('engine added');
  };

  const setupSearch = () => {
    fillEngineSelects();
    renderEngineList();
    const pill = $('#engine');
    const setting = $('#engineSetting');

    pill.addEventListener('change', () => {
      state.engine = pill.value;
      setting.value = state.engine;
      updateEngineDisplay();
      saveLight();
    });

    setting.addEventListener('change', () => {
      state.engine = setting.value;
      pill.value = state.engine;
      updateEngineDisplay();
      saveLight();
    });

    $('#addEngine').addEventListener('click', addCustomEngine);

    $('#searchForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const raw = $('#q').value.trim();
      if (!raw) {
        $('#q').focus();
        return;
      }
      if (/^https?:\/\//i.test(raw)) {
        location.href = raw;
        return;
      }
      if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(raw)) {
        location.href = `https://${raw}`;
        return;
      }
      if (useBrowserSearch) {
        if (ext.search?.query) {
          ext.search.query({ text: raw, disposition: 'CURRENT_TAB' });
        } else {
          toast('browser search is not available');
        }
        return;
      }
      const engines = getEngines();
      const engine = engines.find((item) => item.id === state.engine) || engines[0];
      if (engine) location.href = engine.url.replace('%s', encodeURIComponent(raw));
    });
  };

  const showSettingsTab = (tab) => {
    settingsTab = ['look', 'engine', 'doodles'].includes(tab) ? tab : 'look';
    $$('.settings-tab').forEach((button) => {
      const active = button.dataset.settingsTab === settingsTab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $$('.settings-pane').forEach((pane) => {
      pane.classList.toggle('show', pane.id === `tab-${settingsTab}`);
    });
  };

  const populateDoodlePick = () => {
    const select = $('#doodlePick');
    if (!select || !window.MEW_SEASONAL) return;
    select.textContent = '';
    select.append(new Option('Auto (by date)', 'auto'));
    for (const [id, doodle] of Object.entries(window.MEW_SEASONAL.SEASONAL)) {
      select.append(new Option(doodle.name, id));
    }
    select.value = state.doodlePick || 'auto';
    if (!select.value) {
      select.value = 'auto';
      state.doodlePick = 'auto';
    }
  };

  const populateDoodleDates = () => {
    const wrap = $('#doodleDateWrap');
    const select = $('#doodleDate');
    if (!wrap || !select || !window.MEW_SEASONAL) return;
    const dates = window.MEW_SEASONAL.SEASONAL[state.doodlePick]?.dates || [];
    select.textContent = '';
    wrap.hidden = dates.length === 0;
    if (!dates.length) {
      state.doodleDate = '';
      return;
    }
    for (const date of dates) select.append(new Option(date.label, date.value));
    const current = dates.some((date) => date.value === state.doodleDate) ? state.doodleDate : dates[0].value;
    select.value = current;
    state.doodleDate = current;
  };

  const normalizeRedlibUrl = (value) => {
    try {
      const url = new URL(String(value || '').trim());
      if (!['http:', 'https:'].includes(url.protocol)) return '';
      return url.origin;
    } catch {
      return '';
    }
  };

  const requestRedlibAccess = async () => {
    const base = normalizeRedlibUrl(state.redlibUrl);
    if (!base) {
      toast('add a redlib instance url first');
      return false;
    }
    const origins = [`${base}/*`];
    if (!ext.permissions) return true;
    try {
      if (ext.permissions.contains && await ext.permissions.contains({ origins })) return true;
    } catch {}
    if (!ext.permissions.request) return true;
    try {
      return await ext.permissions.request({ origins });
    } catch {
      return false;
    }
  };

  const requestSafebooruAccess = async () => {
    const origins = ['https://safebooru.org/*'];
    if (!ext.permissions) return true;
    try {
      if (ext.permissions.contains && await ext.permissions.contains({ origins })) return true;
    } catch {}
    if (!ext.permissions.request) return true;
    try {
      return await ext.permissions.request({ origins });
    } catch {
      return false;
    }
  };

  const setupSettings = () => {
    $('#openSettings').addEventListener('click', openSettings);
    $('#closeSettings').addEventListener('click', closeSettings);
    $('#overlay').addEventListener('click', () => {
      closeSettings();
    });

    $$('.seg[data-src]').forEach((button) => {
      button.addEventListener('click', async () => {
        state.source = button.dataset.src;
        syncUI();
        saveLight();
        if (state.source === 'safebooru') {
          const allowed = await requestSafebooruAccess();
          if (!allowed) toast('safebooru access was not allowed');
        }
        resolveBackground({ silent: true });
      });
    });

    $$('.settings-tab').forEach((button) => {
      button.addEventListener('click', () => showSettingsTab(button.dataset.settingsTab));
    });

    $$('.seg[data-theme-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        state.theme = button.dataset.themeChoice;
        applyTheme();
        syncUI();
        saveLight();
      });
    });

    $$('.seg[data-search-pos]').forEach((button) => {
      button.addEventListener('click', () => {
        state.searchPos = button.dataset.searchPos === 'non-center' ? 'non-center' : 'center';
        applyTheme();
        saveLight();
      });
    });

    $$('.seg[data-clock-pos]').forEach((button) => {
      button.addEventListener('click', () => {
        state.clockPos = button.dataset.clockPos === 'center' ? 'center' : 'non-center';
        applyTheme();
        saveLight();
      });
    });

    $$('.seg[data-hero-pos]').forEach((button) => {
      button.addEventListener('click', () => {
        state.heroPos = button.dataset.heroPos === 'center' ? 'center' : 'non-center';
        applyTheme();
        saveLight();
      });
    });

    $('#customCss').addEventListener('input', (event) => {
      state.customCss = event.target.value;
      applyCustomCss();
      saveSoon();
    });

    bindText('#subreddit', 'subreddit', true);
    bindText('#query', 'query', true);
    bindText('#bgUrl', 'bgUrl', true);
    bindText('#redditClientId', 'redditClientId', true);
    bindText('#safebooruTags', 'safebooruTags', true);

    bindChange('#sort', 'sort', () => resolveBackground({ silent: true }));
    bindChange('#time', 'time', () => resolveBackground({ silent: true }));

    $('#nsfw').addEventListener('change', (event) => {
      state.nsfw = event.target.checked;
      saveSoon();
      resolveBackground({ silent: true });
    });

    $('#useRedlib').addEventListener('change', async (event) => {
      const wantsRedlib = event.target.checked;
      if (wantsRedlib) {
        const allowed = await requestRedlibAccess();
        if (!allowed) {
          state.useRedlib = false;
          syncUI();
          saveLight();
          toast('redlib instance access was not allowed');
          return;
        }
      }
      state.useRedlib = wantsRedlib;
      syncUI();
      saveLight();
      if (!wantsRedlib) installUserAgentRule('');
      resolveBackground({ silent: true });
    });

    $('#redlibUrl').addEventListener('change', async (event) => {
      state.redlibUrl = event.target.value.trim();
      saveLight();
      if (!state.useRedlib) return;
      const allowed = await requestRedlibAccess();
      if (!allowed) {
        state.useRedlib = false;
        syncUI();
        saveLight();
        toast('redlib instance access was not allowed');
        return;
      }
      installUserAgentRule(normalizeRedlibUrl(state.redlibUrl));
      resolveBackground({ silent: true });
    });

    $('#doodlesOn').addEventListener('change', (event) => {
      state.doodles = event.target.checked;
      saveLight().then(() => location.reload());
    });

    $('#doodlePick').addEventListener('change', (event) => {
      state.doodlePick = event.target.value;
      state.doodles = true;
      state.doodleDate = window.MEW_SEASONAL?.SEASONAL[state.doodlePick]?.dates?.[0]?.value || '';
      saveLight().then(() => location.reload());
    });

    const doodleDate = $('#doodleDate');
    if (doodleDate) {
      doodleDate.addEventListener('change', (event) => {
        state.doodleDate = event.target.value;
        state.doodles = true;
        saveLight().then(() => location.reload());
      });
    }

    $('#clock24').addEventListener('change', (event) => {
      state.clock24 = event.target.checked;
      saveSoon();
      renderClockTick();
    });

    $('#dim').addEventListener('input', (event) => {
      state.dim = Number(event.target.value);
      $('#dimVal').textContent = `${state.dim}%`;
      applyAppearance();
      saveSoon();
    });

    $('#blur').addEventListener('input', (event) => {
      state.blur = Number(event.target.value);
      $('#blurVal').textContent = `${state.blur}px`;
      applyAppearance();
      saveSoon();
    });

    $('#bgUpload').addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) await handleUpload(file);
      event.target.value = '';
    });

    $('#removeUpload').addEventListener('click', removeUpload);
    $('#tryFetch').addEventListener('click', tryFetch);
    $('#exportSettings').addEventListener('click', exportSettings);
    $('#importSettings').addEventListener('click', () => $('#importSettingsFile').click());
    $('#importSettingsFile').addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      importSettings(file);
    });
    const fetchWallpapers = $('#fetchWallpapers');
    fetchWallpapers.addEventListener('click', async () => {
      fetchWallpapers.classList.add('spin');
      try {
        await tryFetch();
      } finally {
        fetchWallpapers.classList.remove('spin');
      }
    });
  };

  const bindText = (selector, key, refetch) => {
    const el = $(selector);
    el.addEventListener('input', () => {
      state[key] = el.value;
      saveSoon();
    });
    if (refetch) {
      el.addEventListener('change', () => {
        state[key] = el.value;
        resolveBackground({ silent: true });
      });
    }
  };

  const bindChange = (selector, key, after) => {
    const el = $(selector);
    el.addEventListener('change', () => {
      state[key] = el.value;
      saveSoon();
      if (after) after();
    });
  };

  const syncUI = () => {
    $$('.seg[data-src]').forEach((button) => {
      button.classList.toggle('active', button.dataset.src === state.source);
    });
    $$('.seg[data-theme-choice]').forEach((button) => {
      button.classList.toggle('active', button.dataset.themeChoice === state.theme);
    });
    $$('.seg[data-search-pos]').forEach((button) => {
      button.classList.toggle('active', button.dataset.searchPos === state.searchPos);
    });
    $$('.seg[data-clock-pos]').forEach((button) => {
      button.classList.toggle('active', button.dataset.clockPos === state.clockPos);
    });
    $$('.seg[data-hero-pos]').forEach((button) => {
      button.classList.toggle('active', button.dataset.heroPos === state.heroPos);
    });
    $$('.panel-treatment').forEach((panel) => {
      panel.classList.toggle('show', panel.id === `panel-${state.source}`);
    });
    $('#customWrap').classList.toggle('show', state.theme === 'custom');
    $('#searchPosWrap').hidden = false;
    $('#heroPosWrap').hidden = !['material2', 'custom'].includes(state.theme);
    $('#fetchRow').hidden = !['reddit', 'safebooru'].includes(state.source);
    $('#fetchWallpapers').hidden = !['reddit', 'safebooru'].includes(state.source);
    $('#redlibFields').hidden = !state.useRedlib;
    $('#customCss').value = state.customCss || '';
    $('#subreddit').value = state.subreddit;
    $('#query').value = state.query;
    $('#sort').value = state.sort;
    $('#time').value = state.time;
    $('#nsfw').checked = Boolean(state.nsfw);
    $('#redditClientId').value = state.redditClientId || '';
    $('#useRedlib').checked = Boolean(state.useRedlib);
    $('#redlibUrl').value = state.redlibUrl || '';
    $('#safebooruTags').value = state.safebooruTags || '';
    $('#bgUrl').value = state.bgUrl || '';
    $('#dim').value = state.dim;
    $('#blur').value = state.blur;
    $('#dimVal').textContent = `${state.dim}%`;
    $('#blurVal').textContent = `${state.blur}px`;
    $('#doodlesOn').checked = Boolean(state.doodles);
    $('#doodlePick').value = state.doodlePick || 'auto';
    if ($('#doodleDate')) $('#doodleDate').value = state.doodleDate || '';
    if (!useBrowserSearch) {
      $('#engineSetting').value = state.engine;
      $('#engine').value = state.engine;
    }
    $('#clock24').checked = Boolean(state.clock24);
    $('#uploadInfo').textContent = state.uploadedName ? `using: ${state.uploadedName}` : 'no file yet';
  };

  const openSettings = () => {
    $('#settings').classList.add('open');
    $('#settings').setAttribute('aria-hidden', 'false');
    showOverlay();
    showSettingsTab(settingsTab);
    updatePoolInfo();
  };

  const closeSettings = () => {
    $('#settings').classList.remove('open');
    $('#settings').setAttribute('aria-hidden', 'true');
    hideOverlay();
  };

  const showOverlay = () => {
    const overlay = $('#overlay');
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
  };

  const hideOverlay = () => {
    const overlay = $('#overlay');
    overlay.classList.remove('show');
    setTimeout(() => {
      if (!overlay.classList.contains('show')) overlay.hidden = true;
    }, 260);
  };

  const toast = (message) => {
    const el = $('#toast');
    el.textContent = message;
    el.hidden = false;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => {
        el.hidden = true;
      }, 300);
    }, 3200);
  };

  const setupShuffle = () => {
    const button = $('#shuffle');
    button.addEventListener('click', async () => {
      button.classList.add('spin');
      setTimeout(() => button.classList.remove('spin'), 600);
      if (!['reddit', 'safebooru'].includes(state.source)) {
        toast("sorri that's for wallpaper services :(");
        return;
      }
      await resolveBackground({ silent: false });
    });
  };

  const setupShortcuts = () => {
    document.addEventListener('keydown', (event) => {
      const tag = document.activeElement && document.activeElement.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (event.key === 'Escape') {
        closeSettings();
        if (typing && document.activeElement) document.activeElement.blur();
        return;
      }
      if (event.key === '/' && !typing) {
        event.preventDefault();
        $('#q').focus();
      }
    });
  };

  const isHttpUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const isImageUrl = (value) => {
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      return /\.(jpe?g|png|webp|avif|gif)$/i.test(url.pathname);
    } catch {
      return false;
    }
  };

  const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0 via EhNewTab (me@ehis.gay)';
  const UA_RULE_IDS = [4711, 4712, 4713, 4714];

  const installUserAgentRule = async (origin) => {
    const dnr = ext.declarativeNetRequest;
    if (!dnr || !dnr.updateDynamicRules) return false;
    let host = '';
    try {
      host = new URL(origin).host;
    } catch {
      host = '';
    }
    const condition = { urlFilter: `||${host}^`, resourceTypes: ['xmlhttprequest', 'other'] };
    const addRules = host
      ? [
          {
            id: UA_RULE_IDS[0],
            priority: 1,
            action: {
              type: 'modifyHeaders',
              requestHeaders: [{ header: 'user-agent', operation: 'set', value: USER_AGENT }],
            },
            condition,
          },
          ...['sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform'].map((header, index) => ({
            id: UA_RULE_IDS[index + 1],
            priority: 1,
            action: { type: 'modifyHeaders', requestHeaders: [{ header, operation: 'remove' }] },
            condition,
          })),
        ]
      : [];
    try {
      await dnr.updateDynamicRules({ removeRuleIds: UA_RULE_IDS, addRules });
      return true;
    } catch (error) {
      console.warn('[mew tab] could not set user-agent rule', error);
      return false;
    }
  };

  const fetchTextViaBackground = async (url, accept = 'application/json') => {
    try {
      const result = await ext.runtime.sendMessage({
        type: 'mew-fetch',
        url,
        headers: { Accept: accept },
      });
      if (result && result.ok && typeof result.text === 'string') return result.text;
      if (result && result.error) throw new Error(result.error);
      if (result && !result.ok) throw new Error(`http ${result.status}`);
    } catch (error) {
      console.warn('[mew tab] background fetch failed', error);
    }

    const response = await fetch(url, {
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { Accept: accept },
    });
    if (!response.ok) throw new Error(`http ${response.status}`);
    return response.text();
  };

  const renderAttr = (item) => {
    const attr = $('#attr');
    attr.hidden = false;
    attr.textContent = '';
    if (!item) return;
    const fragment = document.createDocumentFragment();
    const dot = document.createElement('span');
    dot.textContent = ' · ';

    if (item.site === 'safebooru') {
      fragment.append('art by ');
      const author = document.createElement('a');
      author.href = item.postUrl || 'https://safebooru.org/';
      author.textContent = item.author || 'unknown';
      author.target = '_blank';
      author.rel = 'noreferrer';
      const site = document.createElement('a');
      site.href = 'https://safebooru.org/';
      site.textContent = 'safebooru';
      site.target = '_blank';
      site.rel = 'noreferrer';
      fragment.append(author, dot, site);
    } else {
      fragment.append('photo by ');
      const author = document.createElement('a');
      author.href = item.author
        ? `https://www.reddit.com/user/${encodeURIComponent(item.author)}/`
        : 'https://www.reddit.com/';
      author.textContent = item.author ? `u/${item.author}` : 'unknown';
      author.target = '_blank';
      author.rel = 'noreferrer';
      const post = document.createElement('a');
      post.href = item.postUrl || item.permalink || 'https://www.reddit.com/';
      post.textContent = item.subreddit ? `r/${item.subreddit}` : 'reddit';
      post.target = '_blank';
      post.rel = 'noreferrer';
      fragment.append(author, dot, post);
    }

    if (item.redlibError) {
      const note = document.createElement('span');
      note.textContent = ` · redlib failed: ${item.redlibError}`;
      fragment.append(note);
    }

    attr.append(fragment);
  };

  const paintBackground = (src, item, fullSrc) => {
    const token = ++bgToken;
    const bg = $('#bg');
    const paint = (url) => {
      document.body.classList.remove('fallback');
      bg.style.backgroundImage = `url("${String(url).replace(/"/g, '%22')}")`;
      bg.classList.add('show');
      if (item) renderAttr(item);
      else $('#attr').hidden = true;
    };
    const paintDecoded = async (image, url) => {
      try {
        await image.decode();
      } catch {}
      if (token !== bgToken) return false;
      paint(url);
      return true;
    };
    const upgrade = () => {
      if (!fullSrc || fullSrc === src) return;
      const full = new Image();
      full.decoding = 'async';
      full.onload = () => {
        paintDecoded(full, fullSrc);
      };
      full.src = fullSrc;
    };
    const img = new Image();
    img.decoding = 'async';
    img.onload = async () => {
      if (await paintDecoded(img, src)) upgrade();
    };
    img.onerror = () => {
      if (token !== bgToken) return;
      if (fullSrc && fullSrc !== src) {
        const full = new Image();
        full.decoding = 'async';
        full.onload = () => {
          paintDecoded(full, fullSrc);
        };
        full.onerror = () => {
          if (token !== bgToken) return;
          bg.classList.remove('show');
          document.body.classList.add('fallback');
          const attr = $('#attr');
          attr.hidden = false;
          attr.textContent = 'that one would not load :c';
        };
        full.src = fullSrc;
        return;
      }
      bg.classList.remove('show');
      document.body.classList.add('fallback');
      const attr = $('#attr');
      attr.hidden = false;
      attr.textContent = 'that one would not load :c';
    };
    img.src = src;
  };

  const fallbackBackground = (message) => {
    bgToken += 1;
    $('#bg').classList.remove('show');
    document.body.classList.add('fallback');
    const attr = $('#attr');
    attr.hidden = false;
    attr.textContent = message || '';
  };

  const poolSignature = () => {
    if (state.source === 'safebooru') {
      return `safebooru|${state.safebooruTags || ''}`;
    }
    if (state.source === 'reddit') {
      return [
        'reddit',
        state.subreddit,
        state.query,
        state.sort,
        state.time,
        state.nsfw ? 1 : 0,
        state.useRedlib ? 1 : 0,
        state.redlibUrl || '',
      ].join('|');
    }
    return state.source;
  };

  const getPool = async () => {
    try {
      const stored = await ext.storage.local.get('wallpaperPool');
      return stored.wallpaperPool || null;
    } catch {
      return null;
    }
  };

  const pickWallpaper = (items) => {
    if (!items.length) return null;
    let pond = items;
    if (items.length > 1 && state.lastBg) {
      const fresh = items.filter((item) => item.url !== state.lastBg);
      if (fresh.length) pond = fresh;
    }
    const pick = pond[Math.floor(Math.random() * pond.length)];
    state.lastBg = pick.url;
    ext.storage.local.set({ lastBg: pick.url }).catch(() => {});
    return pick;
  };

  const resolveBackground = async (options = {}) => {
    const { silent = false, forceFetch = false } = options;

    if (state.source === 'upload') {
      if (state.uploadedBg) paintBackground(state.uploadedBg, null);
      else fallbackBackground('no upload yet, add one in settings');
      return;
    }

    if (state.source === 'url') {
      if (isHttpUrl(state.bgUrl)) paintBackground(state.bgUrl, null);
      else fallbackBackground('add an image url in settings');
      return;
    }

    try {
      let pool = await getPool();
      const stale =
        !pool ||
        !Array.isArray(pool.items) ||
        pool.items.length === 0 ||
        pool.sig !== poolSignature() ||
        Date.now() - pool.fetchedAt > POOL_TTL;

      if (forceFetch || stale) {
        try {
          const fresh = await fetchPool();
          if (!fresh.items.length) throw new Error('no wallpapers found');
          pool = fresh;
          await ext.storage.local.set({ wallpaperPool: pool });
          updatePoolInfo();
        } catch (error) {
          if (!pool || !pool.items || !pool.items.length) throw error;
          if (!silent) toast(`could not refresh (${error.message}), showing the old stash`);
        }
      }

      const item = pickWallpaper(pool.items);
      if (!item) throw new Error('the pond is empty');
      if (pool.redlibError) item.redlibError = pool.redlibError;
      paintBackground(item.sampleUrl || item.url, item, item.sampleUrl ? item.url : '');
    } catch (error) {
      console.warn('[mew tab]', error);
      fallbackBackground(`could not fetch wallpapers${error && error.message ? ` (${error.message})` : ''}`);
      if (!silent) toast(`could not fetch wallpapers: ${error.message}`);
    }
  };

  const getDeviceId = async () => {
    try {
      const stored = await ext.storage.local.get('redditDeviceId');
      if (stored.redditDeviceId) return stored.redditDeviceId;
    } catch {}
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `mew-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      await ext.storage.local.set({ redditDeviceId: id });
    } catch {}
    return id;
  };

  const shortErrorBody = async (response) => {
    try {
      const text = await response.text();
      const cleaned = String(text)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z#0-9]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned.slice(0, 140);
    } catch {
      return '';
    }
  };

  const httpError = async (response, label) => {
    const detail = await shortErrorBody(response);
    return new Error(`${label} http ${response.status}${detail ? `: ${detail}` : ''}`);
  };

  const getRedditToken = async (clientId) => {
    const cached = await ext.storage.local.get('redditToken');
    const token = cached.redditToken;
    if (token && token.clientId === clientId && token.expiresAt > Date.now() + TOKEN_MARGIN) {
      return token.token;
    }
    const deviceId = await getDeviceId();
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'https://oauth.reddit.com/grants/installed_client',
        device_id: deviceId,
      }),
    });
    if (!response.ok) throw await httpError(response, 'reddit auth');
    const data = await response.json();
    if (!data.access_token) throw new Error('reddit auth failed');
    const expiresAt = Date.now() + Math.max(60, Number(data.expires_in) || 3600) * 1000 - TOKEN_MARGIN;
    await ext.storage.local.set({
      redditToken: { token: data.access_token, expiresAt, clientId },
    });
    return data.access_token;
  };

  const searchParams = (query) => {
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
      params.set('restrict_sr', 'true');
      params.set('sort', state.sort || 'top');
      params.set('t', state.time || 'year');
      params.set('limit', '100');
      params.set('raw_json', '1');
      if (!state.nsfw) params.set('include_over_18', 'off');
    } else {
      params.set('t', state.time || 'year');
      params.set('limit', '100');
      params.set('raw_json', '1');
    }
    return params;
  };

  const fetchWithOAuth = async (sub, query, clientId) => {
    const token = await getRedditToken(clientId);
    const params = searchParams(query);
    const path = query
      ? `/r/${encodeURIComponent(sub)}/search`
      : `/r/${encodeURIComponent(sub)}/top`;
    const response = await fetch(`https://oauth.reddit.com${path}?${params.toString()}`, {
      credentials: 'omit',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!response.ok) throw await httpError(response, 'reddit oauth');
    return response.json();
  };

  const fetchWithPublicJson = async (sub, query) => {
    const params = new URLSearchParams();
    let base;
    if (query) {
      params.set('q', query);
      params.set('sort', state.sort || 'top');
      params.set('t', state.time || 'year');
      params.set('show', 'all');
      params.set('restrict_sr', '1');
      params.set('include_over_18', state.nsfw ? 'on' : 'off');
      params.set('limit', '100');
      params.set('raw_json', '1');
      base = `https://www.reddit.com/r/${encodeURIComponent(sub)}/search.json?${params.toString()}`;
    } else {
      params.set('t', state.time || 'year');
      params.set('limit', '100');
      params.set('raw_json', '1');
      base = `https://www.reddit.com/r/${encodeURIComponent(sub)}/top.json?${params.toString()}`;
    }

    let lastError = null;
    for (const url of [base, base.replace('https://www.reddit.com', 'https://old.reddit.com')]) {
      try {
        const response = await fetch(url, {
          credentials: 'omit',
          cache: 'no-store',
          referrerPolicy: 'no-referrer',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw await httpError(response, `reddit ${new URL(url).host}`);
        return await response.json();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('reddit fetch failed');
  };

  const parseRedditChildren = (json, sub) => {
    const children = json && json.data && json.data.children;
    if (!Array.isArray(children)) throw new Error('unexpected reddit reply');

    const seen = new Set();
    const items = [];
    for (const child of children) {
      const data = child && child.data;
      if (!data || data.stickied) continue;
      if (data.over_18 && !state.nsfw) continue;
      let src = data.url_overridden_by_dest || data.url || '';
      if (!isImageUrl(src)) {
        const preview =
          data.preview &&
          data.preview.images &&
          data.preview.images[0] &&
          data.preview.images[0].source &&
          data.preview.images[0].source.url;
        if (preview) src = String(preview).replace(/&amp;/g, '&');
      }
      if (!isImageUrl(src) || seen.has(src)) continue;
      seen.add(src);
      items.push({
        id: String(data.id || ''),
        url: src,
        title: String(data.title || ''),
        author: String(data.author || ''),
        permalink: data.permalink ? `https://www.reddit.com${data.permalink}` : '',
        postUrl: data.permalink ? `https://www.reddit.com${data.permalink}` : '',
        subreddit: sub,
        site: 'reddit',
        created: Number(data.created_utc || 0),
      });
    }

    return { fetchedAt: Date.now(), sig: poolSignature(), service: 'reddit', items };
  };

  const fetchRedditPool = async () => {
    const sub =
      String(state.subreddit || 'Animewallpaper')
        .trim()
        .replace(/^\/?r\//i, '')
        .replace(/^\/+|\/+$/g, '') || 'Animewallpaper';
    const query = String(state.query || '').trim();
    const clientId = String(state.redditClientId || '').trim();

    let redlibError = '';
    if (state.useRedlib && normalizeRedlibUrl(state.redlibUrl)) {
      try {
        return await fetchRedlibPool(sub, query);
      } catch (error) {
        redlibError = error && error.message ? error.message : String(error);
        console.warn('[mew tab] redlib failed, falling back to reddit', error);
      }
    }

    try {
      let json = null;
      if (clientId) {
        try {
          json = await fetchWithOAuth(sub, query, clientId);
        } catch (error) {
          console.warn('[mew tab] oauth failed, falling back to public json', error);
        }
      }
      if (!json) json = await fetchWithPublicJson(sub, query);
      const pool = parseRedditChildren(json, sub);
      if (redlibError) pool.redlibError = redlibError;
      return pool;
    } catch (error) {
      if (redlibError) {
        throw new Error(`redlib failed (${redlibError}); reddit failed (${error.message})`);
      }
      throw error;
    }
  };

  const parseRedlibHtml = (html, base, sub) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const seen = new Set();
    const items = [];
    for (const post of doc.querySelectorAll('.post')) {
      const titleLink = post.querySelector('h2.post_title a[href*="/comments/"]');
      const mediaLink = post.querySelector('.post_media_content a.post_media_image');
      let src = mediaLink ? mediaLink.getAttribute('href') : '';
      if (!src) {
        const gallery = post.querySelector('.gallery figure a[href]');
        if (gallery) src = gallery.getAttribute('href');
      }
      if (!src) continue;
      let absolute;
      try {
        absolute = new URL(src, base).href;
      } catch {
        continue;
      }
      if (seen.has(absolute)) continue;
      const mediaBox = post.querySelector('.post_media_content svg[width]');
      const width = mediaBox ? Number.parseFloat(mediaBox.getAttribute('width')) : 0;
      const height = mediaBox ? Number.parseFloat(mediaBox.getAttribute('height')) : 0;
      if (width && height && width < 900 && height < 900) continue;
      seen.add(absolute);
      const authorEl = post.querySelector('.post_author');
      const permalink = titleLink ? titleLink.getAttribute('href') : '';
      let postUrl = '';
      try {
        postUrl = permalink ? new URL(permalink, base).href : '';
      } catch {
        postUrl = '';
      }
      items.push({
        id: String(post.id || ''),
        url: absolute,
        title: titleLink ? titleLink.textContent.trim() : '',
        author: authorEl ? authorEl.textContent.trim().replace(/^u\//, '') : '',
        permalink: postUrl,
        postUrl,
        subreddit: sub,
        site: 'redlib',
        created: 0,
      });
    }
    if (!items.length) throw new Error('redlib found no images');
    return { fetchedAt: Date.now(), sig: poolSignature(), service: 'redlib', items };
  };

  const fetchRedlibPool = async (sub, query) => {
    const base = normalizeRedlibUrl(state.redlibUrl);
    if (!base) throw new Error('redlib url missing');
    await installUserAgentRule(base);
    const params = new URLSearchParams();
    let path;
    if (query) {
      params.set('q', query);
      params.set('restrict_sr', 'on');
      params.set('sort', state.sort || 'top');
      params.set('t', state.time || 'year');
      path = `/r/${encodeURIComponent(sub)}/search`;
    } else {
      params.set('t', state.time || 'year');
      path = `/r/${encodeURIComponent(sub)}/top`;
    }
    const url = `${base}${path}?${params.toString()}`;
    let html;
    try {
      html = await fetchTextViaBackground(url, 'text/html');
    } catch (error) {
      throw new Error(`redlib ${error.message}`);
    }
    if (/anubis|making sure you.{0,10}re not a bot|are you a bot/i.test(html)) {
      throw new Error('redlib instance wants a bot check');
    }
    return parseRedlibHtml(html, base, sub);
  };

  const fetchSafebooruPool = async (forcePage = null) => {
    const tags = String(state.safebooruTags || '').trim();
    const pid = forcePage == null ? Math.floor(Math.random() * 8) : forcePage;
    const params = new URLSearchParams({
      page: 'dapi',
      s: 'post',
      q: 'index',
      json: '1',
      limit: '40',
      pid: String(pid),
    });
    if (tags) params.set('tags', tags);
    const url = `https://safebooru.org/index.php?${params.toString()}`;
    let text;
    try {
      text = await fetchTextViaBackground(url, 'application/json');
    } catch (error) {
      throw new Error(`safebooru ${error.message}`);
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch (error) {
      const end = text.lastIndexOf('}');
      if (end > 0) {
        try {
          json = JSON.parse(`${text.slice(0, end + 1)}]`);
        } catch {}
      }
      if (!json) throw error;
    }
    if (!Array.isArray(json)) throw new Error('unexpected safebooru reply');

    const seen = new Set();
    const all = [];
    for (const post of json) {
      if (!post) continue;
      if (post.rating && !['safe', 'general'].includes(post.rating)) continue;
      const src = post.file_url || post.sample_url || '';
      if (!src || !isHttpUrl(src) || seen.has(src)) continue;
      seen.add(src);
      const sample = post.sample_url && post.sample_url !== src ? post.sample_url : '';
      all.push({
        id: String(post.id || ''),
        url: src,
        sampleUrl: sample,
        title: '',
        author: String(post.owner || ''),
        permalink: '',
        postUrl: `https://safebooru.org/index.php?page=post&s=view&id=${encodeURIComponent(post.id || '')}`,
        subreddit: '',
        site: 'safebooru',
        width: Number(post.width || 0),
        height: Number(post.height || 0),
        created: Number(post.change || 0),
      });
    }
    const wide = all.filter((item) => item.width > item.height);
    const items = wide.length ? wide : all;
    if (!items.length && pid !== 0) return fetchSafebooruPool(0);
    if (!items.length) throw new Error('no safebooru images found');
    return { fetchedAt: Date.now(), sig: poolSignature(), service: 'safebooru', items };
  };

  const fetchPool = async () => {
    if (state.source === 'safebooru') return fetchSafebooruPool();
    return fetchRedditPool();
  };

  const updatePoolInfo = async () => {
    const el = $('#poolInfo');
    if (!el) return;
    try {
      const pool = await getPool();
      if (!pool || !pool.items || !pool.items.length) {
        el.textContent = 'pond is empty, fetch some';
        return;
      }
      const minutes = Math.round((Date.now() - pool.fetchedAt) / 60000);
      const age =
        minutes < 1 ? 'just now' : minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
      const redlibNote = pool.redlibError ? ` · redlib failed: ${pool.redlibError}` : '';
      el.textContent = `${pool.items.length} ${pool.service || 'reddit'} wallpapers · ${age}${redlibNote}`;
    } catch {
      el.textContent = '';
    }
  };

  const tryFetch = async () => {
    const active = $('.seg[data-src].active');
    if (active && active.dataset.src) state.source = active.dataset.src;
    const el = $('#poolInfo');
    if (state.source === 'safebooru') {
      const allowed = await requestSafebooruAccess();
      if (!allowed) {
        if (el) el.textContent = 'safebooru access was not allowed';
        return;
      }
    }
    if (el) el.textContent = 'fetching…';
    try {
      const fresh = await fetchPool();
      if (!fresh.items.length) throw new Error('nothing found');
      await ext.storage.local.set({ wallpaperPool: fresh });
      const redlibNote = fresh.redlibError ? ` (redlib failed: ${fresh.redlibError})` : '';
      if (el) el.textContent = `${fresh.items.length} ${fresh.service || 'reddit'} wallpapers${redlibNote}`;
      await resolveBackground({ silent: true });
      toast(fresh.redlibError ? `redlib failed (${fresh.redlibError}), used reddit` : `found ${fresh.items.length} wallpapers`);
    } catch (error) {
      console.warn('[mew tab]', error);
      if (el) el.textContent = `failed: ${error.message}`;
      toast(`fetch failed: ${error.message}`);
    }
  };

  const shrinkImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read failed'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('decode failed'));
        image.onload = () => {
          const maxSide = 2560;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  const handleUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      toast('that is not an image :c');
      return;
    }
    try {
      toast('squishing image…');
      const dataUrl = await shrinkImage(file);
      state.uploadedBg = dataUrl;
      state.uploadedName = file.name;
      state.source = 'upload';
      await ext.storage.local.set({ uploadedBg: dataUrl, uploadedName: file.name });
      await saveLight();
      syncUI();
      await resolveBackground({ silent: true });
      toast('uploaded');
    } catch (error) {
      console.warn('[mew tab]', error);
      toast('could not read that image :c');
    }
  };

  const removeUpload = async () => {
    state.uploadedBg = '';
    state.uploadedName = '';
    await ext.storage.local.set({ uploadedBg: '', uploadedName: '' });
    syncUI();
    if (state.source === 'upload') await resolveBackground({ silent: true });
    toast('removed the upload');
  };

  const exportSettings = () => {
    const data = { version: 1, exportedAt: new Date().toISOString() };
    for (const key of LIGHT_KEYS) data[key] = state[key];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eh-new-tab-settings-${new Date().toISOString().slice(0, 10)}.json`;
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('settings exported');
  };

  const importSettings = async (file) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('not a settings object');
      }
      for (const key of LIGHT_KEYS) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
        const value = data[key];
        if (Array.isArray(state[key])) {
          if (Array.isArray(value)) state[key] = value;
        } else if (typeof value === typeof state[key]) {
          state[key] = value;
        }
      }
      if (Array.isArray(state.customEngines)) {
        state.customEngines = state.customEngines.filter((engine) =>
          engine &&
          typeof engine === 'object' &&
          typeof engine.name === 'string' &&
          typeof engine.short === 'string' &&
          typeof engine.url === 'string'
        );
      }
      applyTheme();
      syncUI();
      await saveLight();
      toast('settings imported');
      setTimeout(() => location.reload(), 650);
    } catch (error) {
      console.warn('[mew tab] import failed', error);
      toast('that json is not valid :c');
    }
  };

  const boot = async () => {
    state = await loadState();
    if (state.useRedlib && normalizeRedlibUrl(state.redlibUrl)) {
      installUserAgentRule(normalizeRedlibUrl(state.redlibUrl));
    }
    applyAppearance();
    applyTheme();
    startSeasonalDoodles();
    setupSearch();
    setupSettings();
    setupShortcuts();
    setupShuffle();
    renderClockTick();
    setInterval(renderClockTick, 1000);
    populateDoodlePick();
    populateDoodleDates();
    showSettingsTab(settingsTab);
    syncUI();
    updatePoolInfo();
    document.body.classList.add('fallback');
    await resolveBackground({ silent: true });
  };

  boot();
})();