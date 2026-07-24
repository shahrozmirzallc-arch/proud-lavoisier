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
    const { incidentId, leadId, mediaAssets } = body;

    // Create frozen sanitized bundle for customer release
    const sanitizedBundle = {
      publicationId: `pub_${Date.now()}`,
      incidentId,
      publishedAt: new Date().toISOString(),
      publishedBy: leadId,
      version: 1,
      items: (mediaAssets || []).map((m: any) => ({
        assetId: m.id,
        sanitizedUrl: (m.url || '').replace('/upload/', '/upload/c_limit,w_1600/fl_strip_profile/'),
        type: m.type || 'image',
        exifStripped: true
      }))
    };

    return new Response(JSON.stringify({
      success: true,
      publishedBundle: sanitizedBundle
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
