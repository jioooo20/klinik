<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    private function makeDoctor(Clinic $clinic): Doctor
    {
        $user = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);

        return Doctor::factory()->create([
            'user_id' => $user->id,
            'clinic_id' => $clinic->id,
            'is_active' => true,
        ]);
    }

    public function test_patient_can_book_an_appointment(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = $this->makeDoctor($clinic);
        $patientUser = User::factory()->create([
            'clinic_id' => $clinic->id,
            'role' => UserRole::Pasien,
        ]);
        $patient = Patient::factory()->create([
            'clinic_id' => $clinic->id,
            'user_id' => $patientUser->id,
        ]);

        $response = $this->actingAs($patientUser)->post('/appointments', [
            'doctor_id' => $doctor->id,
            'scheduled_at' => now()->addDay()->format('Y-m-d\TH:i:s'),
            'complaint' => 'Demam',
        ]);

        $response->assertRedirect('/appointments');
        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'status' => AppointmentStatus::Pending->value,
        ]);
    }

    public function test_double_booking_returns_422(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = $this->makeDoctor($clinic);
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        $scheduled = now()->addDay()->format('Y-m-d\TH:i:s');

        Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'scheduled_at' => $scheduled,
            'status' => AppointmentStatus::Pending,
        ]);

        $response = $this->actingAs($admin)->post('/appointments', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'scheduled_at' => $scheduled,
        ]);

        $response->assertSessionHasErrors('scheduled_at');
        $this->assertDatabaseCount('appointments', 1);
    }

    public function test_status_transition_follows_br01(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = $this->makeDoctor($clinic);
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        $appointment = Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'status' => AppointmentStatus::Pending,
        ]);

        // pending -> confirmed: allowed.
        $this->actingAs($admin)
            ->patch("/appointments/{$appointment->id}/status", ['status' => 'confirmed'])
            ->assertRedirect('/appointments');

        $this->assertSame(AppointmentStatus::Confirmed, $appointment->fresh()->status);
        $this->assertNotNull($appointment->fresh()->queue_number);

        // completed -> cancelled: illegal (backward), must 422.
        $appointment->update(['status' => AppointmentStatus::Completed]);

        $this->actingAs($admin)
            ->patch("/appointments/{$appointment->id}/status", ['status' => 'cancelled'])
            ->assertSessionHasErrors('status');
    }

    public function test_patient_only_sees_own_appointments(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = $this->makeDoctor($clinic);

        $patientUser = User::factory()->create(['clinic_id' => $clinic->id, 'role' => UserRole::Pasien]);
        $ownPatient = Patient::factory()->create(['clinic_id' => $clinic->id, 'user_id' => $patientUser->id]);
        $otherPatient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $ownPatient->id,
        ]);
        Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $otherPatient->id,
        ]);

        $this->actingAs($patientUser)
            ->get('/appointments')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Appointments/Index')
                ->has('appointments.data', 1));
    }

    public function test_patient_cannot_change_status(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = $this->makeDoctor($clinic);

        $patientUser = User::factory()->create(['clinic_id' => $clinic->id, 'role' => UserRole::Pasien]);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id, 'user_id' => $patientUser->id]);

        $appointment = Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);

        $this->actingAs($patientUser)
            ->patch("/appointments/{$appointment->id}/status", ['status' => 'confirmed'])
            ->assertForbidden();
    }

    /**
     * Regression: jadwal yang dikirim dengan offset WIB eksplisit harus
     * tersimpan sebagai instan yang benar dan dibaca kembali sebagai jam lokal
     * yang sama. Sebelum perbaikan, string telanjang "YYYY-MM-DDT11:00"
     * diartikan UTC sehingga muncul sebagai 18:00 WIB.
     *
     * Tanggal sengaja DITURUNKAN relatif terhadap now() (bukan tanggal absolut
     * yang di-hard-code) supaya tes tidak menjadi "time bomb": aturan validasi
     * after:now akan menolak jadwal yang sudah lewat, sehingga tanggal mati
     * akan membuat tes ini gagal begitu dinding jam melewatinya.
     */
    public function test_wib_slot_is_stored_and_read_back_as_the_same_local_time(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = $this->makeDoctor($clinic);
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        // Pukul 11:00 WIB, dua hari dari sekarang (cukup jauh di masa depan
        // sehingga after:now tidak pernah flaky), dihitung di zona aplikasi.
        $local = now()->addDays(2)->setTime(11, 0, 0);

        // Nilai yang diharapkan diturunkan dari basis yang sama, bukan
        // di-hard-code, sehingga tidak ada tanggal kedaluwarsa baru.
        $submitted = $local->format('Y-m-d\TH:i:sP');            // 11:00:00+07:00
        $expectedUtc = $local->copy()->utc()->toIso8601String(); // 04:00:00+00:00
        $expectedLocal = $local->format('Y-m-d H:i');            // YYYY-MM-DD 11:00
        $expectedOffsetIso = $local->toIso8601String();          // ...T11:00:00+07:00

        $response = $this->actingAs($admin)->post('/appointments', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            // Pukul 11:00 WIB dinyatakan eksplisit dengan offset +07:00.
            'scheduled_at' => $submitted,
            'complaint' => 'Round-trip timezone',
        ]);

        $response->assertRedirect('/appointments');

        $appointment = Appointment::withoutClinicScope()->latest('id')->firstOrFail();

        // Instan absolut yang tersimpan = 04:00 UTC (= 11:00 WIB).
        $this->assertSame(
            $expectedUtc,
            $appointment->scheduled_at->utc()->toIso8601String(),
        );

        // Dibaca kembali di zona aplikasi (Asia/Jakarta) => tetap 11:00 lokal.
        $this->assertSame('Asia/Jakarta', config('app.timezone'));
        $this->assertSame(
            $expectedLocal,
            $appointment->scheduled_at->format('Y-m-d H:i'),
        );

        // Bentuk yang dikirim ke frontend (toIso8601String) merender 11:00 WIB
        // sehingga new Date(...).toLocaleString('id-ID') menampilkan 11.00.
        $this->assertSame(
            $expectedOffsetIso,
            $appointment->scheduled_at->toIso8601String(),
        );
    }

    /**
     * Regression: kunci slot "sudah terisi" yang disajikan ke form booking
     * (format 'Y-m-d\TH:i') harus tetap cocok dengan kunci yang dibangun di
     * klien ("${date}T${slot}"), agar slot yang sudah dibooking tetap disabled.
     */
    public function test_taken_slot_key_matches_the_client_wall_clock_key(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = $this->makeDoctor($clinic);
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);

        // Tanggal diturunkan relatif terhadap now() (bukan tanggal absolut
        // yang di-hard-code) supaya tes ini tidak kedaluwarsa di kemudian hari.
        $local = now()->addDays(2)->setTime(11, 0, 0);

        // Kunci yang diharapkan dibangun dari basis yang sama, memakai format
        // 'Y-m-d\TH:i' yang dipakai server untuk takenSlots.
        $expectedSlotKey = $local->format('Y-m-d\TH:i');

        Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => $local->format('Y-m-d\TH:i:sP'),
            'status' => AppointmentStatus::Pending,
        ]);

        $this->actingAs($admin)
            ->get('/appointments/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Appointments/Create')
                ->where(
                    'takenSlots',
                    fn ($slots) => collect($slots)->contains(
                        fn ($slot) => $slot['doctor_id'] === $doctor->id
                            && $slot['scheduled_at'] === $expectedSlotKey,
                    ),
                ));
    }
}
