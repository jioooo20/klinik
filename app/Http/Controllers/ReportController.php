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

class ReportController extends Controller
{
    public function __construct(private readonly StatisticsService $statistics) {}

    /**
     * Detailed visit report, filterable by date range, doctor and status
     * (KLK-033 / DASH-05).
     */
    public function visits(Request $request): Response
    {
        $this->authorize('viewAny', Patient::class);

        $user = $request->user();
        $clinicId = (int) $user->clinic_id;

        $from = $request->query('from')
            ? CarbonImmutable::parse((string) $request->query('from'))->startOfDay()
            : CarbonImmutable::now()->startOfMonth();
        $to = $request->query('to')
            ? CarbonImmutable::parse((string) $request->query('to'))->endOfDay()
            : CarbonImmutable::now()->endOfMonth();

        $doctorId = $request->query('doctor_id') ? (int) $request->query('doctor_id') : null;
        $status = $request->query('status');

        $appointments = Appointment::withoutClinicScope()
            ->with(['patient', 'doctor.user'])
            ->where('clinic_id', $clinicId)
            ->whereBetween('scheduled_at', [$from, $to])
            ->when($doctorId !== null, fn ($q) => $q->where('doctor_id', $doctorId))
            ->when($status !== null && $status !== '', fn ($q) => $q->where('status', $status))
            ->orderByDesc('scheduled_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Appointment $appointment) => [
                'id' => $appointment->id,
                'scheduled_at' => $appointment->scheduled_at?->toIso8601String(),
                'status' => $appointment->status instanceof \BackedEnum
                    ? $appointment->status->value
                    : $appointment->status,
                'queue_number' => $appointment->queue_number,
                'patient' => $appointment->patient?->name,
                'doctor' => $appointment->doctor?->user?->name,
            ]);

        $doctors = Doctor::query()
            ->with('user')
            ->where('clinic_id', $clinicId)
            ->orderBy('id')
            ->get()
            ->map(fn (Doctor $doctor) => [
                'id' => $doctor->id,
                'name' => $doctor->user?->name,
            ]);

        return Inertia::render('Reports/Visits', [
            'appointments' => $appointments,
            'doctors' => $doctors,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'doctor_id' => $doctorId,
                'status' => $status,
            ],
        ]);
    }
}
