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
- Optional but recommended: put the whole hostname behind a Cloudflare
  Access application so staff sign in with SSO before reaching OSCA at all.

## 7. Second factor for admin endpoints (Cloudflare Access + origin check)

Even with an Access policy at the edge, the API additionally verifies the
Access JWT at the origin for `/api/backup/*`, `/api/users*` and
activity-log clearing — direct-to-origin requests without a valid session
get 403. LAN operation is unaffected (the check only activates when the two
variables below are set).

1. Cloudflare Zero Trust → Access → Applications → Add self-hosted app for
   `osca.example.gov.ph`, create an Allow policy (e.g. specific emails).
2. Copy the application's **AUD tag** (Overview page).
3. In `backend/.env`:
   ```dotenv
   CLOUDFLARE_ACCESS_TEAM=https://<your-team>.cloudflareaccess.com
   CLOUDFLARE_ACCESS_AUD=<aud-tag-from-step-2>
   ```
4. Rebuild config and restart the stack:
   ```powershell
   cd backend
   php artisan config:cache
   powershell -ExecutionPolicy Bypass -File backend/deploy/nginx/stop-server.ps1
   powershell -ExecutionPolicy Bypass -File backend/deploy/nginx/start-server.ps1
   ```
5. Verify: browser access prompts Access login; API calls without the
   `CF-Access-JWT-Assertion` session get 403 on admin routes while normal
   staff routes keep working.
