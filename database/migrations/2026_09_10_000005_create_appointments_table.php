<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->timestamp('scheduled_at');
            $table->string('status', 20)->default('pending');
            $table->integer('queue_number')->nullable();
            $table->text('complaint')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['doctor_id', 'scheduled_at']);
            $table->index(['clinic_id', 'scheduled_at']);
            $table->index(['clinic_id', 'status']);
        });

        // BR-02: no double-booking for the same doctor at the same time (non-cancelled only).
        DB::statement(
            "CREATE UNIQUE INDEX appointments_no_double_booking
             ON appointments (doctor_id, scheduled_at)
             WHERE status <> 'cancelled'"
        );

        // BR-03: queue number unique per clinic per day (when assigned).
        DB::statement(
            'CREATE UNIQUE INDEX appointments_queue_unique
             ON appointments (clinic_id, (scheduled_at::date), queue_number)
             WHERE queue_number IS NOT NULL'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
