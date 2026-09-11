<?php

namespace Database\Seeders;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with demo data.
     */
    public function run(): void
    {
        // Roles & permissions must exist before any user is assigned a role.
        $this->call(RolePermissionSeeder::class);

        // ICD-10 reference dataset (EMR-06) — global, clinic-independent.
        $this->call(Icd10Seeder::class);

        $clinic = Clinic::factory()->create([
            'name' => 'Klinik Sehat Sentosa',
            'slug' => 'klinik-sehat-sentosa',
        ]);

        $admin = User::factory()->admin()->create([
            'clinic_id' => $clinic->id,
            'name' => 'Admin Klinik',
            'email' => 'admin@klinik.test',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole(UserRole::Admin->value);

        // Two doctors, each with a linked user.
        $doctors = collect(['dr. Budi Santoso', 'dr. Siti Aminah'])->map(function (string $name, int $i) use ($clinic) {
            $user = User::factory()->doctor()->create([
                'clinic_id' => $clinic->id,
                'name' => $name,
                'email' => 'dokter'.($i + 1).'@klinik.test',
                'password' => Hash::make('password'),
            ]);
            $user->assignRole(UserRole::Dokter->value);

            return Doctor::factory()->create([
                'user_id' => $user->id,
                'clinic_id' => $clinic->id,
                'specialty' => $i === 0 ? 'Umum' : 'Anak',
                'str_number' => 'STR-'.str_pad((string) ($i + 1), 8, '0', STR_PAD_LEFT),
            ]);
        });

        // Patient account linked to one patient record.
        $patientUser = User::factory()->create([
            'clinic_id' => $clinic->id,
            'name' => 'Pasien Contoh',
            'email' => 'pasien@klinik.test',
            'password' => Hash::make('password'),
            'role' => UserRole::Pasien,
        ]);
        $patientUser->assignRole(UserRole::Pasien->value);

        $patient = Patient::factory()->create([
            'clinic_id' => $clinic->id,
            'user_id' => $patientUser->id,
            'name' => 'Pasien Contoh',
            'nik' => '3201234567890001',
        ]);

        // 9 more patients (total 10).
        Patient::factory(9)->create(['clinic_id' => $clinic->id]);

        $patients = Patient::query()->where('clinic_id', $clinic->id)->get();

        $queue = 1;
        foreach ($patients as $i => $p) {
            // Deterministic schedule guarantees a unique (doctor_id, scheduled_at)
            // pair, respecting the appointments_no_double_booking index (BR-02).
            $doctor = $doctors->get($i % $doctors->count());

            $appointment = Appointment::create([
                'clinic_id' => $clinic->id,
                'patient_id' => $p->id,
                'doctor_id' => $doctor->id,
                'scheduled_at' => now()->addDays(intdiv($i, $doctors->count()))->setTime(9, 0),
                'status' => AppointmentStatus::Completed,
                'queue_number' => $queue++,
                'complaint' => 'Kontrol rutin',
                'created_by' => $admin->id,
            ]);

            MedicalRecord::create([
                'clinic_id' => $clinic->id,
                'patient_id' => $p->id,
                'doctor_id' => $doctor->id,
                'appointment_id' => $appointment->id,
                'visited_at' => $appointment->scheduled_at,
                'subjective' => 'Pasien merasa lemas sejak 2 hari.',
                'objective' => 'KU baik, TD 120/80, suhu 36.8C.',
                'assessment' => 'Observasi febris.',
                'plan' => 'Istirahat, hidrasi, paracetamol bila perlu.',
                'icd10_code' => 'R50',
                'vitals' => ['tensi' => '120/80', 'suhu' => 36.8, 'nadi' => 80, 'spo2' => 98],
                'prescription' => [['name' => 'Paracetamol', 'dose' => '500mg', 'frequency' => '3x1']],
            ]);
        }

        $this->command->info('Seeded: 1 clinic, 1 admin, 2 doctors, 1 patient user, 10 patients, 10 appointments, 10 medical records.');
    }
}
