# whip-bridge

Bridge WHIP → RTMP para "Los Pibe". Recibe transmisiones WebRTC desde el navegador del celular y las reenvía a Mux vía RTMP usando el mismo `stream_key`.

## Arquitectura

```
Celular (navegador)
  └─ WHIP POST HTTPS ──▶ https://los-pibe-whip.fly.dev/{stream_key}/whip
                                       │
                                MediaMTX (Fly.io)
                                 ├─ WebRTC :8889 (HTTPS via Fly proxy)
                                 ├─ ICE UDP :9000 (único puerto)
                                 ├─ RTSP   :8554 (interno)
                                 └─ runOnReady → ffmpeg → RTMP → Mux
```

OBS sigue usando RTMP directo a Mux sin pasar por este bridge.

---

## Requisitos previos

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) instalado y autenticado (`fly auth login`).
- Docker corriendo localmente (para el build).

---

## Despliegue paso a paso

### 1. Crear la app en Fly.io

```bash
cd whip-bridge
fly launch --no-deploy --name los-pibe-whip --region gru
```

> Si ya existe la app (porque ya corriste esto antes), podés saltear este paso.

### 2. Obtener una IPv4 pública dedicada

Fly.io usa NAT compartido por defecto. Para que la negociación ICE funcione, el contenedor necesita saber su IP pública real.

```bash
fly ips allocate-v4 --app los-pibe-whip
```

Anotá la IP que devuelve (ej: `66.241.124.10`).

### 3. Actualizar `mediamtx.yml` con la IP pública

Abrí `mediamtx.yml` y reemplazá `YOUR_FLY_PUBLIC_IPV4` con la IP del paso anterior:

```yaml
webrtcICEHostNAT1To1IPs: ['66.241.124.10']   # ← tu IP real
```

### 4. Desplegar

```bash
fly deploy
```

El build tarda ~2 min la primera vez (descarga la imagen base con ffmpeg).

### 5. Verificar que está corriendo

```bash
fly logs --app los-pibe-whip
```

Deberías ver algo como:
```
MediaMTX v1.x.x
[RTSP] listener opened on :8554
[WebRTC] listener opened on :8889
```

---

## URL pública resultante

```
https://los-pibe-whip.fly.dev
```

El browser publica WHIP a:
```
POST https://los-pibe-whip.fly.dev/{stream_key}/whip
Content-Type: application/sdp
Body: <SDP offer>
```

---

## Variables de entorno (repo principal)

Agregar en `.env.local` y en Vercel:
```
VITE_WHIP_BRIDGE_URL=https://los-pibe-whip.fly.dev
```

---

## Smoke test manual (recomendado antes de probar desde el celular)

Conectate al contenedor y probá ffmpeg manualmente para aislar si el problema es WHIP o el hook:

```bash
fly ssh console --app los-pibe-whip

# Dentro del contenedor:
ffmpeg -i rtsp://localhost:8554/{stream_key} -c copy -f flv rtmp://global-live.mux.com:5222/app/{stream_key}
```

Si esto funciona, el bridge está bien y el problema está en la negociación WHIP.

---

## Debug de ICE / NAT (si las conexiones se cortan a los pocos segundos)

El punto más común de falla es la negociación ICE detrás del NAT de Fly.io.

1. **Verificar que `webrtcICEHostNAT1To1IPs` tiene la IP correcta** — abrir `fly ips list` y comparar.
2. **Verificar que el puerto UDP 9000 está expuesto** — `fly services list`.
3. **Revisar logs de ICE** en la consola del navegador (pestaña WebRTC Internals en Chrome: `chrome://webrtc-internals`).
4. Como último recurso, agregar un servidor TURN propio (ej: Coturn) para relay completo del tráfico ICE.

---

## Actualizar tras cambios en `mediamtx.yml`

```bash
fly deploy
```

No hace falta reconstruir la imagen base — sólo se copia el archivo de config actualizado.
