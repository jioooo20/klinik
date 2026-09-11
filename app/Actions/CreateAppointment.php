<?php

namespace App\Actions;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Create an appointment inside a transaction, translating the BR-02 unique
 * partial index violation (appointments_no_double_booking) into a friendly
 * 422 validation error instead of a 500.
 */
class CreateAppointment
{
    /**
     * @param  array{clinic_id: int, patient_id: int, doctor_id: int, scheduled_at: string, complaint?: ?string, created_by: int}  $data
     */
    public function handle(array $data): Appointment
    {
        try {
            return DB::transaction(function () use ($data): Appointment {
                return Appointment::create([
                    ...$data,
                    'status' => AppointmentStatus::Pending,
                ]);
            });
        } catch (QueryException $exception) {
            if ($this->isDoubleBooking($exception)) {
                throw ValidationException::withMessages([
                    'scheduled_at' => 'Jadwal dokter ini sudah terisi. Silakan pilih slot lain.',
                ]);
            }

            throw $exception;
        }
    }

    /**
     * Detect the BR-02 partial unique index violation (SQLSTATE 23505).
     */
    private function isDoubleBooking(QueryException $exception): bool
    {
        // PostgreSQL unique violation.
        if ($exception->getCode() !== '23505') {
            return false;
        }

        $message = $exception->getMessage();

        return str_contains($message, 'appointments_no_double_booking')
            || (str_contains($message, 'doctor_id') && str_contains($message, 'scheduled_at'));
    }
}
