// Resolve ?returnTo= to a safe same-origin path, else the supplied fallback.
export function safeReturnTo(fallback = "/") {
  const safeFallback =
    typeof fallback === "string" && fallback.startsWith("/") && !fallback.startsWith("//")
      ? fallback
      : "/";

  const raw = new URLSearchParams(window.location.search).get("returnTo");
  if (!raw) return safeFallback;

  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return safeFallback;

    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
      return safeFallback;
    }

    // Never redirect an authenticated user straight back to an auth screen.
    if (["/login", "/register"].includes(url.pathname)) return safeFallback;

    return path;
  } catch {
    return safeFallback;
  }
}
