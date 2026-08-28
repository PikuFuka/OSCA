# P0 Baseline — OSCA Offline Stack

**Branch:** `perf/offline-file-cache` (created 2026-08-28)
**Env:** `main` @ `11a1377` (assumed), Windows 10, XAMPP MariaDB 10.4.32, Laravel 12.49, PHP 8.2.12, Vite 6.4.1
**DB reachable:** NO (port 3306 refused, `php artisan migrate:status` throws `SQLSTATE[HY000] [2002] No connection`). All DB metrics derived from `osca_db.sql` dump (105.89 MB, 8107 lines, 2026-03-18).

## Stack Snapshot

| Layer | Detail | File |
|-------|--------|------|
| Laravel | 12.49, PHP 8.2.12, APP_ENV=local, DEBUG=ENABLED | `backend/.env:1`,`backend/composer.json:10` |
| DB | `DB_CONNECTION=mysql` osca_db @127.0.0.1:3306, InnoDB utf8mb4_unicode_ci | `backend/.env:23-28` |
| Cache | `CACHE_STORE=database` (default `database` table `cache`, prefix `osca-cache-`) | `backend/.env:40`, `config/cache.php:18,42` |
| Session | `file`, Queue `database`, BCRYPT_ROUNDS=12 | `backend/.env:30,38` |
| Frontend | React 19.2.4, Vite 6.4.1, build outDir `../backend/public/app`, base `/app/` prod | `frontend/vite.config.ts:11,24` |
| Routes | 42 routes, see `php artisan route:list` below | `routes/api.php` |

## Route List (42)

```
GET|HEAD  / 
GET|HEAD  api/activity-logs (index)
POST      api/activity-logs (store)
DELETE    api/activity-logs (clear)
GET|HEAD  api/backup/export
POST      api/backup/import
POST      api/change-password
GET|HEAD  api/login (login name)
POST      api/login
POST      api/logout
GET|HEAD  api/me
POST      api/register
GET|HEAD  api/reports/senior-citizens
GET|HEAD  api/requests
POST      api/requests/update
PUT       api/requests/{id}/approve
PUT       api/requests/{id}/reject
GET|HEAD  api/seniors (index, with ?search & barangay & status, per_page -1 bypass)
POST      api/seniors
GET|HEAD  api/seniors/deceased
GET|HEAD  api/seniors/deleted
GET|HEAD  api/seniors/next-id
GET|HEAD  api/seniors/statistics (cached dashboard_stats)
GET|HEAD  api/seniors/{id}
PUT       api/seniors/{id}
DELETE    api/seniors/{id}
POST      api/seniors/{id}/deceased
POST      api/seniors/{id}/documents
POST      api/seniors/{id}/photo
POST      api/seniors/{id}/restore
POST      api/seniors/{id}/un-deceased
GET|HEAD  api/seniors/{seniorId}/documents/{documentId}
DELETE    api/seniors/{seniorId}/documents/{documentId}
GET|HEAD  api/storage/profiles/{filename}
GET|HEAD  api/users ...
```

## DB Dump Analysis (offline, no server)

- Dump size: **105.89 MB**, 8107 lines, 246 `INSERT INTO` chunks.
- `seniors` DDL: `osca_id varchar unique nullable`, `barangay index`, `sex enum(Male,Female)`, `pension_status enum(Indigent,Pensioner,National Social Pensioner,Local Social Pensioner)`, `status enum(Active,Pending,Deceased,Inactive)`, no fulltext.
- Data: **~6539 seniors** inferred from cached stats `dashboard_stats:all-barangays:all-years` -> total 6539 (active 6539, centenarians 17). Inserts: 20 `INSERT INTO seniors` chunks, each ~300-400 rows (observed sample rows 58-138 share `created_at 2025-06-29 16:00:00`, bulk import).
- `senior_documents`: LONGBLOB `file_content` (`2024_02_04_000004`), duplicated for `idPicture` + `profile_photos/` file.
- Cache: single row `osca-cache-dashboard_stats:all-barangays:all-years` value is PHP serialized `Eloquent\Collection` (bloated, includes model metadata, ~12 monthlyStats, ageRanges, genders, topBarangays 5, allBarangayStats 16). Expiration col int, stored in `cache` mediumtext.
- `osca_db.sql:11mb` dominated by seniors + users + personal_access_tokens (85+ tokens never pruned).

