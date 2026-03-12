import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {

    const body = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    console.log("Mux webhook event:", body.type)

    // STREAM STARTED
    if (body.type === "video.live_stream.active") {

      const playback_id = body.data.playback_ids?.[0]?.id

      if (playback_id) {

        await supabase
          .from("stream_estado")
          .update({
            is_live: true,
            mux_playback_id: playback_id,
            updated_at: new Date()
          })
          .eq("id", 1)

        console.log("Stream activo:", playback_id)
      }
    }

    // STREAM STOPPED
    if (body.type === "video.live_stream.idle") {

      await supabase
        .from("stream_estado")
        .update({
          is_live: false,
          updated_at: new Date()
        })
        .eq("id", 1)

      console.log("Stream finalizado")
    }

    return new Response("ok", { status: 200 })

  } catch (err) {

    console.error(err)

    return new Response("error", { status: 500 })
  }
})