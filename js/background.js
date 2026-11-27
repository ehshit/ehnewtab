const ext = globalThis.browser ?? globalThis.chrome;

ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const wantsBytes = message && message.type === 'mew-fetch-bytes';
  const wantsText = message && message.type === 'mew-fetch';
  if ((!wantsBytes && !wantsText) || typeof message.url !== 'string') {
    return undefined;
  }

  (async () => {
    try {
      const response = await fetch(message.url, {
        credentials: 'omit',
        cache: wantsBytes ? 'force-cache' : 'no-store',
        referrerPolicy: 'no-referrer',
        headers:
          message.headers && typeof message.headers === 'object' ? message.headers : {},
      });
      if (wantsBytes) {
        const buffer = await response.arrayBuffer();
        sendResponse({
          ok: response.ok,
          status: response.status,
          buffer,
          contentType: response.headers.get('content-type') || '',
        });
        return;
      }
      const text = await response.text();
      sendResponse({ ok: response.ok, status: response.status, text });
    } catch (error) {
      sendResponse({
        ok: false,
        status: 0,
        error: String((error && error.message) || error),
      });
    }
  })();

  return true;
});

if (typeof globalThis.browser !== 'undefined') {
  const NEW_TAB_URL = ext.runtime.getURL('newtab.html');
  const patched = new Set();

  const patchTab = async (tab) => {
    if (!tab || !tab.id || patched.has(tab.id)) return;
    const url = tab.pendingUrl || tab.url;
    if (url !== 'about:newtab') return;
    patched.add(tab.id);
    try {
      await ext.tabs.update(tab.id, { url: NEW_TAB_URL });
    } catch (_) {
      patched.delete(tab.id);
    }
  };

  const patchAll = async () => {
    try {
      const tabs = await ext.tabs.query({});
      for (const tab of tabs) await patchTab(tab);
    } catch (_) {}
  };

  ext.tabs.onCreated.addListener(patchTab);
  ext.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url === 'about:newtab' || changeInfo.status === 'complete') {
      patchTab(tab || { id: tabId, url: changeInfo.url });
    }
  });
  ext.runtime.onStartup.addListener(patchAll);
  ext.runtime.onInstalled.addListener(patchAll);
  patchAll();
}