<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorController extends Controller
{
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
                'specialty' => $doctor->specialty,
                'str_number' => $doctor->str_number,
                'is_active' => $doctor->is_active,
            ]);

        return Inertia::render('Doctors/Index', [
            'doctors' => $doctors,
        ]);
    }
}
