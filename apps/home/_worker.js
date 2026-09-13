// Markdown for Agents: serve index.md when clients ask for text/markdown.
// Docs: https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
//
// API catalog (RFC 9727): served here rather than as a static file so the
// Content-Type is exact ("application/linkset+json") and the dot-directory
// does not depend on asset upload rules.
// Spec: https://www.rfc-editor.org/rfc/rfc9727
//
// Link headers (RFC 8288) on the homepage point agents to the machine-readable
// resources: the API catalog, the OpenAPI description and the LLM context file.
const API_CATALOG = {
  linkset: [
    {
      anchor: "https://gribcov.me/",
      "service-desc": [
        {
          href: "https://gribcov.me/openapi.json",
          type: "application/vnd.oai.openapi+json;version=3.1",
        },
      ],
      "service-doc": [{ href: "https://gribcov.me/", type: "text/html" }],
      "service-meta": [{ href: "https://gribcov.me/llms.txt", type: "text/markdown" }],
      status: [{ href: "https://gribcov.me/", type: "text/html" }],
    },
  ],
};

const CATALOG_PATH = "/.well-known/api-catalog";
const HOMEPAGE_PATHS = new Set(["/", "/index.html"]);

// Relations per RFC 8288 / RFC 8631 / RFC 9727 Section 3.
const LINK_HEADERS = [
  `<${CATALOG_PATH}>; rel="api-catalog"`,
  `</openapi.json>; rel="service-desc"`,
  `<https://gribcov.me/>; rel="service-doc"`,
  `</llms.txt>; rel="describedby"`,
];

function withLinks(response) {
  const headers = new Headers(response.headers);
  for (const value of LINK_HEADERS) headers.append("Link", value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === CATALOG_PATH) {
      const body = JSON.stringify(API_CATALOG, null, 2);
      return new Response(request.method === "HEAD" ? null : body, {
        status: 200,
        headers: {
          "Content-Type":
            'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
          // HEAD must advertise the catalog link relation (RFC 9727, Section 2)
          Link: `<${CATALOG_PATH}>; rel="api-catalog"`,
        },
      });
    }

    const isHomepage = HOMEPAGE_PATHS.has(pathname);
    const accept = request.headers.get("Accept") || "";

    if (accept.includes("text/markdown")) {
      const mdPath = pathname.endsWith("/") ? pathname + "index.md" : pathname + ".md";
      const md = await env.ASSETS.fetch(new URL(mdPath, request.url));
      if (md.status === 200) {
        const text = await md.text();
        // ponytail: token estimate = len/4; real tokenizer only if precision matters
        const headers = new Headers({
          "Content-Type": "text/markdown; charset=utf-8",
          Vary: "Accept",
          "x-markdown-tokens": String(Math.ceil(text.length / 4)),
        });
        if (isHomepage) for (const value of LINK_HEADERS) headers.append("Link", value);
        return new Response(text, { headers });
      }
    }

    const response = await env.ASSETS.fetch(request);
    return isHomepage ? withLinks(response) : response;
  },
};
