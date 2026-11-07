const ext = globalThis.browser ?? globalThis.chrome;

ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'mew-fetch' || typeof message.url !== 'string') {
    return undefined;
  }

  (async () => {
    try {
      const response = await fetch(message.url, {
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        headers:
          message.headers && typeof message.headers === 'object' ? message.headers : {},
      });
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