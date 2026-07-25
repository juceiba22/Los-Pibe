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

    const muxStreamId = body.data?.id
    const playbackId = body.data?.playback_ids?.[0]?.id

    console.log(`Edge function Mux webhook - Stream ID: ${muxStreamId}, Playback ID: ${playbackId}`);

    if (!muxStreamId) {
      return new Response("No stream id found in payload", { status: 400 })
    }

    const isLive = body.type === "video.live_stream.active"

    if (body.type === "video.live_stream.active" || body.type === "video.live_stream.idle") {
      console.log(`Stream ${muxStreamId} status change: is_live = ${isLive}`);

      let updateQuery = supabase
        .from("streams")
        .update({
          is_live: isLive,
          ...(isLive && playbackId ? { mux_playback_id: playbackId } : {}),
          updated_at: new Date()
        })

      if (playbackId) {
        updateQuery = updateQuery.or(`mux_stream_id.eq.${muxStreamId},mux_playback_id.eq.${playbackId}`)
      } else {
        updateQuery = updateQuery.eq("mux_stream_id", muxStreamId)
      }

      const { error } = await updateQuery
      
      if (error) {
        console.error("Supabase edge update error:", error)
      } else {
        console.log("Supabase edge update successful")
      }
    }

    return new Response("ok", { status: 200 })

  } catch (err) {
    console.error(err)
    return new Response("error", { status: 500 })
  }
})