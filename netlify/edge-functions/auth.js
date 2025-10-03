// netlify/edge-functions/auth.js
const COOKIE_NAME = "site_pass";
const COOKIE_VALUE = "ok";
const MAX_AGE = 60 * 60 * 24 ; // Access revoked after 1 days
const LOGIN_PATH = "/__auth";
const ENV_KEY = "sea_five"; //the password

function getEnv(name) {
  if (typeof Netlify !== "undefined" && Netlify.env?.get) return Netlify.env.get(name);
  if (typeof Deno !== "undefined" && Deno.env?.get) return Deno.env.get(name);
  return undefined;
}

function authed(req) {
  const c = req.headers.get("cookie") || "";
  return c.split(/;\s*/).some(s => s === `${COOKIE_NAME}=${COOKIE_VALUE}`);
}

function loginPage(msg = "") {
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Protected</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;min-height:100svh;display:grid;place-items:center;background:#0b0b0c;color:#e7e7ea}
    form{background:#141416;border:1px solid #2a2b2f;border-radius:14px;padding:28px;min-width:320px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
    h1{font-size:18px;margin:0 0 14px}
    input{width:100%;padding:10px;border-radius:10px;border:1px solid #2a2b2f;background:#0f0f11;color:#e7e7ea}
    button{margin-top:12px;width:100%;padding:10px;border:0;border-radius:10px;background:#5a67d8;color:white;font-weight:600;cursor:pointer}
    .msg{color:#ff7878;font-size:12px;height:16px;margin-top:8px}
  </style>
  <form method="POST" action="${LOGIN_PATH}">
    <h1>Enter password</h1>
    <input name="password" type="password" placeholder="Password" required />
    <div class="msg">${msg}</div>
    <button type="submit">Continue</button>
  </form>`;
  return new Response(html, {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}

export default async (req, ctx) => {
  if (authed(req)) return ctx.next();

  const url = new URL(req.url);
  if (url.pathname === LOGIN_PATH) {
    if (req.method !== "POST") return loginPage();
    const form = await req.formData().catch(() => null);
    const provided = (form?.get("password") || "").toString();
    const expected = getEnv(ENV_KEY) || "";
    if (expected && provided === expected) {
      const redirectTo = url.searchParams.get("next") || "/";
      return new Response(null, {
        status: 302,
        headers: {
          location: redirectTo,
          "set-cookie": `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; HttpOnly`,
          "cache-control": "no-store",
        },
      });
    }
    return loginPage("Wrong password. Try again.");
  }

  const loginUrl = new URL(LOGIN_PATH, url.origin);
  loginUrl.searchParams.set("next", url.pathname + url.search);
  return loginPage();
};
