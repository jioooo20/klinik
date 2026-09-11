<?php

namespace App\Http\Controllers;

use App\Actions\CreateAppointment;
use App\Actions\TransitionAppointmentStatus;
use App\Enums\AppointmentStatus;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentStatusRequest;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Appointment booking (Phase 6 — KLK-028..KLK-031).
 *
 * Thin controller: validation in Form Requests, domain rules in Action
 * classes, authorization in AppointmentPolicy. Tenant scoping comes from the
 * Appointment model's BelongsToClinic global scope.
 */
class AppointmentController extends Controller
{
    /**
     * Role-aware listing (KLK-031): dokter sees today's queue, pasien sees
     * their own appointments, admin sees everything in the clinic.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Appointment::class);

        $user = $request->user();

        $query = Appointment::query()
            ->with(['doctor.user', 'patient'])
            ->latest('scheduled_at');

        if ($user->hasAppRole('dokter') && ! $user->hasAppRole('admin')) {
            $doctor = $user->doctor;
            $query->where('doctor_id', $doctor?->id ?? 0)
                ->whereDate('scheduled_at', Carbon::today());
        } elseif ($user->hasAppRole('pasien')) {
            $query->whereHas('patient', fn ($q) => $q->where('user_id', $user->id));
        }

        $appointments = $query
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Appointment $appointment) => [
                'id' => $appointment->id,
                'scheduled_at' => $appointment->scheduled_at?->toIso8601String(),
                'status' => $appointment->status instanceof \BackedEnum
                    ? $appointment->status->value
                    : $appointment->status,
                'status_label' => $appointment->status?->label(),
                'queue_number' => $appointment->queue_number,
                'complaint' => $appointment->complaint,
                'doctor' => $appointment->doctor?->user?->name,
                'doctor_id' => $appointment->doctor_id,
                'patient' => $appointment->patient?->name,
                'patient_id' => $appointment->patient_id,
                'can_update_status' => $user->can('updateStatus', $appointment),
                'can_delete' => $user->can('delete', $appointment),
            ]);

        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments,
            'role' => $this->primaryRole($user),
            'statuses' => array_map(
                fn (AppointmentStatus $status): array => ['value' => $status->value, 'label' => $status->label()],
                AppointmentStatus::cases(),
            ),
        ]);
    }

    /**
     * Booking form (KLK-029): available doctors + already-taken slots.
     */
    public function create(Request $request): Response
    {
        $this->authorize('create', Appointment::class);

        $user = $request->user();
        $clinicId = $user->clinic_id;

        $doctors = Doctor::query()
            ->where('clinic_id', $clinicId)
            ->where('is_active', true)
            ->with('user')
            ->get()
            ->map(fn (Doctor $doctor): array => [
                'id' => $doctor->id,
                'name' => $doctor->user?->name ?? 'Dokter',
                'specialty' => $doctor->specialty,
            ]);

        // Taken slots for the next 30 days, per doctor, excluding cancelled.
        $takenSlots = Appointment::query()
            ->where('clinic_id', $clinicId)
            ->where('status', '!=', AppointmentStatus::Cancelled->value)
            ->whereBetween('scheduled_at', [Carbon::today(), Carbon::today()->addDays(30)])
            ->get(['doctor_id', 'scheduled_at'])
            ->map(fn (Appointment $appointment): array => [
                'doctor_id' => $appointment->doctor_id,
                'scheduled_at' => $appointment->scheduled_at?->format('Y-m-d\TH:i'),
            ]);

        return Inertia::render('Appointments/Create', [
            'doctors' => $doctors,
            'takenSlots' => $takenSlots,
            'isAdmin' => $user->hasAppRole('admin'),
        ]);
    }

    /**
     * Persist a booking (KLK-028/029). BR-02 is enforced transactionally.
     */
    public function store(StoreAppointmentRequest $request, CreateAppointment $action): RedirectResponse
    {
        $appointment = $action->handle([
            'clinic_id' => $request->user()->clinic_id,
            'patient_id' => $request->patientId(),
            'doctor_id' => (int) $request->validated('doctor_id'),
            'scheduled_at' => $request->validated('scheduled_at'),
            'complaint' => $request->validated('complaint'),
            'created_by' => $request->user()->id,
        ]);

        return redirect()
            ->route('appointments.index')
            ->with('success', 'Janji temu berhasil dibuat.');
    }

    /**
     * Status transition endpoint (KLK-030) — BR-01 state machine.
     */
    public function updateStatus(
        UpdateAppointmentStatusRequest $request,
        Appointment $appointment,
        TransitionAppointmentStatus $action,
    ): RedirectResponse {
        $appointment = $action->handle($appointment, $request->status());

        return redirect()
            ->route('appointments.index')
            ->with('success', "Status diubah menjadi {$appointment->status->label()}.");
    }

    /**
     * Cancel/delete (KLK-031). Patients may cancel their own pending booking;
     * admin may remove any. Cancel is modelled as a soft status change when
     * the appointment is still active, otherwise the row is deleted.
     */
    public function destroy(Appointment $appointment): RedirectResponse
    {
        $this->authorize('delete', $appointment);

        if (! $appointment->status->isTerminal()) {
            $appointment->update(['status' => AppointmentStatus::Cancelled]);

            return redirect()
                ->route('appointments.index')
                ->with('success', 'Janji temu dibatalkan.');
        }

        $appointment->delete();

        return redirect()
            ->route('appointments.index')
            ->with('success', 'Janji temu dihapus.');
    }

    private function primaryRole(User $user): string
    {
        return match (true) {
            $user->hasAppRole('admin') => 'admin',
            $user->hasAppRole('dokter') => 'dokter',
            default => 'pasien',
        };
    }
}
