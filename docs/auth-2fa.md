# Autentikasi: Rate Limit & 2FA Opsional (AUTH-08)

Dokumen ini mencatat hardening login untuk aplikasi Klinik.

## Rate limiting login

Login dibatasi **5 percobaan per menit**, di-key berdasarkan kombinasi
`email` (di-lowercase) + alamat IP pengirim.

- Limiter bernama `login` didaftarkan di `app/Providers/AppServiceProvider.php`
  (`RateLimiter::for('login', ...)`).
- Route `POST /login` memakai middleware `throttle:login` (`routes/auth.php`).
- Saat limit terlampaui, Laravel mengembalikan HTTP 429 (Too Many Requests)
  dan pengguna harus menunggu jendela 1 menit berikutnya.

## Anti-enumerasi akun

Kegagalan autentikasi selalu memakai pesan generik:

> These credentials do not match our records.

Pesan yang sama dikembalikan baik untuk email yang tidak terdaftar maupun
password yang salah, sehingga tidak membocorkan keberadaan akun.

## 2FA opsional (persiapan)

2FA belum diaktifkan secara default; login tetap satu-langkah (email + password).
Untuk mengaktifkannya di kemudian hari:

1. Tambah kolom `two_factor_secret` (nullable, cast `encrypted`) dan
   `two_factor_confirmed_at` (nullable, datetime) pada tabel `users`.
2. Setelah `Auth::attempt` sukses di
   `App\Http\Controllers\Auth\AuthenticatedSessionController::store`,
   arahkan pengguna ke challenge TOTP sebelum `session()->regenerate()`
   final.
3. Sediakan halaman pengaturan 2FA di area Admin/Dokter, plus route
   verifikasi TOTP yang dilindungi `auth`.
4. Sertakan kode pemulihan (recovery codes) yang disimpan terenkripsi.

Sampai fitur ini diaktifkan, tidak ada perubahan perilaku bagi pengguna.