// Messenger, Facebook, Instagram, LINE, TikTok... open links in their own
// built-in browser, and Google refuses to sign anyone in there (it shows a
// bare "400. That's an error" page). No website can lift that block, so the
// way through is to hand the page over to the phone's real browser.

const IN_APP_BROWSER = /FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\/|TikTok|; wv\)/i;

export function isInAppBrowser(): boolean {
  return (
    typeof navigator !== "undefined" && IN_APP_BROWSER.test(navigator.userAgent)
  );
}

// Reopens `path` of this same site in the phone's real browser: Chrome on
// Android (intent:// link), Safari on iOS 17+ (x-safari- link). Resolves true
// once this page goes to the background, i.e. the other browser took over,
// and false if nothing happened - e.g. an older iPhone, or an app that
// ignores such links - so the caller can explain how to do it by hand.
export function openInRealBrowser(path: string): Promise<boolean> {
  const url = new URL(path, window.location.origin);
  const ua = navigator.userAgent;
  let target: string;
  if (/Android/i.test(ua)) {
    const scheme = url.protocol.replace(":", "");
    target = `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${scheme};package=com.android.chrome;end`;
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    target = `x-safari-${url.href}`;
  } else {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (handedOff: boolean) => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      resolve(handedOff);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") finish(true);
    };
    const onPageHide = () => finish(true);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    timer = setTimeout(
      () => finish(document.visibilityState === "hidden"),
      2500,
    );
    window.location.href = target;
  });
}
