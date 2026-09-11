<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seed roles and permissions derived from the UserRole enum.
     *
     * Permissions follow the "<resource>.<action>" convention and stay
     * aligned with the app's role enum so guards/checks never drift.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            // Clinic administration
            'clinic.view',
            'clinic.manage',
            'user.manage',
            // Doctors
            'doctor.view',
            'doctor.manage',
            // Patients
            'patient.view',
            'patient.manage',
            // Appointments
            'appointment.view',
            'appointment.create',
            'appointment.manage',
            // Medical records
            'medical-record.view',
            'medical-record.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // Role -> permissions matrix.
        $matrix = [
            UserRole::Admin->value => $permissions,
            UserRole::Dokter->value => [
                'doctor.view',
                'patient.view',
                'appointment.view',
                'appointment.manage',
                'medical-record.view',
                'medical-record.manage',
            ],
            UserRole::Pasien->value => [
                'appointment.view',
                'appointment.create',
                'medical-record.view',
            ],
        ];

        foreach ($matrix as $roleName => $rolePermissions) {
            $role = Role::findOrCreate($roleName, 'web');
            $role->syncPermissions($rolePermissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->command?->info(sprintf(
            'Seeded: %d roles, %d permissions.',
            count($matrix),
            count($permissions),
        ));
    }
}
