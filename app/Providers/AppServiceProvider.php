<?php

namespace App\Providers;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Observers\MedicalRecordObserver;
use App\Policies\AppointmentPolicy;
use App\Policies\DoctorPolicy;
use App\Policies\MedicalRecordPolicy;
use App\Policies\PatientPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // AUTH-08: login throttled to 5 attempts/minute per email + IP (KLK-024).
        // E2E bypass: disable rate limiting when APP_ENV=e2e to avoid 429 during test runs.
        RateLimiter::for('login', function (Request $request): Limit {
            if (app()->environment('e2e')) {
                return Limit::none();
            }

            return Limit::perMinute(5)
                ->by(mb_strtolower((string) $request->input('email')).'|'.$request->ip());
        });

        Gate::policy(Patient::class, PatientPolicy::class);
        Gate::policy(MedicalRecord::class, MedicalRecordPolicy::class);
        Gate::policy(Appointment::class, AppointmentPolicy::class);
        Gate::policy(Doctor::class, DoctorPolicy::class);

        // KLK-026: audit log every medical record create/update (BR-10).
        MedicalRecord::observe(MedicalRecordObserver::class);
    }
}
