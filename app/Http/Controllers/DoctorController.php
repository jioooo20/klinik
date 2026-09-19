<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\StoreDoctorRequest;
use App\Http\Requests\UpdateDoctorRequest;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DoctorController extends Controller
{
    /**
     * Daftar dokter pada klinik admin yang sedang login.
     *
     * Model Doctor tidak punya global clinic scope, jadi scoping dilakukan
     * eksplisit dengan `where('clinic_id', ...)`.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Doctor::class);

        $doctors = Doctor::query()
            ->with('user')
            ->where('clinic_id', $request->user()->clinic_id)
            ->orderBy('id')
            ->paginate(15)
            ->through(fn (Doctor $doctor) => [
                'id' => $doctor->id,
                'name' => $doctor->user?->name,
                'email' => $doctor->user?->email,
                'specialty' => $doctor->specialty,
                'str_number' => $doctor->str_number,
                'is_active' => $doctor->is_active,
            ]);

        return Inertia::render('Doctors/Index', [
            'doctors' => $doctors,
        ]);
    }

    /**
     * Form tambah dokter baru.
     */
    public function create(): Response
    {
        $this->authorize('create', Doctor::class);

        return Inertia::render('Doctors/Create');
    }

    /**
     * Simpan dokter baru: buat AKUN (users) + data dokter (doctors) sekaligus.
     *
     * Kedua penulisan dibungkus satu DB::transaction() agar kegagalan tidak
     * meninggalkan user tanpa baris doctor (orphan). User diberi peran Dokter
     * lewat enum, bukan string mentah.
     */
    public function store(StoreDoctorRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $data): void {
            $user = User::create([
                'clinic_id' => $request->user()->clinic_id,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
                'role' => UserRole::Dokter,
            ]);

            Doctor::create([
                'user_id' => $user->id,
                'clinic_id' => $request->user()->clinic_id,
                'specialty' => $data['specialty'] ?? null,
                'str_number' => $data['str_number'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);
        });

        return redirect()
            ->route('doctors.index')
            ->with('success', 'Dokter berhasil ditambahkan.');
    }

    /**
     * Form edit dokter. Data nama/email/phone berasal dari akun user terkait.
     */
    public function edit(Doctor $doctor): Response
    {
        $this->authorize('update', $doctor);

        $doctor->loadMissing('user');

        return Inertia::render('Doctors/Edit', [
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->user?->name,
                'email' => $doctor->user?->email,
                'phone' => $doctor->user?->phone,
                'specialty' => $doctor->specialty,
                'str_number' => $doctor->str_number,
                'is_active' => $doctor->is_active,
            ],
        ]);
    }

    /**
     * Perbarui dokter: akun user + data dokter dalam satu transaksi.
     *
     * Kata sandi hanya ditulis bila dikirim non-kosong (kosong = biarkan).
     * Tidak ada destroy(): menonaktifkan dokter dilakukan dengan is_active=false.
     */
    public function update(UpdateDoctorRequest $request, Doctor $doctor): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $doctor, $data): void {
            $user = $doctor->user;

            if ($user !== null) {
                $user->name = $data['name'];
                $user->email = $data['email'];
                $user->phone = $data['phone'] ?? null;

                // Biarkan kata sandi lama bila tidak ada kata sandi baru.
                if ($request->hasNewPassword()) {
                    $user->password = $data['password'];
                }

                $user->save();
            }

            $doctor->update([
                'specialty' => $data['specialty'] ?? null,
                'str_number' => $data['str_number'] ?? null,
                'is_active' => $data['is_active'],
            ]);
        });

        return redirect()
            ->route('doctors.index')
            ->with('success', 'Data dokter berhasil diperbarui.');
    }
}
