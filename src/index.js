export default {
  async fetch(request, env) {
    const startTime = Date.now();

    try {
      const url = new URL(request.url);
      console.log(`[${new Date().toISOString()}] Request received: ${request.method} ${url.pathname}`);

      if (url.pathname !== "/v1/chat/completions") {
        console.log(`[WARN] 404 Not Found for path: ${url.pathname}`);
        return new Response("Not Found", { status: 404 });
      }

      const body = await request.json();
      console.log(`[DEBUG] Request body:`, body);

      const prompt = body.messages.map(m => `${m.role}: ${m.content}`).join("\n") + "\nassistant:";

      const fetchStart = Date.now();
      const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/ai/run/${env.MODEL_NAME}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.CF_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });
      const fetchDuration = Date.now() - fetchStart;

      console.log(`[INFO] Cloudflare AI API responded with status ${resp.status} in ${fetchDuration}ms`);

      const data = await resp.json();
      const result = data.result?.response ?? "[无响应]";

      const totalDuration = Date.now() - startTime;
      console.log(`[INFO] Total request processing time: ${totalDuration}ms`);

      return Response.json({
        id: crypto.randomUUID(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: env.MODEL_NAME,
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: result
          },
          finish_reason: "stop"
        }]
      });

    } catch (error) {
      console.error(`[ERROR] Exception caught:`, error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
};
