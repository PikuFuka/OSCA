# Exposing OSCA through Cloudflare (Tunnel)

Goal: `https://<your-domain>` → Cloudflare edge → encrypted tunnel →
laptop `http://127.0.0.1:8000`. No inbound firewall ports are opened; the
tunnel is outbound-only from the laptop.

## 1. Install cloudflared (elevated PowerShell)

```powershell
winget install --id Cloudflare.cloudflared
```

## 2. Log in and create the tunnel (one time)

```powershell
cloudflared tunnel login
cloudflared tunnel create osca-laptop
cloudflared tunnel route dns osca-laptop osca.example.gov.ph
```

Replace `osca.example.gov.ph` with the real hostname.

## 3. Tunnel ingress config

Save as `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: <TUNNEL-ID-FROM-STEP-2>
credentials-file: C:\Users\<you>\.cloudflared\<TUNNEL-ID>.json

ingress:
  - hostname: osca.example.gov.ph
    service: http://127.0.0.1:8000
    originRequest:
      httpHostHeader: osca.example.gov.ph
  - service: http_status:404
```

## 4. Run as a Windows service (survives logoff)

```powershell
cloudflared service install
Start-Service cloudflared
```

## 5. Tell Laravel about the public hostname

In `backend/.env` (then rebuild the config cache):

```dotenv
APP_URL=https://osca.example.gov.ph
CORS_ALLOWED_ORIGINS=https://osca.example.gov.ph
SANCTUM_STATEFUL_DOMAINS=osca.example.gov.ph,localhost,localhost:3000,127.0.0.1,127.0.0.1:8000
```

```powershell
cd backend
php artisan config:cache
```

Restart the OSCA stack afterwards so workers pick up the change
(`backend\deploy\nginx\stop-server.ps1`, then `start-server.ps1`).

## 6. Cloudflare dashboard checklist

- SSL/TLS mode: **Full (strict)** is ideal; **Full** minimum. The origin is
  HTTP on localhost, so "strict" applies to edge→tunnel transport which is
  always encrypted by the tunnel itself.
- File upload cap on Free plans is **100 MB** — this is why browser backup
  uploads are limited to 100 MB and larger dumps use
  `php artisan backup:restore` on the server.
- Optional: add `X-Frame-Options` / CSP via Transform Rules (origin already
  sends nosniff + SAMEORIGIN + Referrer-Policy).
- Optional: put `/api/backup/*` and `/api/users*` behind Cloudflare Access
  as a second authentication factor for admin endpoints.
