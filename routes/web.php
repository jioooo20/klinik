<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\MedicalRecordController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('welcome');

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'clinic'])->group(function () {
    // Generic dashboard redirector + per-role dashboards.
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/admin', [DashboardController::class, 'index'])->name('dashboard.admin');
    Route::get('/dashboard/doctor', [DashboardController::class, 'index'])->name('dashboard.doctor');
    Route::get('/dashboard/patient', [DashboardController::class, 'index'])->name('dashboard.patient');

    // Patients (KLK-019): admin may create/update/delete, dokter is read-only.
    // NOTE: static `/patients/create` MUST be declared BEFORE the dynamic
    // `/patients/{patient}` route, otherwise `create` is bound to the {patient}
    // parameter and triggers a bigint cast error (SQLSTATE 22P02).
    Route::middleware('role:admin')->group(function () {
        Route::get('/patients/create', [PatientController::class, 'create'])->name('patients.create');
    });

    Route::middleware('role:admin,dokter')->group(function () {
        Route::get('/patients', [PatientController::class, 'index'])->name('patients.index');
        Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('patients.show');
    });

    Route::middleware('role:admin')->group(function () {
        Route::post('/patients', [PatientController::class, 'store'])->name('patients.store');
        Route::get('/patients/{patient}/edit', [PatientController::class, 'edit'])->name('patients.edit');
        Route::put('/patients/{patient}', [PatientController::class, 'update'])->name('patients.update');
        Route::delete('/patients/{patient}', [PatientController::class, 'destroy'])->name('patients.destroy');

        // Doctors.
        Route::get('/doctors', [DoctorController::class, 'index'])->name('doctors.index');
    });

    // Medical records (Phase 5 — KLK-023..KLK-027).
    // Detail is also reachable by the owning patient, so authorization is
    // delegated to MedicalRecordPolicy::view rather than the role middleware.
    Route::get('/medical-records/{record}', [MedicalRecordController::class, 'show'])
        ->name('medical-records.show');

    Route::middleware('role:admin,dokter')->group(function () {
        Route::get('/patients/{patient}/records', [MedicalRecordController::class, 'index'])
            ->name('patients.records.index');
        Route::get('/medical-records/{record}/edit', [MedicalRecordController::class, 'edit'])
            ->name('medical-records.edit');
        Route::put('/medical-records/{record}', [MedicalRecordController::class, 'update'])
            ->name('medical-records.update');
    });

    Route::middleware('role:dokter')->group(function () {
        Route::get('/patients/{patient}/records/create', [MedicalRecordController::class, 'create'])
            ->name('patients.records.create');
        Route::post('/patients/{patient}/records', [MedicalRecordController::class, 'store'])
            ->name('patients.records.store');
    });

    // Pasien self-service profile (Profil Saya).
    // The Patient row is resolved from the authenticated user inside the
    // controller — no {patient} parameter is accepted from the URL, so a
    // pasien cannot target someone else's record.
    Route::middleware('role:pasien')->group(function () {
        Route::get('/profile', [PatientController::class, 'editProfile'])->name('profile.edit');
        Route::put('/profile', [PatientController::class, 'updateProfile'])->name('profile.update');
    });

    // Appointments (Phase 6 — KLK-028..KLK-031).
    Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');

    Route::middleware('role:pasien,admin')->group(function () {
        Route::get('/appointments/create', [AppointmentController::class, 'create'])->name('appointments.create');
        Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
    });

    Route::middleware('role:dokter,admin')->group(function () {
        Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.status');
    });

    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy');

    // Reports (Phase 7 — KLK-033).
    Route::middleware('role:admin,dokter')->group(function () {
        Route::get('/reports/visits', [ReportController::class, 'visits'])->name('reports.visits');
    });
});
