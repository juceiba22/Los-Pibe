/**
 * DEPRECADO — ya no se usa desde ningún componente del frontend.
 *
 * MOTIVO: Mux no ofrece ingesta WHIP/WebRTC nativa para Live Streams
 * estándar. El hostname global.whip.mux.com no existe: cualquier intento
 * de negociar SDP contra él falla con ENOTFOUND.
 *
 * SOLUCIÓN ACTUAL: La ingesta desde celular/navegador ahora pasa por el
 * bridge propio desplegado en Fly.io (whip-bridge/). El componente
 * WebcamBroadcaster.tsx publica WHIP directo al bridge:
 *
 *   POST https://los-pibe-whip.fly.dev/{stream_key}/whip
 *
 * El bridge (MediaMTX) re-publica el stream por RTMP hacia Mux.
 * Ver whip-bridge/README.md para instrucciones de despliegue.
 *
 * Este archivo se mantiene para no romper imports, pero no se invoca
 * desde ningún lado. Puede borrarse en una limpieza futura.
 */
import { setCorsHeaders } from './_utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse body defensively in case it comes as a string or object
    let body = req.body;
    if (typeof body === 'string') {
      try { 
        body = JSON.parse(body); 
      } catch (e) {
        // ignore
      }
    }

    const streamKey = body?.streamKey?.trim();
    const sdp = body?.sdp;

    if (!streamKey || !sdp) {
      console.error('Faltan parámetros en /api/whip:', { hasStreamKey: !!streamKey, hasSdp: !!sdp });
      return res.status(400).json({ error: 'streamKey y sdp son requeridos' });
    }

    const cleanStreamKey = streamKey.replace(/\s+/g, '');
    const muxWhipUrl = `https://global.whip.mux.com/app/${cleanStreamKey}`;
    console.log(`Iniciando conexión WHIP a Mux con streamKey: ${cleanStreamKey.substring(0, 6)}...`);

    // Server-to-server POST to Mux WHIP endpoint bypassing CORS
    const muxResponse = await fetch(muxWhipUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: sdp
    });

    if (!muxResponse.ok) {
      const errText = await muxResponse.text();
      console.error(`Mux WHIP rechazó la oferta (${muxResponse.status}):`, errText);
      return res.status(muxResponse.status).send(errText || 'Error en servidor WHIP Mux');
    }

    const answerSdp = await muxResponse.text();
    return res.status(201).send(answerSdp);

  } catch (err) {
    console.error('Error detallado en /api/whip:', err, err.cause);
    const detail = err.cause ? `${err.message} (${err.cause})` : err.message;
    return res.status(500).json({ error: detail });
  }
}
