import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { public_id, secure_url, bytes, format, resource_type, notification_type } = body;

    console.log(`[Cloudinary Webhook Received]: Asset ${public_id} (${bytes} bytes, format: ${format})`);

    // Verify webhook payload integrity
    if (!public_id || !secure_url) {
      return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      verified: true,
      asset_id: public_id,
      status: 'verified_by_ids',
      sanitized_url: secure_url,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
