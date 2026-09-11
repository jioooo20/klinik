<?php

namespace App\Actions;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Apply an appointment status transition (BR-01) and, on confirmation,
 * assign a per-clinic-per-day queue number (BR-03).
 *
 * The queue number is generated inside the same transaction with a row lock
 * on the existing rows for that clinic/day, so concurrent confirms cannot
 * collide on the partial unique index `appointments_queue_unique`.
 */
class TransitionAppointmentStatus
{
    public function handle(Appointment $appointment, AppointmentStatus $target): Appointment
    {
        $current = $appointment->status;

        if ($current === $target) {
            throw ValidationException::withMessages([
                'status' => "Status sudah {$target->label()}.",
            ]);
        }

        if (! $current->canTransitionTo($target)) {
            throw ValidationException::withMessages([
                'status' => "Transisi {$current->label()} → {$target->label()} tidak diizinkan.",
            ]);
        }

        return DB::transaction(function () use ($appointment, $target): Appointment {
            $appointment->refresh();

            // Re-check inside the transaction to guard against a concurrent
            // transition having already moved the row.
            if (! $appointment->status->canTransitionTo($target)) {
                throw ValidationException::withMessages([
                    'status' => 'Transisi status tidak lagi valid.',
                ]);
            }

            $appointment->status = $target;

            if ($target === AppointmentStatus::Confirmed && $appointment->queue_number === null) {
                $appointment->queue_number = $this->nextQueueNumber($appointment);
            }

            $appointment->save();

            return $appointment;
        });
    }

    /**
     * Next queue number for the appointment's clinic on the scheduled date.
     *
     * PostgreSQL rejects `MAX(...) ... FOR UPDATE`, so instead of a row lock we
     * take a transaction-scoped advisory lock keyed on clinic+day. Concurrent
     * confirms for the same clinic/day serialise here, then the MAX is computed
     * safely; the lock releases automatically when the transaction commits.
     */
    private function nextQueueNumber(Appointment $appointment): int
    {
        $date = $appointment->scheduled_at->toDateString();

        DB::select('SELECT pg_advisory_xact_lock(hashtext(?))', [
            'appointments_queue:'.$appointment->clinic_id.':'.$date,
        ]);

        $last = Appointment::withoutClinicScope()
            ->where('clinic_id', $appointment->clinic_id)
            ->whereDate('scheduled_at', $date)
            ->whereNotNull('queue_number')
            ->max('queue_number');

        return ((int) $last) + 1;
    }
}
