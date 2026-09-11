<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClinicIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_clinic_a_user_cannot_access_clinic_b_patient(): void
    {
        $clinicA = Clinic::factory()->create();
        $clinicB = Clinic::factory()->create();

        $patientA = Patient::factory()->create(['clinic_id' => $clinicA->id]);
        $patientB = Patient::factory()->create(['clinic_id' => $clinicB->id]);

        $userA = User::factory()->admin()->create(['clinic_id' => $clinicA->id]);
        $this->actingAs($userA);

        // Cross-tenant access is denied. The `BelongsToClinic` global scope
        // filters route-model binding to the actor's clinic, so a foreign
        // record is a 404; the policy would return 403 if it were reachable.
        // Either way the actor must NOT receive a 200 with foreign data.
        $response = $this->getJson("/patients/{$patientB->id}");
        $this->assertContains($response->status(), [403, 404]);
    }

    public function test_clinic_a_user_cannot_access_clinic_b_medical_record(): void
    {
        $clinicA = Clinic::factory()->create();
        $clinicB = Clinic::factory()->create();

        $patientA = Patient::factory()->create(['clinic_id' => $clinicA->id]);
        $patientB = Patient::factory()->create(['clinic_id' => $clinicB->id]);

        // Assuming medical records are created via factory or controller
        // For this test, we rely on the global scope filtering the query
        $recordB = MedicalRecord::factory()->create([
            'clinic_id' => $clinicB->id,
            'patient_id' => $patientB->id,
            'doctor_id' => Doctor::factory()->create(['clinic_id' => $clinicB->id])->id,
        ]);

        $userA = User::factory()->admin()->create(['clinic_id' => $clinicA->id]);
        $this->actingAs($userA);

        $response = $this->getJson("/medical-records/{$recordB->id}");
        $this->assertContains($response->status(), [403, 404]);
    }
}
