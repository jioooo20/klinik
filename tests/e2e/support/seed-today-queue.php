<?php

/**
 * E2E-only fixture: a TODAY appointment for dokter1 that has NO medical record.
 *
 * The seeded demo data creates a medical record for every appointment, so the
 * dokter dashboard's "Antrean Hari Ini" table has no actionable row and the
 * "Isi Rekam Medis" button never renders. This fixture adds exactly one
 * unrecorded appointment for today so the regression spec can assert the
 * button's href points at patients.records.create with the PATIENT id.
 *
 * Run with APP_ENV=e2e so it targets the isolated `klinik_e2e` database.
 */

require __DIR__.'/../../../vendor/autoload.php';

$app = require_once __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;

$doctorUser = User::query()->where('email', 'dokter1@klinik.test')->firstOrFail();
$doctor = Doctor::query()->where('user_id', $doctorUser->id)->firstOrFail();

$patient = Patient::query()
    ->where('clinic_id', $doctor->clinic_id)
    ->orderBy('id')
    ->firstOrFail();

// 10:30 today (the seeder uses 09:00) — no clash with the unique
// (doctor_id, scheduled_at) index. queue_number stays null so the
// per-clinic/per-day queue-number unique index is not involved.
$appointment = Appointment::create([
    'clinic_id' => $doctor->clinic_id,
    'patient_id' => $patient->id,
    'doctor_id' => $doctor->id,
    'scheduled_at' => now()->setTime(10, 30),
    'status' => AppointmentStatus::Pending,
    'queue_number' => null,
    'complaint' => 'E2E fixture: antrean tanpa rekam medis',
    'created_by' => $doctorUser->id,
]);

fwrite(
    STDOUT,
    "Queue fixture seeded: appointment {$appointment->id} (patient {$patient->id}, doctor {$doctor->id}).\n"
);