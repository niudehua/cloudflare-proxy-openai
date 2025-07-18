export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname !== "/v1/chat/completions") {
        return new Response("Not Found", { status: 404 });
      }
  
      const body = await request.json();
      const prompt = body.messages.map(m => `${m.role}: ${m.content}`).join("\n") + "\nassistant:";
  
      const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/ai/run/${env.MODEL_NAME}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.CF_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });
  
      const data = await resp.json();
      const result = data.result?.response ?? "[无响应]";
  
      return Response.json({
        id: crypto.randomUUID(),
        object: "chat.completion",
        created: Date.now() / 1000 | 0,
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
    }
  };
  