<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Dashboard & statistics aggregation (Phase 7 — KLK-032).
 *
 * All queries aggregate at the database level (COUNT / GROUP BY) and filter
 * explicitly by clinic_id, so they are covered by the composite indexes:
 *   - appointments(clinic_id, status)
 *   - appointments(clinic_id, scheduled_at)
 *   - medical_records(clinic_id, visited_at)
 *   - medical_records(icd10_code)
 *   - patients(clinic_id, name)
 *
 * The tenant global scope is bypassed and replaced with an explicit
 * `clinic_id` predicate so callers can pass a clinic id (e.g. from a queue
 * job or a super-admin report) without relying on Auth context.
 */
class StatisticsService
{
    /**
     * Visit KPIs for a clinic over a period.
     *
     * @return array{period: string, start: string, end: string, total_visits: int, new_patients: int, completed_appointments: int, pending_appointments: int}
     */
    public function getVisitStats(int $clinicId, string $period = 'month', ?int $doctorId = null): array
    {
        [$start, $end] = $this->resolvePeriod($period);

        $appointments = Appointment::withoutClinicScope()
            ->where('clinic_id', $clinicId)
            ->whereBetween('scheduled_at', [$start, $end])
            ->when($doctorId !== null, fn ($q) => $q->where('doctor_id', $doctorId));

        $totalVisits = (clone $appointments)->count();

        $completed = (clone $appointments)
            ->where('status', AppointmentStatus::Completed)
            ->count();

        $pending = (clone $appointments)
            ->whereIn('status', [AppointmentStatus::Pending, AppointmentStatus::Confirmed])
            ->count();

        $newPatients = Patient::withoutClinicScope()
            ->where('clinic_id', $clinicId)
            ->whereBetween('created_at', [$start, $end])
            ->count();

        return [
            'period' => $period,
            'start' => $start->toIso8601String(),
            'end' => $end->toIso8601String(),
            'total_visits' => $totalVisits,
            'new_patients' => $newPatients,
            'completed_appointments' => $completed,
            'pending_appointments' => $pending,
        ];
    }

    /**
     * Top ICD-10 diagnoses by frequency (KLK-032).
     *
     * @return Collection<int, array{icd10_code: string, total: int}>
     */
    public function getTopDiagnoses(int $clinicId, int $limit = 10, ?int $doctorId = null): Collection
    {
        return MedicalRecord::withoutClinicScope()
            ->where('clinic_id', $clinicId)
            ->whereNotNull('icd10_code')
            ->where('icd10_code', '<>', '')
            ->when($doctorId !== null, fn ($q) => $q->where('doctor_id', $doctorId))
            ->selectRaw('icd10_code, COUNT(*) as total')
            ->groupBy('icd10_code')
            ->orderByDesc('total')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'icd10_code' => (string) $row->icd10_code,
                'total' => (int) $row->total,
            ]);
    }

    /**
     * Chronological history for a single patient (KLK-034).
     *
     * Appointments and medical records are merged into one timeline sorted
     * by event time DESC. Relations are eager loaded to avoid N+1.
     *
     * @return array{appointments: Collection<int, array<string, mixed>>, records: Collection<int, array<string, mixed>>, timeline: Collection<int, array<string, mixed>>}
     */
    public function getPatientHistory(int $patientId): array
    {
        $appointments = Appointment::withoutClinicScope()
            ->with('doctor.user')
            ->where('patient_id', $patientId)
            ->orderByDesc('scheduled_at')
            ->get()
            ->map(fn (Appointment $appointment) => [
                'type' => 'appointment',
                'id' => $appointment->id,
                'at' => $appointment->scheduled_at?->toIso8601String(),
                'status' => $appointment->status instanceof \BackedEnum
                    ? $appointment->status->value
                    : $appointment->status,
                'queue_number' => $appointment->queue_number,
                'complaint' => $appointment->complaint,
                'doctor' => $appointment->doctor?->user?->name,
                'diagnosis' => null,
                'icd10_code' => null,
            ]);

        $records = MedicalRecord::withoutClinicScope()
            ->with('doctor.user')
            ->where('patient_id', $patientId)
            ->orderByDesc('visited_at')
            ->get()
            ->map(fn (MedicalRecord $record) => [
                'type' => 'record',
                'id' => $record->id,
                'at' => $record->visited_at?->toIso8601String(),
                'status' => null,
                'queue_number' => null,
                'complaint' => null,
                'doctor' => $record->doctor?->user?->name,
                'diagnosis' => $record->assessment,
                'icd10_code' => $record->icd10_code,
            ]);

        $timeline = $appointments
            ->concat($records)
            ->sortByDesc(fn (array $item) => $item['at'] ?? '')
            ->values();

        return [
            'appointments' => $appointments,
            'records' => $records,
            'timeline' => $timeline,
        ];
    }

    /**
     * Today's queue for a doctor (KLK-033 dokter dashboard).
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getDoctorQueue(int $clinicId, int $doctorId): Collection
    {
        return Appointment::withoutClinicScope()
            ->with(['patient', 'medicalRecord'])
            ->where('clinic_id', $clinicId)
            ->where('doctor_id', $doctorId)
            ->whereDate('scheduled_at', CarbonImmutable::today())
            ->orderBy('queue_number')
            ->get()
            ->map(fn (Appointment $appointment) => [
                'id' => $appointment->id,
                'scheduled_at' => $appointment->scheduled_at?->toIso8601String(),
                'status' => $appointment->status instanceof \BackedEnum
                    ? $appointment->status->value
                    : $appointment->status,
                'queue_number' => $appointment->queue_number,
                'patient' => $appointment->patient?->name,
                'has_record' => $appointment->medicalRecord !== null,
            ]);
    }

    /**
     * Personal summary for a patient (KLK-033 pasien dashboard).
     *
     * @return array{total_visits: int, last_visit: ?string, next_appointment: ?array<string, mixed>}
     */
    public function getPatientSummary(int $patientId): array
    {
        $totalVisits = MedicalRecord::withoutClinicScope()
            ->where('patient_id', $patientId)
            ->count();

        $lastVisit = MedicalRecord::withoutClinicScope()
            ->where('patient_id', $patientId)
            ->max('visited_at');

        $next = Appointment::withoutClinicScope()
            ->with('doctor.user')
            ->where('patient_id', $patientId)
            ->where('scheduled_at', '>=', CarbonImmutable::now())
            ->whereIn('status', [AppointmentStatus::Pending, AppointmentStatus::Confirmed])
            ->orderBy('scheduled_at')
            ->first();

        return [
            'total_visits' => $totalVisits,
            'last_visit' => $lastVisit,
            'next_appointment' => $next ? [
                'id' => $next->id,
                'scheduled_at' => $next->scheduled_at?->toIso8601String(),
                'status' => $next->status instanceof \BackedEnum ? $next->status->value : $next->status,
                'doctor' => $next->doctor?->user?->name,
                'queue_number' => $next->queue_number,
            ] : null,
        ];
    }

    /**
     * Resolve a human period label into a [start, end] date range.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function resolvePeriod(string $period): array
    {
        $now = CarbonImmutable::now();

        return match ($period) {
            'today' => [$now->startOfDay(), $now->endOfDay()],
            'week' => [$now->startOfWeek(), $now->endOfWeek()],
            'year' => [$now->startOfYear(), $now->endOfYear()],
            default => [$now->startOfMonth(), $now->endOfMonth()],
        };
    }
}
