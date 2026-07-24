import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { resourceType, mimeType, fileSize, incidentId, expenseId, idempotencyKey } = body;

    // Strict File Validation
    const blockedMimeTypes = ['image/svg+xml', 'application/x-executable', 'application/x-msdownload', 'application/x-sh'];
    if (blockedMimeTypes.includes(mimeType)) {
      return new Response(JSON.stringify({ error: 'Blocked file format (SVG/Executables forbidden)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Size limits check
    const maxPhotoSize = 20 * 1024 * 1024;
    const maxVideoSize = 150 * 1024 * 1024;
    const maxAudioSize = 25 * 1024 * 1024;

    if (resourceType === 'image' && fileSize > maxPhotoSize) {
      return new Response(JSON.stringify({ error: 'Photo exceeds 20MB limit' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (resourceType === 'video' && fileSize > maxVideoSize) {
      return new Response(JSON.stringify({ error: 'Video exceeds 150MB limit' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (resourceType === 'audio' && fileSize > maxAudioSize) {
      return new Response(JSON.stringify({ error: 'Audio exceeds 25MB limit' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = expenseId ? 'ids_pulse/expenses' : 'ids_pulse/incidents';
    const publicId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME') || 'olbzwhrw';
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY') || '564177726588269';
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET') || 'fake_secret_for_signing';

    // Signature String Construction
    const strToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(strToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const signedParams = {
      cloudName,
      apiKey,
      timestamp,
      signature,
      publicId,
      folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType || 'image'}/upload`
    };

    return new Response(JSON.stringify({
      success: true,
      signedParams,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
