<?php

/**
 * E2E-only fixture: a patient in clinic A with a NULL NIK.
 *
 * The demo seeder always sets a NIK (`DatabaseSeeder.php:74`,
 * `PatientFactory.php:21`), so the `Belum ada NIK` fallback on
 * `/patients/{id}` (resources/js/Pages/Patients/Show.tsx:79) could never be
 * exercised end-to-end. This fixture adds exactly one patient with
 * `nik => null` so the regression spec can assert the fallback renders — and,
 * conversely, that a patient WITH a NIK renders the monospace NIK instead.
 *
 * `patients.nik` is nullable (migration 2026_09_10_000004:17) and the
 * unique index is (clinic_id, nik); PostgreSQL treats NULLs as distinct, so
 * a NULL NIK does not collide with the seeded patients.
 *
 * Run with APP_ENV=e2e so it targets the isolated `klinik_e2e` database.
 */

require __DIR__.'/../../../vendor/autoload.php';

$app = require_once __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Clinic;
use App\Models\Patient;

$clinic = Clinic::query()->where('slug', 'klinik-sehat-sentosa')->firstOrFail();

// A deterministic, recognisable name so the spec can resolve the id via the
// patients search instead of hard-coding a row id. `user_id => null` keeps
// this fixture out of the pasien login flow entirely.
$patient = Patient::create([
    'clinic_id' => $clinic->id,
    'nik' => null,
    'name' => 'Pasien Tanpa NIK',
    'date_of_birth' => '1990-01-01',
    'gender' => 'male',
    'blood_type' => null,
    'allergies' => null,
    'phone' => null,
    'address' => null,
    'emergency_contact_name' => null,
    'emergency_contact_phone' => null,
    'user_id' => null,
]);

fwrite(
    STDOUT,
    "Null-NIK fixture seeded: patient {$patient->id} (clinic {$clinic->id}, nik null).\n"
);
