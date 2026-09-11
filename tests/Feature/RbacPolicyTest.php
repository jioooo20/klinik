<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class RbacPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_doctor_can_create_medical_record(): void
    {
        $clinic = Clinic::factory()->create();
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);
        $doctorUser = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $doctor = Doctor::factory()->create(['user_id' => $doctorUser->id, 'clinic_id' => $clinic->id]);

        $this->actingAs($doctorUser);

        $this->assertTrue($doctorUser->can('create', MedicalRecord::class));
    }

    public function test_patient_cannot_create_medical_record(): void
    {
        $clinic = Clinic::factory()->create();
        $patientUser = User::factory()->create(['clinic_id' => $clinic->id, 'role' => UserRole::Pasien]);

        $this->actingAs($patientUser);

        $this->assertFalse($patientUser->can('create', MedicalRecord::class));
    }

    public function test_admin_can_manage_patients(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        $this->actingAs($admin);

        $this->assertTrue($admin->can('update', $patient));
        $this->assertTrue($admin->can('delete', $patient));
    }

    public function test_admin_can_view_doctors_index(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);

        $this->actingAs($admin)
            ->get(route('doctors.index'))
            ->assertOk();
    }

    public function test_dokter_cannot_view_doctors_index(): void
    {
        $clinic = Clinic::factory()->create();
        $doctorUser = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        Doctor::factory()->create(['user_id' => $doctorUser->id, 'clinic_id' => $clinic->id]);

        $this->actingAs($doctorUser)
            ->get(route('doctors.index'))
            ->assertForbidden();
    }

    public function test_pasien_cannot_view_doctors_index(): void
    {
        $clinic = Clinic::factory()->create();
        $patientUser = User::factory()->create(['clinic_id' => $clinic->id, 'role' => UserRole::Pasien]);

        $this->actingAs($patientUser)
            ->get(route('doctors.index'))
            ->assertForbidden();
    }

    public function test_doctor_policy_is_reachable_through_gate(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);
        $doctorUser = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $patientUser = User::factory()->create(['clinic_id' => $clinic->id, 'role' => UserRole::Pasien]);

        $this->assertTrue(Gate::forUser($admin)->allows('viewAny', Doctor::class));
        $this->assertFalse(Gate::forUser($doctorUser)->allows('viewAny', Doctor::class));
        $this->assertFalse(Gate::forUser($patientUser)->allows('viewAny', Doctor::class));
    }
}
