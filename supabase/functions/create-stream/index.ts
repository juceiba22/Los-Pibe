import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {

  const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID");
  const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET");

  const auth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);

  const response = await fetch("https://api.mux.com/video/v1/live-streams", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      playback_policy: ["public"],
      new_asset_settings: { playback_policy: ["public"] }
    })
  });

  const data = await response.json();

  return new Response(JSON.stringify({
    stream_id: data.data.id,
    stream_key: data.data.stream_key,
    playback_id: data.data.playback_ids[0].id
  }), {
    headers: { "Content-Type": "application/json" }
  });
});