export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      return new Response(`${url.pathname} not found`, {
        status: 404,
        headers: {
          "content-type": "text/plain",
        },
      });
    }
  },
};