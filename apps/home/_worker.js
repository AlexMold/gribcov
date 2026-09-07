// Markdown for Agents: serve index.md when clients ask for text/markdown.
// Docs: https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
export default {
  async fetch(request, env) {
    const accept = request.headers.get("Accept") || "";
    if (accept.includes("text/markdown")) {
      const { pathname } = new URL(request.url);
      const mdPath = pathname.endsWith("/") ? pathname + "index.md" : pathname + ".md";
      const md = await env.ASSETS.fetch(new URL(mdPath, request.url));
      if (md.status === 200) {
        const text = await md.text();
        // ponytail: token estimate = len/4; real tokenizer only if precision matters
        return new Response(text, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Vary": "Accept",
            "x-markdown-tokens": String(Math.ceil(text.length / 4)),
          },
        });
      }
    }
    return env.ASSETS.fetch(request);
  },
};
