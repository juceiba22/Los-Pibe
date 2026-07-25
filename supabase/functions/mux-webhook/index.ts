import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {

    const body = await req.json()
  
console.log("MUX FULL PAYLOAD:", JSON.stringify(body, null, 2))
console.log("Mux event:", body.type)

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    console.log("Mux webhook event:", body.type)

    const muxStreamId = body.data?.id;
    if (!muxStreamId) {
      return new Response("No stream id found in payload", { status: 400 });
    }

    // STREAM STARTED
    if (body.type === "video.live_stream.active") {
      const playback_id = body.data.playback_ids?.[0]?.id;

      await supabase
        .from("streams")
        .update({
          is_live: true,
          ...(playback_id ? { mux_playback_id: playback_id } : {}),
          updated_at: new Date()
        })
        .eq("mux_stream_id", muxStreamId);

      console.log("Stream activo:", muxStreamId);
    }

    // STREAM STOPPED
    if (body.type === "video.live_stream.idle") {
      await supabase
        .from("streams")
        .update({
          is_live: false,
          updated_at: new Date()
        })
        .eq("mux_stream_id", muxStreamId);

      console.log("Stream finalizado:", muxStreamId);
    }

    return new Response("ok", { status: 200 })

  } catch (err) {

    console.error(err)

    return new Response("error", { status: 500 })
  }
})