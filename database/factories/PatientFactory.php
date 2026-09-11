<?php

namespace Database\Factories;

use App\Models\Clinic;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Patient>
 */
class PatientFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'clinic_id' => Clinic::factory(),
            'nik' => fake()->unique()->numerify('################'),
            'name' => fake()->name(),
            'date_of_birth' => fake()->dateTimeBetween('-80 years', '-1 year')->format('Y-m-d'),
            'gender' => fake()->randomElement(['L', 'P']),
            'blood_type' => fake()->randomElement(['A', 'B', 'AB', 'O']),
            'allergies' => fake()->optional()->sentence(),
            'phone' => fake()->numerify('08##########'),
            'address' => fake()->address(),
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_phone' => fake()->numerify('08##########'),
            'user_id' => null,
        ];
    }
}
