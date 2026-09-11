<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the patient registration screen.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Register a new patient and assign the `pasien` role.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = DB::transaction(function () use ($data): User {
            $clinicId = Clinic::query()->orderBy('id')->value('id');

            $user = User::create([
                'clinic_id' => $clinicId,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
                'role' => UserRole::Pasien,
            ]);

            // Self-registration always yields the pasien role (spatie).
            $user->assignRole(UserRole::Pasien->value);

            if ($clinicId !== null) {
                Patient::create([
                    'clinic_id' => $clinicId,
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'date_of_birth' => '1970-01-01',
                    'gender' => 'male',
                    'phone' => $user->phone,
                ]);
            }

            return $user;
        });

        Auth::login($user);

        $request->session()->regenerate();

        return redirect()->route('dashboard.patient');
    }
}
