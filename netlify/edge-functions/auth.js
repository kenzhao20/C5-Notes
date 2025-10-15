// netlify/edge-functions/auth.js
const PASSWORD_ENV = "SITE_PASSWORD";

function getEnv(name) {
  if (typeof Netlify !== "undefined" && Netlify.env?.get) return Netlify.env.get(name);
  if (typeof Deno !== "undefined" && Deno.env?.get) return Deno.env.get(name);
}

export default async (req, ctx) => {
  const expected = getEnv(PASSWORD_ENV) || "";
  const url = new URL(req.url);

  // Handle form submission (POST)
  if (req.method === "POST") {
    const form = await req.formData();
    if (form.get("password") === expected) {
      // ✅ Correct password → redirect to PDF
      return Response.redirect(url.origin + "/main.pdf", 302);
    }
    // ❌ Wrong password → message
    return new Response("<p>Wrong password. Try again.</p>", {
      headers: { "content-type": "text/html" },
      status: 401,
    });
  }

  // Show the password form (GET)
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
