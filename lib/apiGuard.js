// Same-origin guard for the public API endpoints. The endpoints proxy a paid
// Anthropic key, so a bare POST from anywhere (curl, another site) should not
// be able to spend it. Browsers always send an Origin header on POST fetch
// (and usually Referer); we require one of them to match the host that served
// the request. Works unchanged across vercel dev, preview URLs, and custom
// domains because the browser's origin host always equals the Host header.
//
// Ops scripts (evals/*.mjs) must send an explicit Origin header matching the
// deployment host.
export function rejectForeignOrigin(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const source = req.headers.origin || req.headers.referer || "";
  let ok = false;
  if (host && source) {
    try {
      ok = new URL(source).host === host;
    } catch {
      ok = false;
    }
  }
  if (!ok) {
    res.status(403).json({ error: "Forbidden" });
    return true;
  }
  return false;
}
