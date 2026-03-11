import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Manejo de preflight request (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Webhook received:", payload.type);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
       throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (payload.type === "video.live_stream.active") {
      console.log("Stream is active! Updating DB...");
      const { error } = await supabase
        .from("stream_estado")
        .update({ is_live: true, updated_at: new Date().toISOString() })
        .eq("id", 1);
        
      if (error) throw error;
      
    } else if (payload.type === "video.live_stream.idle" || payload.type === "video.live_stream.disconnected") {
      console.log("Stream is idle! Updating DB...");
      const { error } = await supabase
        .from("stream_estado")
        .update({ is_live: false, updated_at: new Date().toISOString() })
        .eq("id", 1);
        
      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Webhook Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
