// netlify/edge-functions/auth.js
const PASSWORD_ENV = "SITE_PASSWORD";

// --- Helper to read environment variable ---
function getEnv(name) {
  if (typeof Netlify !== "undefined" && Netlify.env?.get) return Netlify.env.get(name);
  if (typeof Deno !== "undefined" && Deno.env?.get) return Deno.env.get(name);
  return undefined;
}

// --- Main Edge Function ---
export default async (req, ctx) => {
  const expected = getEnv(PASSWORD_ENV) || "";
  const url = new URL(req.url);
  const cookie = req.headers.get("cookie") || "";

  console.log("[auth] Password env:", expected); // Debug line — safe to remove later

  // ✅ If user already authenticated, allow request (let PDF load)
  if (cookie.includes("access_granted=true")) {
    return ctx.next();
  }

  // ✅ Handle password submission
  if (req.method === "POST") {
    const form = await req.formData();
    const provided = form.get("password");
    if (provided === expected) {
      // Set short-lived cookie and redirect to PDF
      return new Response(null, {
        status: 302,
        headers: {
          location: url.origin + "/main.pdf",
          "set-cookie": "access_granted=true; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax",
          "cache-control": "no-store",
        },
      });
    }

    // ❌ Wrong password
    return new Response("<p>Wrong password. Try again.</p>", {
      headers: { "content-type": "text/html" },
      status: 401,
    });
  }

  // ✅ Show password form for GET requests (default)
  const html = `
    <!doctype html>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Password Protected</title>
    <style>
      body{display:grid;place-items:center;min-height:100vh;font-family:sans-serif}
      form{display:grid;gap:1em}
      input,button{padding:0.6em 1em;font-size:1em}
    </style>
    <form method="POST">
      <label>Enter password:</label>
      <input type="password" name="password" required>
      <button type="submit">Access PDF</button>
    </form>`;
  return new Response(html, { headers: { "content-type": "text/html" } });
};
