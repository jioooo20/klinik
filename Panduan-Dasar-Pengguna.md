# Panduan Dasar Pengguna — Klinik

Panduan resmi penggunaan aplikasi **Klinik**, platform manajemen rekam medis &
jadwal klinik. Dokumen ini menjelaskan proses bisnis **setiap peran pengguna**
beserta **seluruh percabangan (branching)** yang tersedia di dalam sistem.

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Autentikasi & Registrasi](#2-autentikasi--registrasi)
3. [Peran & Hak Akses](#3-peran--hak-akses)
4. [Proses Bisnis Admin Klinik](#4-proses-bisnis-admin-klinik)
5. [Proses Bisnis Dokter](#5-proses-bisnis-dokter)
6. [Proses Bisnis Pasien](#6-proses-bisnis-pasien)
7. [State Machine Janji Temu](#7-state-machine-janji-temu)
8. [Aturan Bisnis Penting](#8-aturan-bisnis-penting)
9. [Glosarium & Istilah](#9-glosarium--istilah)

---

## 1. Pendahuluan

**Klinik** adalah aplikasi manajemen klinik kecil dengan tiga peran pengguna:

| Peran | Deskripsi |
|-------|-----------|
| **Admin Klinik** | Mengelola data pasien, dokter, janji temu, rekam medis, dan laporan. |
| **Dokter** | Melihat antrean hari ini, mengisi rekam medis (SOAP + ICD-10), dan mengelola janji temu. |
| **Pasien** | Mendaftar mandiri, membuat janji temu, membatalkan janji, dan melihat riwayat berobatnya sendiri. |

### 1.1 Akun Demo

Semua akun demo memakai kata sandi `password` (HANYA untuk lingkungan demo):

| Peran | Email |
|-------|-------|
| Admin | `admin@klinik.test` |
| Dokter 1 | `dokter1@klinik.test` |
| Dokter 2 | `dokter2@klinik.test` |
| Pasien | `pasien@klinik.test` |

---

## 2. Autentikasi & Registrasi

### 2.1 Login

Halaman: `/login`

1. Pengguna mengisi **Email** dan **Kata Sandi**.
2. Sistem memvalidasi kredensial:
   - **Jika benar** → sesi dibuat, lalu pengguna diarahkan ke **dasbor sesuai peran**:
     - `admin` → `/dashboard/admin`
     - `dokter` → `/dashboard/doctor`
     - `pasien` → `/dashboard/patient`
   - **Jika salah** → muncul pesan error "These credentials do not match our records."
     - Pengguna tetap di halaman login dan dapat mencoba lagi.
3. Opsi **"Ingat saya"** (remember me) memperpanjang masa sesi.
4. **Batasan keamanan:** maksimal **5 percobaan login per menit** per kombinasi email + IP. Jika terlampaui, sistem mengembalikan HTTP 429 *Too Many Requests*.
   - Pengecualian: pada lingkungan uji `APP_ENV=e2e`, rate limiter dinonaktifkan.

### 2.2 Registrasi (Khusus Pasien)

Halaman: `/register` (link "Daftar sebagai pasien" di halaman login)

Formulir: Nama Lengkap, Email, No. Telepon (opsional), Kata Sandi, Konfirmasi Kata Sandi.

Proses:
1. Sistem memvalidasi input (email unik, kata sandi wajib dikonfirmasi).
2. Jika valid, dilakukan **transaksi basis data**:
   - Akun user dibuat dengan role `pasien`.
   - Role `pasien` (spatie) diberikan ke akun.
   - **Jika klinik pertama tersedia**, otomatis dibuat data pasien yang tertaut:
     - `user_id` = akun baru
     - nama = nama akun, gender = `male`, tanggal lahir = `1970-01-01` (default sementara), telepon = no. telepon akun.
3. Pengguna **langsung login** (tanpa login ulang) dan diarahkan ke `/dashboard/patient`.

> **Catatan:** registrasi **selalu** menghasilkan peran pasien. Admin dan dokter
> dibuat dari sisi sistem/seed, bukan lewat registrasi mandiri.

### 2.3 Logout

Tombol **"Keluar"** di pojok kanan atas (header). Menghapus sesi, mematikan token CSRF, dan mengembalikan pengguna ke `/login`.

### 2.4 Halaman Awal (Root)

Membuka `/`:
- Jika sudah login → dialihkan ke `/dashboard`.
- Jika belum login → dialihkan ke `/login`.

---

## 3. Peran & Hak Akses

### 3.1 Matriks Menu per Peran (Sidebar Navigasi)

| Menu | Admin | Dokter | Pasien |
|------|:-----:|:------:|:------:|
| Dasbor (`/dashboard/...`) | ✔ | ✔ | ✔ |
| Pasien (`/patients`) | ✔ (CRUD) | ✔ (baca saja) | ✖ |
| Dokter (`/doctors`) | ✔ (baca saja) | ✖ | ✖ |
| Janji Temu (`/appointments`) | ✔ (semua) | ✔ (antrean hari ini) | ✔ (milik sendiri) |
| Buat Janji Temu (`/appointments/create`) | ✔ | ✖ | ✔ |
| Laporan (`/reports/visits`) | ✔ | ✔ (via URL, tidak ada menu) | ✖ |
| Rekam Medis per Pasien (`/patients/{patient}/records`) | ✔ | ✔ | ✖ (hanya detail own record) |

### 3.2 Matriks Izin (dari seeder permission)

| Permission | Admin | Dokter | Pasien |
|------------|:-----:|:------:|:------:|
| `clinic.view`, `clinic.manage`, `user.manage` | ✔ | ✖ | ✖ |
| `doctor.view`, `doctor.manage` | ✔ | `doctor.view` | ✖ |
| `patient.view`, `patient.manage` | ✔ | `patient.view` | ✖ |
| `appointment.view`, `appointment.create`, `appointment.manage` | ✔ | view + manage | view + create |
| `medical-record.view`, `medical-record.manage` | ✔ | ✔ | `medical-record.view` |

### 3.3 Lapisan Otorisasi

1. **`auth`** — wajib login pada semua rute kecuali login/register.
2. **`clinic`** (`EnsureClinicScope`) — non-admin **wajib** punya `clinic_id`; jika tidak, akses ditolak (403 "Akun belum terhubung ke klinik.").
3. **`role:...`** (`EnsureRole`) — pembatasan per peran; lolos jika punya salah satu peran via spatie ATAU kolom `users.role`.
4. **Policy per model** — `PatientPolicy`, `MedicalRecordPolicy`, `AppointmentPolicy`, `DoctorPolicy`.
5. **Global scope `BelongsToClinic`** — isolasi data antar klinik (tenant) otomatis pada setiap query.

---

## 4. Proses Bisnis Admin Klinik

### 4.1 Dasbor Admin (`/dashboard/admin`)

Menampilkan ringkasan klinik:

- **KPI:** Total Kunjungan, Pasien Baru, Janji Selesai, Janji Aktif, Total Pasien, Dokter Aktif.
- **Top Diagnosis (ICD-10):** 8 diagnosis terbanyak di klinik.
- **Janji Temu Hari Ini:** jumlah per status (pending/confirmed/completed/cancelled).

**Percabangan — Filter Periode:**

```
[Pilih Periode: Hari ini | Minggu ini | Bulan ini | Tahun ini]
```
- Klik salah satu tombol → dasbor dimuat ulang dengan rentang waktu terpilih.
- Data statistik disesuaikan terhadap rentang tersebut.

### 4.2 Manajemen Pasien (`/patients`)

#### 4.2.1 Daftar Pasien (Index)

Menampilkan tabel berisi **NIK, Nama, Tgl Lahir, Gender, Telepon**, dengan pagination (15/halaman).

**Percabangan — Pencarian:**

```
[Kotak pencarian] → isi nama ATAU NIK → klik "Cari"
  ├── Ada hasil → tabel menampilkan pasien yang cocok (pencarian parsial / ilike)
  └── Tidak ada / kosong → "Belum ada data pasien."
```

**Percabangan — Tombol Aksi per Baris:**

```
"Detail" → /patients/{id}  (lihat sub-bab 4.2.3)
```

**Percabangan — Tambah Pasien:**

```
Tombol "Tambah Pasien" (khusus admin)
  ├── Klik → /patients/create
  └── Isi formulir → "Simpan"
       ├── Valid → redirect ke detail pasien + pesan sukses
       └── Tidak valid → error per bidang (validasi ditampilkan di form)
```

#### 4.2.2 Tambah Pasien (`/patients/create`)

Formulir: **NIK, Nama Lengkap, Tanggal Lahir, Jenis Kelamin (Laki-laki/Perempuan), Telepon, Alamat**.

- Semua kecuali alamat & telepon wajib diisi sesuai aturan validasi.
- Berhasil → ke halaman detail pasien (`/patients/{id}`) dengan pesan *"Pasien berhasil ditambahkan."*.

#### 4.2.3 Detail Pasien (`/patients/{id}`)

Menampilkan 3 kartu:

1. **Data Diri** — NIK, jenis kelamin, tanggal lahir, golongan darah, alergi, telepon, alamat, kontak darurat.
2. **Riwayat Kunjungan** — tabel tanggal, dokter, ICD-10, diagnosis (assessment).
3. **Janji Temu** — tabel jadwal, dokter, no. antrean, keluhan, status.

**Percabangan — Tombol Aksi:**

```
[Kembali] → /patients

[khusus Admin] [Ubah] → /patients/{id}/edit
  ├── Edit formulir → "Simpan Perubahan"
  │    ├── Valid → kembali ke detail pasien + pesan sukses
  │    └── Tidak valid → error per bidang
  └── [Batal] → kembali ke detail pasien

["Lihat Semua Rekam Medis"] → /patients/{id}/records  (sub-bab 5.4)
```

**Percabangan — Isi Tabel Riwayat / Janji Temu:**

```
Data ada → tampilkan baris tabel
Data kosong → "Belum ada rekam medis." / "Belum ada janji temu."
```

#### 4.2.4 Hapus Pasien

- **Sistem tidak menyediakan tombol hapus di UI**; namun rute `DELETE /patients/{id}` tersedia untuk admin.
- Penghapusan bersifat **soft delete** (baris tersembunyi, data tetap di basis data).
- Berhasil → kembali ke `/patients` + pesan *"Pasien berhasil dihapus."*.

### 4.3 Daftar Dokter (`/doctors`)

**Hanya baca (read-only)** — menampilkan tabel: **Nama, Spesialisasi, No. STR, Status (Aktif/Nonaktif)**, dengan pagination. Tidak ada aksi tambahan untuk admin.

### 4.4 Janji Temu Admin (`/appointments`)

Admin melihat **semua janji temu** di klinik (judul halaman: "Semua Janji Temu").

#### 4.4.1 Membuat Janji Temu (`/appointments/create`)

**Percabangan — Formulir Booking:**

```
1. Pilih Dokter     → daftar dokter aktif di klinik (id + spesialisasi)
2. Pilih Tanggal    → minimum hari ini (min = tanggal sekarang)
3. Pilih Slot       → grid jam 08.00 s.d. 17.00 (10 slot per hari)
       ├── Slot terisi → dinonaktifkan (garis coret + abu-abu)
       └── Slot tersedia → bisa dipilih (kuning/indigo saat aktif)
4. [khusus Admin] pasien dipilih → janji dibuat atas nama pasien tersebut
   (info: "Sebagai admin, janji temu akan ditautkan ke pasien yang sesuai.")
5. Keluhan (opsional)
6. Klik "Simpan" (dinonaktifkan bila slot belum dipilih)
```

**Percabangan — Hasil Simpan:**

```
Berhasil → /appointments + "Janji temu berhasil dibuat." (status awal = pending)
Gagal double-booking → error "Jadwal dokter ini sudah terisi. Silakan pilih slot lain."
Gagal validasi lain → error per bidang (contoh: "Jadwal harus di masa depan.")
```

> **Penting:** admin wajib memilih pasien (`patient_id` *required*). Admin memilih dokter yang sama + slot sama yang sudah dipesan → ditolak oleh index unik anti double-booking.

#### 4.4.2 Mengubah Status Janji Temu

Di tabel `/appointments`, dropdown **"Ubah status..."** tersedia untuk admin.

```
Status saat ini: pending    → pilihan: confirmed, cancelled
Status saat ini: confirmed  → pilihan: completed, cancelled
Status saat ini: completed/cancelled → tidak ada menu (status terminal)
```

- Memilih status → `PATCH /appointments/{id}/status`.
- Transisi **tidak valid** ditolak dengan pesan *"Transisi {X} → {Y} tidak diizinkan."*
- Saat transisi ke **confirmed** dan belum ada nomor antrean → sistem **memberi nomor antrean** otomatis (per klinik per hari, dimulai dari 1).

**Percabangan UI:**

```
Admin → dropdown ubah status + tombol "Batalkan" tampil (can_update_status & can_delete = true)
```

#### 4.4.3 Batalkan / Hapus Janji Temu

Tombol **"Batalkan"** di setiap baris → konfirmasi dialog.

```
[OK pada konfirmasi]
  ├── Status masih aktif (pending/confirmed) → status diubah ke "Dibatalkan" (cancelled)
  └── Status sudah terminal (completed/cancelled) → baris dihapus permanen
[Batal] → tidak terjadi apa-apa
```

### 4.5 Rekam Medis Admin (`/medical-records/{id}`)

- Admin dapat melihat **detail** rekam medis mana pun di kliniknya.
- Admin dapat **menekan tombol "Revisi"** (`canUpdate = true`) dan mengubah rekam medis milik dokter mana pun.
- **Admin TIDAK dapat membuat rekam medis** (khusus dokter, lihat sub-bab 5.5).

### 4.6 Laporan Kunjungan (`/reports/visits`)

Menampilkan laporan janji temu/kunjungan dengan **4 filter**:

```
Dari (tanggal)      → default: awal bulan berjalan
Sampai (tanggal)    → default: akhir bulan berjalan
Dokter              → Semua / nama dokter tertentu
Status              → Semua / pending / confirmed / completed / cancelled
```

**Percabangan:**

```
Klik "Terapkan"
  ├── Data cocok → tabel (Jadwal, Pasien, Dokter, No. Antrean, Status) + pagination 20/halaman
  └── Tidak ada data → "Tidak ada data pada rentang ini."
```

> **Catatan:** rute laporan diizinkan untuk `admin` dan `dokter` (middleware `role:admin,dokter`), tetapi **menu navigasi Laporan hanya tampil untuk admin**. Dokter dapat membukanya lewat URL `/reports/visits`.

### 4.7 Diagram Alir Ringkas — Admin

```
Login (admin) → /dashboard/admin
  ├── [? period filter] → dashboard (hari ini/minggu/bulan/tahun)
  ├── Pasien
  │    ├── Cari  → index (substring nama/NIK)
  │    ├── [+ Tambah] → create → (valid? → show | error per field)
  │    ├── Detail → show
  │    │    ├── [Ubah] → edit → (valid? → show | error)
  │    │    └── [Lihat Semua Rekam Medis] → records index
  │    └── Hapus (soft delete via API)
  ├── Dokter → list read-only
  ├── Janji Temu
  │    ├── [Buat Janji Temu] → pilih dokter→tanggal→slot→pasien→keluhan → simpan
  │    │    ├── ganda → error "slot sudah terisi"
  │    │    └── ok → index (pending)
  │    ├── [Ubah status...] → transisi state machine (nomor antrean saat confirmed)
  │    └── [Batalkan] → cancel (aktif) / delete (terminal)
  ├── Rekam Medis → show → [Revisi] → edit → put
  └── Laporan → Visits (filter from/to/doctor/status) → tabel
```

---

## 5. Proses Bisnis Dokter

### 5.1 Dasbor Dokter (`/dashboard/doctor`)

Menampilkan data **pribadi dokter**:

- **KPI:** Kunjungan, Selesai, Aktif, Pasien Baru (filter periode sama seperti admin).
- **Antrean Hari Ini** — daftar janji temu hari ini milik dokter tersebut.
- **Top Diagnosis (ICD-10)** milik dokter tersebut.

**Percabangan — Kolom Aksi Antrean:**

```
Per baris antrean:
  └── [Belum ada rekam medis] → tombol "Isi Rekam Medis" tampil
       └── Klik → /patients/{id}/records/create (sub-bab 5.5)
  └── [Sudah ada rekam medis] → tombol SAMA SEKALI TIDAK tampil (has_record = true)
```

> Ini percabangan penting: tombol hanya muncul ketika pasien **belum** punya catatan medis.

### 5.2 Pasien (Read-Only)

Menu **"Pasien Saya"** (`/patients`):

- Dokter dapat **melihat daftar pasien** (nama/NIK, search, pagination) dan **detail** pasien.
- Dokter **tidak** melihat tombol "Tambah Pasien", "Ubah", atau "Edit" (khusus admin).
- Dari halaman detail, dokter dapat menekan **"Lihat Semua Rekam Medis"**.

### 5.3 Janji Temu Dokter

Judul halaman: **"Antrean Hari Ini"**.

- Hanya menampilkan janji temu **hari ini** milik dokter yang sedang login.
- Dokter dapat mengubah status (`can_update_status = true`) melalui dropdown, seperti admin.
- Dokter **tidak dapat membuat** janji temu.

### 5.4 Riwayat Rekam Medis Pasien (`/patients/{id}/records`)

Menampilkan seluruh rekam medis seorang pasien, urutan terbaru dulu.

**Percabangan — Filter Tanggal:**

```
[Dari / Sampai] → [Terapkan]
  ├── Catatan dalam rentang → tampil
  └── Kosong → "Belum ada rekam medis pada rentang ini."
[Reset] → tampilkan semua
```

**Percabangan — Aksi:**

```
[Kembali ke Pasien] → /patients/{id}
["Rekam Medis Baru"] → /patients/{id}/records/create  (khusus dokter)
Per baris: "Detail" → /medical-records/{id}
```

### 5.5 Membuat Rekam Medis (`/patients/{id}/records/create`)

**Hanya dokter.** Formulir:

| Bidang | Wajib? | Catatan |
|--------|:------:|---------|
| Tanggal Kunjungan | ✔ | default: hari ini |
| Subjective (S) | ✔ | keluhan subjektif pasien |
| Objective (O) | ✔ | temuan objektif |
| Assessment (A) | ✔ | penilaian/diagnosis |
| Plan (P) | ✔ | rencana tindak lanjut |
| Tanda Vital | opsional | tensi, suhu, nadi, respirasi |
| Diagnosis ICD-10 | opsional | checkbox majemuk dari 46+ kode |
| Resep | opsional | satu baris per obat |

**Alur simpan:**

```
klik "Simpan Rekam Medis"
  ├── SOAP lengkap → record tersimpan
  │    ├── nested ok → redirect /medical-records/{id} + "Rekam medis berhasil disimpan."
  │    │    ├── jika appointment_id dipilih → tertaut ke janji temu
  │    │    └── icd10_codes → digabung jadi string (mis. "A09,B00")
  │    └── narasi SOAP disimpan TERENKRIPSI (encrypted cast)
  └── SOAP kosong → error "Subjective (S) wajib diisi..." dst.
```

> **Enkripsi (BR-11):** field `subjective`, `objective`, `assessment`, `plan`
> disimpan terenkripsi di basis data.

### 5.6 Detail & Revisi Rekam Medis

- **Detail** (`/medical-records/{id}`): SOAP, metadata (waktu, dokter, ICD-10), tanda vital, resep.
- **Revisi** (`/medical-records/{id}/edit`): tombol tampil jika `canUpdate = true`.

```
canUpdate = true  apabila:
  ├── admin                        (boleh revisi rekam medis dokter manapun)
  └── dokter pembuat record tersebut  (doctor.user_id == user.id)
```

- Revisi **menimpa** data lama + mencatat **riwayat audit** (activity log — KLK-026).
- Rekam medis **tidak dapat dihapus** (immutable, BR-07). Jika dipanggil via API → 403.

### 5.7 Diagram Alir Ringkas — Dokter

```
Login (dokter) → /dashboard/doctor
  ├── Antrean hari ini
  │    └── pasien & belum ada record → [Isi Rekam Medis] → create → simpan
  ├── Pasien Saya → index (read-only) → detail
  │    └── [Lihat Semua Rekam Medis] → records index (filter tanggal)
  │         └── [Rekam Medis Baru] → create (SOAP wajib, resep opsional)
  ├── Janji Temu (antrean hari ini) → [Ubah status...] → confirmed → nomor antrean otomatis
  └── Rekam Medis → detail → [Revisi] (hanya record milik sendiri) → update
```

---

## 6. Proses Bisnis Pasien

### 6.1 Dasbor Pasien (`/dashboard/patient`)

Menampilkan:

- **Total Kunjungan** — jumlah kunjungan pasien tersebut.
- **Kunjungan Terakhir** — tanggal kunjungan terakhir.
- **Janji Temu Berikutnya** — jadwal, dokter, status, nomor antrean.

**Percabangan:**

```
Ada janji berikutnya → tampilkan detail & nomor antrean
Belum ada            → pesan "Belum ada janji temu terjadwal."
                       + tombol [Buat Janji Temu] → /appointments/create
```

### 6.2 Janji Temu Saya (`/appointments`)

Pasien hanya melihat **janji temu miliknya** (berdasarkan akun user tertaut).

**Percabangan — Aksi per Baris:**

```
Status = pending  → tombol "Batalkan" TAMPIL (can_delete = true)
Status = confirmed/completed/cancelled → tombol "Batalkan" TIDAK tampil
```

Dropdown **"Ubah status..."** tidak tampil untuk pasien (`can_update_status = false`).

### 6.3 Membuat Janji Temu (`/appointments/create`)

Sama dengan alur admin (sub-bab 4.4.1), tetapi:

- Pasien **tidak** memilih pasien (sistem otomatis memakai data pasien tertaut; jika akun belum punya baris pasien, akan **dibuat otomatis** saat submit).
- **Slot terisi** untuk dokter & tanggal yang dipilih tampil dinonaktifkan (sudah dipesan 30 hari ke depan).

### 6.4 Membatalkan Janji Temu

```
Klik "Batalkan" → konfirmasi
  ├── Status masih pending → status = cancelled (soft cancel)
  └── OK / Cancel
```

> Pasien **hanya** dapat membatalkan janji yang masih berstatus **pending**
> (`AppointmentPolicy::delete`). Janji yang sudah confirmed/completed tidak bisa dibatalkan pasien.

### 6.5 Melihat Rekam Medis Sendiri

- Pasien **tidak** memiliki menu rekam medis di navigasi.
- Namun via policy `MedicalRecordPolicy::view`, pasien dapat membuka halaman detail
  `/medical-records/{id}` **hanya untuk record miliknya** (record yang `patient.user_id = user.id`).
- Pasien yang mengakses record orang lain → 403 (Akses ditolak).

### 6.6 Diagram Alir Ringkas — Pasien

```
Daftar sendiri (role pasien) → auto login
    └── /dashboard/patient
         ├── Ada next appointment → lihat (dokter, status, antrean)
         └── Tidak ada → [Buat Janji Temu]
              → pilih dokter → pilih tanggal → pilih slot (terisi dinonaktifkan)
              → keluhan (opsional) → [Simpan]
                  ├── slot ganda → error "Jadwal dokter ini sudah terisi."
                  └── berhasil → /appointments (status pending)
         ├── Appointments saya
         │    └── [Batalkan] → hanya jika pending → status cancelled
         └── (via URL) /medical-records/{id} → hanya record milik sendiri
```

---

## 7. State Machine Janji Temu

Status janji temu diatur oleh **state machine BR-01**:

```
                    ┌─────────────────────────┐
                    ▼                         │
  (pending) ──────────────────────────────► (confirmed) ──► (completed)
      │                                        │
      │                                        │
      ▼                                        ▼
  (cancelled) ────────────────────────────► (terminal)
```

| Status Awal | Transisi yang Diizinkan |
|-------------|--------------------------|
| `pending`   | `confirmed`, `cancelled` |
| `confirmed` | `completed`, `cancelled` |
| `completed` | *(tidak ada — terminal)* |
| `cancelled` | *(tidak ada — terminal)* |

**Aturan turunan:**

- **Mengubah ke status yang sama** → error *"Status sudah {label}."*
- **Transisi tidak sah** → error *"Transisi {current} → {target} tidak diizinkan."*
- **Transisi ganda saat bersamaan** (race condition) → dicek ulang di dalam transaksi → *"Transisi status tidak lagi valid."*
- **Nomor antrean (BR-03)**:
  - Diberikan **otomatis saat status berubah menjadi `confirmed`** dan belum punya nomor.
  - Nomor dihitung per **klinik per hari** (lanjutan nomor terbesar + 1).
  - Amunisi konsistensi memakai **advisory lock** basis data agar dua dokter yang
    mengonfirmasi bersamaan tidak mendapat nomor kembar.

**Tombol aksi yang tampil di UI sesuai peran:**

| Peran | Ubah status | Batalkan |
|-------|:-----------:|:--------:|
| Admin (semua janji) | ✔ | ✔ |
| Dokter (antrean hari ini) | ✔ | ✖ (tidak ada tombol) |
| Pasien (janji sendiri) | ✖ | hanya bila `pending` |

---

## 8. Aturan Bisnis Penting

| Kode | Aturan | Implementasi |
|------|--------|--------------|
| BR-01 | State machine janji temu | `AppointmentStatus::allowedTransitions()` |
| BR-02 | Anti **double-booking** (dokter+slot) | Index unik parsial `appointments_no_double_booking` → diterjemahkan jadi error 422 ramah |
| BR-03 | Nomor antrean per klinik per hari | Diberikan saat `confirmed`; `pg_advisory_xact_lock` agar aman dari race condition |
| BR-04 | **Isolasi tenant** (klinik) | Global scope `BelongsToClinic` + cek tenant di setiap policy |
| BR-05 | **SOAP wajib** saat finalisasi rekam medis | Validasi `Store/UpdateMedicalRecordRequest` |
| BR-06 | Hanya dokter yang boleh membuat rekam medis | `MedicalRecordPolicy::create` + `StoreMedicalRecordRequest::authorize` |
| BR-07 | Rekam medis **immutable** (tidak bisa dihapus) | `MedicalRecordPolicy::delete = false`; `destroy()` selalu 403 |
| BR-10 | Setiap buat/ubah rekam medis dicatat **audit log** | `MedicalRecordObserver` (KLK-026) |
| BR-11 | Narasi SOAP **terenkripsi** saat disimpan | Cast `encrypted` pada field SOAP |

---

## 9. Glosarium & Istilah

| Istilah | Arti |
|---------|------|
| Admin | Peran pengelola klinik; satu-satunya peran yang bisa CRUD pasien & melihat laporan. |
| Dokter | Peran tenaga medis; mengisi rekam medis dan mengelola antrean hari ini. |
| Pasien | Peran pengguna layanan; mendaftar, booking janji, melihat riwayatnya sendiri. |
| SOAP | Subjective, Objective, Assessment, Plan — struktur catatan medis. |
| ICD-10 | Klasifikasi diagnosis medis internasional (versi 10). |
| Rekam Medis | Catatan berobat pasien; bersifat immutable. |
| Janji Temu (Appointment) | Slot kunjungan pasien ke dokter di waktu tertentu. |
| No. Antrean | Nomor urut pasien per klinik per hari, diberikan saat janji dikonfirmasi. |
| Double-booking | Dua janji pada dokter + slot yang sama; dicegah di basis data. |
| Tenant | Isolasi data per klinik; setiap klinik hanya melihat datanya sendiri. |
| Soft Delete | Penghapusan logis — baris tetap ada di DB, hanya tersembunyi. |
| Cross-Tenant | Admin platform (tanpa klinik) yang dapat melewati batas klinik. |

---

*Dokumen ini mengikuti perilaku aktual aplikasi (routes, controllers, policies,
enums, dan halaman React). Jika terjadi perubahan kode, perbarui panduan ini agar tetap sinkron.*