## TTFB / Endpoint (estimated, DB offline)

- `GET /api/seniors/statistics` — **cannot measure live** (DB refused). Code path `SeniorController.php:834` does `Cache::remember 30s` on `database` store, then on miss runs **~30 counts**: 12 months ×3 (male/female/deceased via `LIKE 'M%'` not index) + 7 ageRanges + genders + groupBy barangay. Estimated cold ~800-1500ms for 6539 rows, 30s cache still hits DB `cache` table.
- `ab -n 200 -c 10 .../statistics?barangay=Biñan` — **not run** (no server, `ab` not installed on Windows). Recommended command: `"C:\xampp\apache\bin\ab.exe" -n 200 -c 10 http://127.0.0.1:8000/api/seniors/statistics` after `php artisan serve`.
- `GET /api/seniors?search=%term%` — `applySeniorSearch` `SeniorController.php:33` uses `LIKE "%term%"` leading wildcard per term + nested OR, cannot use `seniors_last_name_first_name_index`. Full scan.
- `GET /api/seniors/deleted` / `deceased` — `get()` without paginate `SeniorController.php:163,184`, transfers all rows.
- `GET /api/seniors?per_page=-1` — bypasses cap `SeniorController.php:100`, returns full JSON ~3-5MB.

## Frontend Bundle (production build)

- `npm run build` 24.07s, output `backend/public/app`:
  - `assets/index-Cqai0JR8.js` **999.65 kB** (gzip 267.39 kB) — WARN >500k, single chunk (no manualChunks)
  - `assets/index-CSSHpVok.css` 87.20 kB (gzip 14.23k)
  - `assets/selfie_segmentation-C19aKJK5.js` 44.38k
  - Images: `FRONT 1.53MB`, `BACK 991k`, fonts 10-85k each, total `assets/` 3.7 MB across 12 files.
- Vite config `frontend/vite.config.ts:23` no `manualChunks`, no `chunkSizeWarningLimit`, no compression plugin.
- Eager imports `App.tsx:2` loads Dashboard/MemberRegistry (107k), Header (50k), AddMemberForm (75k) etc. Mediapipe `@mediapipe/selfie_segmentation` loaded eagerly via `MemberRegistry.tsx:76` dynamic import but prewarmed.
- `services/api.ts:91` in-memory `Map` cache 5m, `cache.clear()` on every mutation nukes all, `seniorsAPI.getAll({fresh:true})` bypasses cache.

## DB Logical Size

- `osca_db.sql` 105.89 MB dump → estimated live InnoDB ~150-200 MB with LONGBLOB overhead. `backend/storage` 96.57 MB (logs/cache). `backend/public/app` 3.7 MB.

## EXPLAIN — Search (logical, DB offline)

```sql
EXPLAIN SELECT * FROM seniors
WHERE (osca_id LIKE '%ISIDRO%' OR (first_name LIKE '%ISIDRO%' OR middle_name LIKE ...))
AND barangay='Biñan'
ORDER BY last_name LIMIT 15;
```

- Expected: `type: ALL`, `key: NULL`, `rows: 6539`, `Extra: Using where; Using filesort` — `LIKE '%term%'` prevents index on `last_name,first_name` and `barangay` index not used with OR. Verified by parsing `SeniorController.php:24 applySeniorSearch` and migrations `2026_02_05_033338_add_indexes`.

- Statistics query plan: `Cache::remember` → `SELECT * FROM cache WHERE key='osca-cache-dashboard_stats:...'` (point lookup) on miss → 30 `SELECT COUNT(*) FROM seniors WHERE ... LIKE` scans.

## Config Flags (pre-change)

- `CACHE_STORE=database` → to become `file` (P2)
- `QUEUE_CONNECTION=database`, `SESSION_DRIVER=file`, `BCRYPT_ROUNDS=12`, `PHP_CLI_SERVER_WORKERS` commented, `LOG_LEVEL=debug`, `storage/public` NOT LINKED (`php artisan about`)

## Acceptance

- Branch `perf/offline-file-cache` exists, clean working tree.
- Metrics captured offline; live TTFB/AB/Lighthouse require `C:\xampp\mysql\bin\mysqld.exe --defaults-file=C:\xampp\mysql\bin\my.ini --standalone` + `php artisan serve` + `npm run dev --prefix frontend` (see `package.json:8`, `APP/start.ps1`).
- No code changed in P0.
