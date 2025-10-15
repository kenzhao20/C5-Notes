// netlify/edge-functions/auth.js
const PASSWORD_ENV = "SITE_PASSWORD";

function getEnv(name) {
  if (typeof Netlify !== "undefined" && Netlify.env?.get) return Netlify.env.get(name);
  if (typeof Deno !== "undefined" && Deno.env?.get) return Deno.env.get(name);
}

export default async (req, ctx) => {
  const expected = getEnv(PASSWORD_ENV) || "";
  const url = new URL(req.url);

  // Serve the password form
  if (req.method === "GET" && !url.searchParams.has("auth")) {
    return new Response(`<!doctype html>
      <form method="POST" style="display:grid;place-items:center;min-height:100vh;font-family:sans-serif">
        <input name="password" type="password" placeholder="Password" autofocus />
        <button type="submit">Access PDF</button>
      </form>`,
      { headers: { "content-type": "text/html" } });
  }

  // Handle form submission
  if (req.method === "POST") {
    const form = await req.formData();
    if (form.get("password") === expected) {
      // redirect to download
      return Response.redirect("/main.pdf", 302);
    }
    return new Response("<p>Wrong password. Try again.</p>", {
      headers: { "content-type": "text/html" },
      status: 401,
    });
  }

  return ctx.next();
};
