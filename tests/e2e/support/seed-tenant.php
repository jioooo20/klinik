<?php

/**
 * E2E-only fixture: a second clinic ("Klinik B") with its own admin, doctor
 * and patient, so the multi-tenant isolation spec can prove clinic A cannot
 * read clinic B records.
 *
 * Run with APP_ENV=e2e so it targets the isolated `klinik_e2e` database.
 */

require __DIR__.'/../../../vendor/autoload.php';

$app = require_once __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

$clinic = Clinic::factory()->create([
    'name' => 'Klinik B Terpisah',
    'slug' => 'klinik-b-terpisah',
]);

$adminB = User::factory()->admin()->create([
    'clinic_id' => $clinic->id,
    'name' => 'Admin Klinik B',
    'email' => 'admin.b@klinik.test',
    'password' => Hash::make('password'),
]);
$adminB->assignRole(UserRole::Admin->value);

$doctorUserB = User::factory()->doctor()->create([
    'clinic_id' => $clinic->id,
    'name' => 'dr. Clara B',
    'email' => 'dokter.b@klinik.test',
    'password' => Hash::make('password'),
]);
$doctorUserB->assignRole(UserRole::Dokter->value);

$doctorB = Doctor::factory()->create([
    'user_id' => $doctorUserB->id,
    'clinic_id' => $clinic->id,
    'specialty' => 'Umum',
    'str_number' => 'STR-B0000001',
]);

$patientB = Patient::factory()->create([
    'clinic_id' => $clinic->id,
    'name' => 'Pasien Klinik B',
    'nik' => '3201999999990002',
]);

$appointmentB = Appointment::create([
    'clinic_id' => $clinic->id,
    'patient_id' => $patientB->id,
    'doctor_id' => $doctorB->id,
    'scheduled_at' => now()->addDays(2)->setTime(10, 0),
    'status' => AppointmentStatus::Completed,
    'queue_number' => 1,
    'complaint' => 'Kontrol klinik B',
    'created_by' => $adminB->id,
]);

MedicalRecord::create([
    'clinic_id' => $clinic->id,
    'patient_id' => $patientB->id,
    'doctor_id' => $doctorB->id,
    'appointment_id' => $appointmentB->id,
    'visited_at' => $appointmentB->scheduled_at,
    'subjective' => 'Keluhan klinik B.',
    'objective' => 'KU baik.',
    'assessment' => 'Sehat klinik B.',
    'plan' => 'Observasi.',
    'icd10_code' => 'Z00',
    'vitals' => ['sistolik' => 110, 'diastolik' => 70, 'suhu' => 36.5, 'nadi' => 78, 'respirasi' => 18],
    'prescription' => [],
]);

fwrite(STDOUT, "Tenant fixture seeded: clinic B (admin.b@klinik.test / dokter.b@klinik.test).\n");