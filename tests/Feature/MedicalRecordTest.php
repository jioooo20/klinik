<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * EMR-08 — rekam medis feature tests: authorization, audit trail, encryption
 * and immutability (BR-05, BR-07, BR-10, BR-11).
 */
class MedicalRecordTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Doctor}
     */
    private function makeDoctor(Clinic $clinic): array
    {
        $user = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $doctor = Doctor::factory()->create([
            'user_id' => $user->id,
            'clinic_id' => $clinic->id,
        ]);

        return [$user, $doctor];
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        return [
            'visited_at' => now()->toDateTimeString(),
            'subjective' => 'Pasien mengeluh demam sejak dua hari.',
            'objective' => 'Suhu 38.5C, faring hiperemis.',
            'assessment' => 'Suspek demam tifoid.',
            'plan' => 'Istirahat, cairan, antibiotik sesuai indikasi.',
            'vitals' => ['tensi' => '120/80', 'suhu' => '38.5'],
        ];
    }

    public function test_doctor_can_create_medical_record(): void
    {
        $clinic = Clinic::factory()->create();
        [$user] = $this->makeDoctor($clinic);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        $this->actingAs($user);

        $this->post("/patients/{$patient->id}/records", $this->payload())
            ->assertRedirect();

        $this->assertDatabaseCount('medical_records', 1);
        $this->assertDatabaseHas('medical_records', [
            'patient_id' => $patient->id,
            'clinic_id' => $clinic->id,
        ]);
    }

    public function test_non_doctor_cannot_create_medical_record(): void
    {
        $clinic = Clinic::factory()->create();
        $patientUser = User::factory()->create([
            'clinic_id' => $clinic->id,
            'role' => UserRole::Pasien,
        ]);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        $this->actingAs($patientUser);

        $this->post("/patients/{$patient->id}/records", $this->payload())
            ->assertForbidden();

        $this->assertDatabaseCount('medical_records', 0);
    }

    public function test_patient_can_only_view_own_record(): void
    {
        $clinic = Clinic::factory()->create();
        [$doctorUser] = $this->makeDoctor($clinic);

        $ownerUser = User::factory()->create([
            'clinic_id' => $clinic->id,
            'role' => UserRole::Pasien,
        ]);
        $otherUser = User::factory()->create([
            'clinic_id' => $clinic->id,
            'role' => UserRole::Pasien,
        ]);

        $ownerPatient = Patient::factory()->create([
            'clinic_id' => $clinic->id,
            'user_id' => $ownerUser->id,
        ]);

        // Ensure the patient row actually has user_id set (factory may ignore it).
        $ownerPatient->update(['user_id' => $ownerUser->id]);

        $record = MedicalRecord::factory()->create([
            'clinic_id' => $clinic->id,
            'patient_id' => $ownerPatient->id,
            'doctor_id' => $doctorUser->doctor->id,
        ]);

        $this->actingAs($ownerUser);
        $this->get("/medical-records/{$record->id}")->assertOk();

        $this->actingAs($otherUser);
        $this->get("/medical-records/{$record->id}")->assertForbidden();
    }

    public function test_creating_record_writes_audit_log(): void
    {
        $clinic = Clinic::factory()->create();
        [$user] = $this->makeDoctor($clinic);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        $this->actingAs($user);
        $this->post("/patients/{$patient->id}/records", $this->payload());

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'medical_record',
            'event' => 'created',
            'causer_id' => $user->id,
        ]);
    }

    public function test_soap_fields_are_encrypted_at_rest(): void
    {
        $clinic = Clinic::factory()->create();
        [$user] = $this->makeDoctor($clinic);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        $this->actingAs($user);
        $this->post("/patients/{$patient->id}/records", $this->payload());

        $raw = DB::table('medical_records')->value('subjective');

        $this->assertNotNull($raw);
        $this->assertNotSame('Pasien mengeluh demam sejak dua hari.', $raw);
        $this->assertSame(
            'Pasien mengeluh demam sejak dua hari.',
            MedicalRecord::withoutClinicScope()->firstOrFail()->subjective,
        );
    }

    public function test_medical_record_cannot_be_deleted(): void
    {
        $clinic = Clinic::factory()->create();
        [$user, $doctor] = $this->makeDoctor($clinic);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        $record = MedicalRecord::factory()->create([
            'clinic_id' => $clinic->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
        ]);

        $this->actingAs($user);

        $this->assertFalse($user->can('delete', $record));
    }
}
