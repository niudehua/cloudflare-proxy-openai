export default {
  async fetch(request, env) {
    const startTime = Date.now();

    try {
      const url = new URL(request.url);
      console.log(`[${new Date().toISOString()}] 🛰️ Request received: ${request.method} ${url.pathname}`);

      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*"
          }
        });
      }

      if (!url.pathname.startsWith("/v1/chat/completions")) {
        console.log(`[WARN] ❌ 404 Not Found for path: ${url.pathname}`);
        return new Response("Not Found", { status: 404 });
      }

      const body = await request.json();
      console.log(`[DEBUG] 🧾 Request body: ${JSON.stringify(body)}`);

      const prompt = body.messages.map(m => `${m.role}: ${m.content}`).join("\n") + "\nassistant:";
      const aiUrl = `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/ai/run/${env.MODEL_NAME}`;

      console.log(`[INFO] 🔁 Sending request to CF AI: ${aiUrl}`);
      console.log(`[INFO] 🔐 Headers: Authorization Bearer + Content-Type`);
      console.log(`[INFO] 🧠 Prompt: ${prompt}`);

      const fetchStart = Date.now();
      const resp = await fetch(aiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.CF_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });
      const fetchDuration = Date.now() - fetchStart;

      console.log(`[INFO] 📬 CF AI responded with status ${resp.status} in ${fetchDuration}ms`);

      let data;
      try {
        data = await resp.json();
        console.log(`[INFO] 📦 CF AI Response JSON: ${JSON.stringify(data)}`);
      } catch (jsonErr) {
        console.error(`[ERROR] ❌ Failed to parse CF AI response JSON:`, jsonErr);
        return new Response(`Invalid JSON from AI API`, { status: 502 });
      }

      const result = (data.result?.response ?? "[无响应]").trim();
      console.log(`[INFO] 💬 Final response content to Dify: "${result}"`);

      const responsePayload = {
        id: crypto.randomUUID(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: env.MODEL_NAME,
        text: result, // 🌟 Dify 就靠它了！
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: result
          },
          finish_reason: "stop"
        }]
      };

      const totalDuration = Date.now() - startTime;
      console.log(`[INFO] ⏱️ Total processing time: ${totalDuration}ms`);

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (error) {
      console.error(`[ERROR] 💥 Caught exception:`, error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};
