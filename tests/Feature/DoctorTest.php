<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class DoctorTest extends TestCase
{
    use RefreshDatabase;

    private function admin(?Clinic $clinic = null): User
    {
        return User::factory()->admin()->create([
            'clinic_id' => ($clinic ?? Clinic::factory()->create())->id,
        ]);
    }

    // ---------------------------------------------------------------------
    // Create
    // ---------------------------------------------------------------------

    public function test_admin_can_create_a_doctor_with_account_and_row(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = $this->admin($clinic);

        $response = $this->actingAs($admin)->post(route('doctors.store'), [
            'name' => 'dr. Sinta Wijaya',
            'email' => 'sinta@example.com',
            'phone' => '081200000111',
            'password' => 'rahasia-kuat-123',
            'password_confirmation' => 'rahasia-kuat-123',
            'specialty' => 'Anak',
            'str_number' => 'STR-1234567890',
            'is_active' => true,
        ]);

        $response->assertRedirect(route('doctors.index'));

        $user = User::where('email', 'sinta@example.com')->firstOrFail();
        $this->assertSame(UserRole::Dokter, $user->role);
        $this->assertSame($clinic->id, $user->clinic_id);
        $this->assertNotSame('rahasia-kuat-123', $user->password, 'Password must be hashed.');
        $this->assertTrue(Hash::check('rahasia-kuat-123', $user->password));

        $doctor = Doctor::where('user_id', $user->id)->firstOrFail();
        $this->assertSame($clinic->id, $doctor->clinic_id);
        $this->assertSame('Anak', $doctor->specialty);
        $this->assertSame('STR-1234567890', $doctor->str_number);
        $this->assertTrue($doctor->is_active);
    }

    public function test_absent_is_active_checkbox_defaults_to_true_on_create(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = $this->admin($clinic);

        // Simulates an unchecked checkbox that is not submitted at all.
        $this->actingAs($admin)->post(route('doctors.store'), [
            'name' => 'dr. No Flag',
            'email' => 'noflag@example.com',
            'password' => 'rahasia-kuat-123',
            'password_confirmation' => 'rahasia-kuat-123',
        ])->assertRedirect(route('doctors.index'));

        $doctor = Doctor::whereHas('user', fn ($q) => $q->where('email', 'noflag@example.com'))->firstOrFail();
        $this->assertTrue($doctor->is_active);
    }

    // ---------------------------------------------------------------------
    // Update
    // ---------------------------------------------------------------------

    public function test_admin_can_update_a_doctor(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = $this->admin($clinic);
        $doctor = Doctor::factory()->create(['clinic_id' => $clinic->id, 'is_active' => true]);

        $this->actingAs($admin)->put(route('doctors.update', $doctor), [
            'name' => 'dr. Diperbarui',
            'email' => 'updated@example.com',
            'phone' => '081999',
            'password' => '',
            'password_confirmation' => '',
            'specialty' => 'Gigi',
            'str_number' => 'STR-UPDATED',
            'is_active' => false,
        ])->assertRedirect(route('doctors.index'));

        $doctor->refresh();
        $this->assertFalse($doctor->is_active);
        $this->assertSame('Gigi', $doctor->specialty);
        $this->assertSame('STR-UPDATED', $doctor->str_number);
        $this->assertSame('dr. Diperbarui', $doctor->user->name);
        $this->assertSame('updated@example.com', $doctor->user->email);
    }

    public function test_blank_password_on_update_preserves_existing_password(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = $this->admin($clinic);
        $user = User::factory()->doctor()->create([
            'clinic_id' => $clinic->id,
            'password' => 'password-lama',
        ]);
        $doctor = Doctor::factory()->create(['clinic_id' => $clinic->id, 'user_id' => $user->id]);

        $hashBefore = $user->fresh()->password;

        $this->actingAs($admin)->put(route('doctors.update', $doctor), [
            'name' => $user->name,
            'email' => $user->email,
            'password' => '',
            'password_confirmation' => '',
            'specialty' => 'Umum',
            'str_number' => null,
            'is_active' => true,
        ])->assertRedirect(route('doctors.index'));

        $this->assertSame($hashBefore, $user->fresh()->password);
        $this->assertTrue(Hash::check('password-lama', $user->fresh()->password));
    }

    public function test_non_empty_password_on_update_changes_password(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = $this->admin($clinic);
        $user = User::factory()->doctor()->create([
            'clinic_id' => $clinic->id,
            'password' => 'password-lama',
        ]);
        $doctor = Doctor::factory()->create(['clinic_id' => $clinic->id, 'user_id' => $user->id]);

        $this->actingAs($admin)->put(route('doctors.update', $doctor), [
            'name' => $user->name,
            'email' => $user->email,
            'password' => 'password-baru-456',
            'password_confirmation' => 'password-baru-456',
            'specialty' => 'Umum',
            'str_number' => null,
            'is_active' => true,
        ])->assertRedirect(route('doctors.index'));

        $this->assertTrue(Hash::check('password-baru-456', $user->fresh()->password));
    }

    // ---------------------------------------------------------------------
    // Clinic isolation
    // ---------------------------------------------------------------------

    public function test_clinic_a_admin_cannot_edit_clinic_b_doctor(): void
    {
        $clinicA = Clinic::factory()->create();
        $clinicB = Clinic::factory()->create();

        $adminA = $this->admin($clinicA);
        $doctorB = Doctor::factory()->create(['clinic_id' => $clinicB->id]);

        // Doctor has no global clinic scope, so the route-model binding resolves
        // the row and the POLICY is what denies it — hence 403 (not 404).
        $this->actingAs($adminA)
            ->get(route('doctors.edit', $doctorB))
            ->assertForbidden();

        $this->actingAs($adminA)->put(route('doctors.update', $doctorB), [
            'name' => 'Hacked',
            'email' => 'hacked@example.com',
            'password' => '',
            'password_confirmation' => '',
            'is_active' => true,
        ])->assertForbidden();

        // The foreign row must be untouched.
        $this->assertSame($clinicB->id, $doctorB->fresh()->clinic_id);
    }

    public function test_clinic_b_doctor_is_absent_from_clinic_a_index(): void
    {
        $clinicA = Clinic::factory()->create();
        $clinicB = Clinic::factory()->create();

        $adminA = $this->admin($clinicA);
        $doctorB = Doctor::factory()->create(['clinic_id' => $clinicB->id]);

        $this->actingAs($adminA)
            ->get(route('doctors.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Doctors/Index')
                ->where('doctors.data', fn ($data) => collect($data)->pluck('id')->doesntContain($doctorB->id)));
    }

    // ---------------------------------------------------------------------
    // RBAC — non-admin roles are forbidden everywhere
    // ---------------------------------------------------------------------

    public function test_non_admin_roles_are_forbidden_from_doctor_management_endpoints(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = Doctor::factory()->create(['clinic_id' => $clinic->id]);
        $doctorUser = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $patientUser = User::factory()->create(['clinic_id' => $clinic->id, 'role' => UserRole::Pasien]);

        foreach ([$doctorUser, $patientUser] as $actor) {
            $this->actingAs($actor)->get(route('doctors.create'))->assertForbidden();
            $this->actingAs($actor)->get(route('doctors.edit', $doctor))->assertForbidden();

            $this->actingAs($actor)->post(route('doctors.store'), [
                'name' => 'x', 'email' => 'x@example.com',
                'password' => 'rahasia-kuat-123', 'password_confirmation' => 'rahasia-kuat-123',
            ])->assertForbidden();

            $this->actingAs($actor)->put(route('doctors.update', $doctor), [
                'name' => 'x', 'email' => 'x@example.com', 'is_active' => true,
            ])->assertForbidden();
        }
    }

    // ---------------------------------------------------------------------
    // Validation
    // ---------------------------------------------------------------------

    public function test_duplicate_email_is_rejected_on_create(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = $this->admin($clinic);
        User::factory()->create(['email' => 'taken@example.com']);

        $this->actingAs($admin)->post(route('doctors.store'), [
            'name' => 'dr. Dup',
            'email' => 'taken@example.com',
            'password' => 'rahasia-kuat-123',
            'password_confirmation' => 'rahasia-kuat-123',
        ])->assertSessionHasErrors('email');
    }

    public function test_mismatched_password_confirmation_is_rejected(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = $this->admin($clinic);

        $this->actingAs($admin)->post(route('doctors.store'), [
            'name' => 'dr. Mismatch',
            'email' => 'mismatch@example.com',
            'password' => 'rahasia-kuat-123',
            'password_confirmation' => 'beda-beda-456',
        ])->assertSessionHasErrors('password');
    }

    public function test_required_fields_are_rejected(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = $this->admin($clinic);

        $this->actingAs($admin)->post(route('doctors.store'), [])
            ->assertSessionHasErrors(['name', 'email', 'password']);
    }

    public function test_update_rejects_email_belonging_to_another_user(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = $this->admin($clinic);
        $other = User::factory()->create(['email' => 'other@example.com']);
        $doctor = Doctor::factory()->create(['clinic_id' => $clinic->id]);

        $this->actingAs($admin)->put(route('doctors.update', $doctor), [
            'name' => 'dr. X',
            'email' => 'other@example.com',
            'password' => '',
            'password_confirmation' => '',
            'is_active' => true,
        ])->assertSessionHasErrors('email');
    }

    public function test_update_allows_keeping_own_email(): void
    {
        $clinic = Clinic::factory()->create();
        $admin = $this->admin($clinic);
        $user = User::factory()->doctor()->create(['clinic_id' => $clinic->id, 'email' => 'self@example.com']);
        $doctor = Doctor::factory()->create(['clinic_id' => $clinic->id, 'user_id' => $user->id]);

        $this->actingAs($admin)->put(route('doctors.update', $doctor), [
            'name' => 'dr. Self',
            'email' => 'self@example.com',
            'password' => '',
            'password_confirmation' => '',
            'is_active' => true,
        ])->assertRedirect(route('doctors.index'))->assertSessionHasNoErrors();
    }

    // ---------------------------------------------------------------------
    // No destroy endpoint (deactivate-only policy)
    // ---------------------------------------------------------------------

    public function test_there_is_no_destroy_route_or_action_for_doctors(): void
    {
        $this->assertFalse(Route::has('doctors.destroy'));

        $destroyRoutes = collect(Route::getRoutes())->filter(function ($route) {
            return str_starts_with((string) $route->getName(), 'doctors.')
                && in_array('DELETE', $route->methods(), true);
        });

        $this->assertCount(0, $destroyRoutes, 'A doctors delete route must not exist.');
    }
}
