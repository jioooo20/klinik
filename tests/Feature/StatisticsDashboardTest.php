<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\User;
use App\Services\StatisticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * KLK-036 / DASH-06 — dashboard & statistics feature tests.
 *
 * Closes the deferred DASH-06 task: aggregate numbers must match the seeded
 * data, statistics must be isolated per clinic, and non-authorised roles must
 * be rejected (403) from the reports and dashboard surfaces.
 */
class StatisticsDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function makeDoctor(Clinic $clinic, ?User $user = null): Doctor
    {
        $user ??= User::factory()->doctor()->create(['clinic_id' => $clinic->id]);

        return Doctor::factory()->create([
            'user_id' => $user->id,
            'clinic_id' => $clinic->id,
            'is_active' => true,
        ]);
    }

    public function test_visit_stats_counts_only_own_clinic(): void
    {
        $clinicA = Clinic::factory()->create();
        $clinicB = Clinic::factory()->create();

        $doctorA = $this->makeDoctor($clinicA);
        $doctorB = $this->makeDoctor($clinicB);
        $patientA = Patient::factory()->create(['clinic_id' => $clinicA->id]);
        $patientB = Patient::factory()->create(['clinic_id' => $clinicB->id]);

        $base = now()->startOfMinute();

        // Distinct slots per doctor are required by the BR-02 partial unique
        // index `appointments_no_double_booking` on (doctor_id, scheduled_at).

        // Clinic A: 2 completed + 1 pending = 3 visits.
        Appointment::factory()->create([
            'clinic_id' => $clinicA->id,
            'doctor_id' => $doctorA->id,
            'patient_id' => $patientA->id,
            'scheduled_at' => $base->copy()->addMinutes(1),
            'status' => AppointmentStatus::Completed,
        ]);
        Appointment::factory()->create([
            'clinic_id' => $clinicA->id,
            'doctor_id' => $doctorA->id,
            'patient_id' => $patientA->id,
            'scheduled_at' => $base->copy()->addMinutes(2),
            'status' => AppointmentStatus::Completed,
        ]);
        Appointment::factory()->create([
            'clinic_id' => $clinicA->id,
            'doctor_id' => $doctorA->id,
            'patient_id' => $patientA->id,
            'scheduled_at' => $base->copy()->addMinutes(3),
            'status' => AppointmentStatus::Pending,
        ]);

        // Clinic B: 5 visits — must never leak into clinic A's stats.
        foreach (range(1, 5) as $offset) {
            Appointment::factory()->create([
                'clinic_id' => $clinicB->id,
                'doctor_id' => $doctorB->id,
                'patient_id' => $patientB->id,
                'scheduled_at' => $base->copy()->addMinutes(10 + $offset),
                'status' => AppointmentStatus::Completed,
            ]);
        }

        $stats = app(StatisticsService::class)->getVisitStats($clinicA->id, 'month');

        $this->assertSame(3, $stats['total_visits']);
        $this->assertSame(2, $stats['completed_appointments']);
        $this->assertSame(1, $stats['pending_appointments']);
    }

    public function test_top_diagnoses_are_frequency_ordered_and_isolated(): void
    {
        $clinicA = Clinic::factory()->create();
        $clinicB = Clinic::factory()->create();

        $doctorA = $this->makeDoctor($clinicA);
        $doctorB = $this->makeDoctor($clinicB);
        $patientA = Patient::factory()->create(['clinic_id' => $clinicA->id]);
        $patientB = Patient::factory()->create(['clinic_id' => $clinicB->id]);

        // Clinic A: J00 x3, A09 x1.
        MedicalRecord::factory()->count(3)->create([
            'clinic_id' => $clinicA->id,
            'doctor_id' => $doctorA->id,
            'patient_id' => $patientA->id,
            'icd10_code' => 'J00',
        ]);
        MedicalRecord::factory()->create([
            'clinic_id' => $clinicA->id,
            'doctor_id' => $doctorA->id,
            'patient_id' => $patientA->id,
            'icd10_code' => 'A09',
        ]);

        // Clinic B: K30 x5 — must not appear.
        MedicalRecord::factory()->count(5)->create([
            'clinic_id' => $clinicB->id,
            'doctor_id' => $doctorB->id,
            'patient_id' => $patientB->id,
            'icd10_code' => 'K30',
        ]);

        $top = app(StatisticsService::class)->getTopDiagnoses($clinicA->id, 10);

        $this->assertCount(2, $top);
        $this->assertSame('J00', $top[0]['icd10_code']);
        $this->assertSame(3, $top[0]['total']);
        $this->assertSame('A09', $top[1]['icd10_code']);
        $this->assertSame(1, $top[1]['total']);
    }

    public function test_patient_history_merges_appointments_and_records(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = $this->makeDoctor($clinic);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'scheduled_at' => now()->subDays(3),
        ]);
        MedicalRecord::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'visited_at' => now()->subDays(2),
        ]);

        $history = app(StatisticsService::class)->getPatientHistory($patient->id);

        $this->assertCount(1, $history['appointments']);
        $this->assertCount(1, $history['records']);
        $this->assertCount(2, $history['timeline']);
        // Newest first: the medical record (visited_at -2d) precedes the appointment (-3d).
        $this->assertSame('record', $history['timeline'][0]['type']);
    }

    public function test_confirmation_assigns_sequential_queue_numbers_per_day(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = $this->makeDoctor($clinic);
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        $first = Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'scheduled_at' => now()->setTime(9, 0),
            'status' => AppointmentStatus::Pending,
            'queue_number' => null,
        ]);
        $second = Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'scheduled_at' => now()->setTime(10, 0),
            'status' => AppointmentStatus::Pending,
            'queue_number' => null,
        ]);

        $this->actingAs($admin)
            ->patch("/appointments/{$first->id}/status", ['status' => 'confirmed'])
            ->assertRedirect('/appointments');
        $this->actingAs($admin)
            ->patch("/appointments/{$second->id}/status", ['status' => 'confirmed'])
            ->assertRedirect('/appointments');

        $this->assertSame(1, $first->fresh()->queue_number);
        $this->assertSame(2, $second->fresh()->queue_number);
    }

    public function test_admin_dashboard_renders_aggregate_props(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = $this->makeDoctor($clinic);
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'scheduled_at' => now()->setTime(8, 0),
            'status' => AppointmentStatus::Completed,
        ]);

        $this->actingAs($admin)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Admin')
                ->where('stats.total_visits', 1)
                ->where('stats.completed_appointments', 1)
                ->has('topDiagnoses')
                ->where('totals.patients', 1));
    }

    public function test_doctor_dashboard_renders_queue_props(): void
    {
        $clinic = Clinic::factory()->create();
        $doctorUser = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $doctor = $this->makeDoctor($clinic, $doctorUser);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'scheduled_at' => now()->setTime(9, 30),
            'status' => AppointmentStatus::Confirmed,
            'queue_number' => 1,
        ]);

        $this->actingAs($doctorUser)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Doctor')
                ->has('queue', 1)
                ->has('stats'));
    }

    public function test_patient_dashboard_renders_personal_summary(): void
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
        $patient->update(['user_id' => $patientUser->id]);

        MedicalRecord::factory()->create([
            'clinic_id' => $clinic->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'visited_at' => now()->subDay(),
        ]);

        $this->actingAs($patientUser)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Patient')
                ->where('summary.total_visits', 1));
    }

    public function test_patient_cannot_access_visits_report(): void
    {
        $clinic = Clinic::factory()->create();
        $patientUser = User::factory()->create([
            'clinic_id' => $clinic->id,
            'role' => UserRole::Pasien,
        ]);

        $this->actingAs($patientUser)
            ->get('/reports/visits')
            ->assertForbidden();
    }

    public function test_admin_can_access_visits_report(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);

        $this->actingAs($admin)
            ->get('/reports/visits')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Visits')
                ->has('appointments.data')
                ->has('doctors'));
    }

    public function test_appointments_are_clinic_isolated(): void
    {
        $clinicA = Clinic::factory()->create();
        $clinicB = Clinic::factory()->create();

        $adminA = User::factory()->admin()->create(['clinic_id' => $clinicA->id]);
        $doctorB = $this->makeDoctor($clinicB);
        $patientB = Patient::factory()->create(['clinic_id' => $clinicB->id]);

        // Only clinic B has an appointment.
        Appointment::factory()->create([
            'clinic_id' => $clinicB->id,
            'doctor_id' => $doctorB->id,
            'patient_id' => $patientB->id,
        ]);

        $this->actingAs($adminA)
            ->get('/appointments')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Appointments/Index')
                ->has('appointments.data', 0));
    }

    /**
     * Regression: verify that each role can reach its own dashboard route
     * and receives the correct Inertia component (KLK-033).
     */
    public function test_admin_reaches_admin_dashboard_component(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = User::factory()->admin()->create(['clinic_id' => $clinic->id]);

        $this->actingAs($admin)
            ->get('/dashboard/admin')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard/Admin'));
    }

    public function test_doctor_reaches_doctor_dashboard_component(): void
    {
        $clinic = Clinic::factory()->create();
        $doctorUser = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $this->makeDoctor($clinic, $doctorUser);

        $this->actingAs($doctorUser)
            ->get('/dashboard/doctor')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard/Doctor'));
    }

    public function test_patient_reaches_patient_dashboard_component(): void
    {
        $clinic = Clinic::factory()->create();
        $patientUser = User::factory()->create([
            'clinic_id' => $clinic->id,
            'role' => UserRole::Pasien,
        ]);

        $this->actingAs($patientUser)
            ->get('/dashboard/patient')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard/Patient'));
    }

    public function test_dashboard_urls_are_role_aware_and_not_privilege_escalation(): void
    {
        $clinic = Clinic::factory()->create();
        $patientUser = User::factory()->create([
            'clinic_id' => $clinic->id,
            'role' => UserRole::Pasien,
        ]);

        // The dashboard routes are intentionally NOT gated by the `role`
        // middleware: DashboardController@index is role-aware and always
        // renders the component matching the authenticated user's role.
        // A pasien hitting /dashboard/admin therefore still gets the patient
        // dashboard — no cross-role data leak and no 500 (bug regression guard).
        $this->actingAs($patientUser)
            ->get('/dashboard/admin')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard/Patient'));
    }
}
