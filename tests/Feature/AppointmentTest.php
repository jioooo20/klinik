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
}
