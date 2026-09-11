<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Services\StatisticsService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly StatisticsService $statistics) {}

    /**
     * Render the dashboard for the authenticated user's role (KLK-033).
     *
     * - admin  : clinic-wide KPIs + top diagnoses + today's appointment mix
     * - dokter : personal KPIs + today's queue + shortcut to rekam medis
     * - pasien : personal visit summary + next appointment
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $clinicId = (int) $user->clinic_id;

        $role = $user->role instanceof \BackedEnum
            ? $user->role->value
            : (string) $user->role;

        $period = (string) $request->query('period', 'month');
        if (! in_array($period, ['today', 'week', 'month', 'year'], true)) {
            $period = 'month';
        }

        return match ($role) {
            'admin' => Inertia::render('Dashboard/Admin', $this->adminProps($clinicId, $period)),
            'dokter' => Inertia::render('Dashboard/Doctor', $this->doctorProps($user, $clinicId, $period)),
            default => Inertia::render('Dashboard/Patient', $this->patientProps($user, $clinicId)),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function adminProps(int $clinicId, string $period): array
    {
        return [
            'stats' => $this->statistics->getVisitStats($clinicId, $period),
            'topDiagnoses' => $this->statistics->getTopDiagnoses($clinicId, 8),
            'todayAppointments' => Appointment::withoutClinicScope()
                ->where('clinic_id', $clinicId)
                ->whereDate('scheduled_at', CarbonImmutable::today())
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
            'totals' => [
                'patients' => Patient::withoutClinicScope()->where('clinic_id', $clinicId)->count(),
                'doctors' => Doctor::query()->where('clinic_id', $clinicId)->where('is_active', true)->count(),
            ],
            'filters' => ['period' => $period],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function doctorProps($user, int $clinicId, string $period): array
    {
        $doctor = Doctor::query()->where('user_id', $user->id)->first();
        $doctorId = $doctor?->id;

        return [
            'stats' => $this->statistics->getVisitStats($clinicId, $period, $doctorId),
            'queue' => $doctorId !== null
                ? $this->statistics->getDoctorQueue($clinicId, $doctorId)
                : collect(),
            'topDiagnoses' => $doctorId !== null
                ? $this->statistics->getTopDiagnoses($clinicId, 8, $doctorId)
                : collect(),
            'filters' => ['period' => $period],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function patientProps($user, int $clinicId): array
    {
        $patient = Patient::withoutClinicScope()
            ->where('clinic_id', $clinicId)
            ->where('user_id', $user->id)
            ->first();

        if ($patient === null) {
            return [
                'summary' => [
                    'total_visits' => 0,
                    'last_visit' => null,
                    'next_appointment' => null,
                ],
            ];
        }

        return [
            'summary' => $this->statistics->getPatientSummary($patient->id),
        ];
    }
}
