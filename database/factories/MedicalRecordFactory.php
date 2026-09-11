<?php

namespace Database\Factories;

use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MedicalRecord>
 */
class MedicalRecordFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'clinic_id' => Clinic::factory(),
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'appointment_id' => null,
            'visited_at' => fake()->dateTimeBetween('-1 year', 'now'),
            'subjective' => fake()->sentence(),
            'objective' => fake()->sentence(),
            'assessment' => fake()->sentence(),
            'plan' => fake()->sentence(),
            'icd10_code' => fake()->randomElement(['J00', 'A09', 'K30', 'M54', 'I10']),
            'vitals' => [
                'tensi' => fake()->numberBetween(100, 140).'/'.fake()->numberBetween(60, 90),
                'suhu' => fake()->randomFloat(1, 36, 39),
                'nadi' => fake()->numberBetween(60, 100),
                'rr' => fake()->numberBetween(14, 22),
                'spo2' => fake()->numberBetween(95, 100),
                'bb' => fake()->randomFloat(1, 40, 90),
                'tb' => fake()->numberBetween(140, 180),
            ],
            'prescription' => [
                ['name' => 'Paracetamol', 'dose' => '500mg', 'frequency' => '3x1'],
            ],
        ];
    }
}
