# Klinik — Platform Manajemen Rekam Medis & Jadwal Klinik (SaaS-Ready)

Aplikasi manajemen klinik kecil: autentikasi multi-role (Admin, Dokter, Pasien),
manajemen data pasien, rekam medis digital (SOAP + ICD-10), penjadwalan janji temu
dengan nomor antrean, dan dashboard statistik.

**Stack:** Laravel 12 · PHP 8.3+ · Inertia 2 · React 19 · Tailwind 4 · Shadcn UI ·
PostgreSQL 16+ · spatie/laravel-permission · spatie/laravel-activitylog · Vite 6.

---

## 1. Prasyarat

| Perangkat | Versi minimum | Cek |
|-----------|---------------|-----|
| PHP | 8.3+ (ekstensi `pdo_pgsql`, `mbstring`, `openssl`, `json`) | `php -v` |
| Composer | 2.x | `composer -V` |
| Node.js + npm | Node 20+ / npm 10+ | `node -v` & `npm -v` |
| PostgreSQL | 16+ (diuji pada 18.3) | `psql --version` |

> Catatan: ekstensi PHP `intl` dan `pcov`/`xdebug` **opsional**. `intl` hanya dipakai
> oleh `php artisan db:show`/`db:table`; tanpa `pcov`/`xdebug`, `php artisan test --coverage`
> akan menolak berjalan (lihat §4).

---

## 2. Setup dari nol

```bash
# 1. Dependensi PHP
composer install

# 2. Konfigurasi environment
cp .env.example .env
php artisan key:generate

# 3. Buat database (PostgreSQL)
psql -U postgres -c "CREATE DATABASE klinik;"
```

Sesuaikan blok berikut di `.env`:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=klinik
DB_USERNAME=postgres
DB_PASSWORD=postgres

SESSION_DRIVER=database
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=false   # WAJIB true di produksi (HTTPS)
```

```bash
# 4. Migrasi + seed data demo
php artisan migrate:fresh --seed

# 5. Dependensi & build frontend
npm install
npm run build          # build produksi
# atau, untuk pengembangan:
npm run dev            # Vite dev server (HMR)

# 6. Jalankan server
php artisan serve      # http://127.0.0.1:8000
```

Database untuk **pengujian** dibuat terpisah (jangan pakai DB `klinik`):

```bash
psql -U postgres -c "CREATE DATABASE klinik_test;"
```

---

## 3. Kredensial Demo

Semua akun memakai password `password`. **Data ini HANYA untuk demo —
wajib diganti sebelum produksi.**

| Peran | Email | Password |
|-------|-------|----------|
| Admin | `admin@klinik.test` | `password` |
| Dokter 1 | `dokter1@klinik.test` | `password` |
| Dokter 2 | `dokter2@klinik.test` | `password` |
| Pasien | `pasien@klinik.test` | `password` |

Seeder membuat: 1 klinik, 1 admin, 2 dokter, 1 user pasien, 10 pasien,
10 appointment, 10 rekam medis, 3 role, 12 permission, dan 46 kode ICD-10.

---

## 4. Menjalankan Tes

Tes dijalankan terhadap database terisolasi `klinik_test` (dikonfigurasi di
`phpunit.xml` + `.env.testing`) — **tidak pernah** menyentuh DB dev `klinik`.

```bash
# Siapkan skema DB tes
php artisan migrate:fresh --seed --env=testing

# Jalankan seluruh suite
php artisan test
```

**Hasil terverifikasi (2026-09-11):** `28 passed (130 assertions)`.

### Coverage

```bash
php artisan test --coverage
```

> **Blocker (jujur):** perintah ini gagal dengan
> `ERROR Code coverage driver not available. Did you install Xdebug or PCOV?`
> karena ekstensi `pcov`/`xdebug` tidak terpasang di lingkungan ini. Angka
> coverage **tidak dapat diukur** dan tidak diklaim. Untuk mengaktifkan:
> `pecl install pcov` (atau pasang Xdebug) lalu jalankan ulang. Tanpa driver,
> suite tetap hijau dan itu yang diverifikasi.

### Lint

```bash
vendor/bin/pint --test     # cek gaya kode (Pint)
vendor/bin/pint            # perbaiki otomatis
```

---

## 5. Struktur Route & Middleware

Lihat `php artisan route:list`. Otorisasi berlapis:

- `auth` — sesi login wajib.
- `clinic` (`EnsureClinicScope`) — non-admin wajib punya `clinic_id`.
- `role:admin,dokter` (`EnsureRole`) — pembatasan per peran.
- Policy per model (`PatientPolicy`, `MedicalRecordPolicy`, `AppointmentPolicy`).
- Global scope `BelongsToClinic` — isolasi tenant otomatis pada semua query.
- `throttle:login` — maksimum 5 percobaan login/menit per email+IP.
- `SecurityHeaders` — X-Content-Type-Options, X-Frame-Options, CSP, dll.

---

## 6. Ikhtisar Phase

| Phase | Fokus | Task |
|-------|-------|------|
| 0 | Foundation (Laravel, PostgreSQL, Inertia, Shadcn) | KLK-001..004 |
| 1 | Persona & aturan bisnis | KLK-005..006 |
| 2 | Database, model, factory, seeder | KLK-007..012 |
| 3 | Auth & RBAC (spatie, policy, layout per-role) | KLK-013..018 |
| 4 | Manajemen pasien | KLK-019..022 |
| 5 | Rekam medis digital (SOAP, ICD, enkripsi, audit) | KLK-023..027 |
| 6 | Appointment (anti double-booking, antrean) | KLK-028..031 |
| 7 | Dashboard statistik | KLK-032..034 |
| 8 | Hardening, keamanan, QA | KLK-035..038 |

---

## 7. Catatan Keamanan Produksi

- Set `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, dan gunakan HTTPS.
- Ganti seluruh kredensial demo dan `APP_KEY`.
- Field SOAP rekam medis terenkripsi di DB (`encrypted` cast); password di-hash.
- Rekam medis bersifat *immutable* (tanpa soft delete; revisi dicatat ke activity log).
- Retensi rekam medis mengikuti Permenkes No. 24/2022 (≈25 tahun).

---

## Lisensi

MIT.