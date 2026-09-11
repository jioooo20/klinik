<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => UserRole::Dokter]),
            'clinic_id' => Clinic::factory(),
            'specialty' => fake()->randomElement(['Umum', 'Anak', 'Gigi', 'Kandungan', 'Penyakit Dalam']),
            'str_number' => 'STR-'.fake()->unique()->numerify('##########'),
            'is_active' => true,
        ];
    }
}
