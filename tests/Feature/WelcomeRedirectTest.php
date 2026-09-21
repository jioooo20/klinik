<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Kontrak route `welcome` (GET /).
 *
 * Route `/` dirender sebagai halaman publik (landing page) untuk tamu,
 * sedangkan pengguna yang sudah login diarahkan ke route `dashboard`.
 * Test ini mengunci perilaku tersebut.
 */
class WelcomeRedirectTest extends TestCase
{
    use RefreshDatabase;

    /** Tamu (belum login) yang membuka `/` melihat landing page publik. */
    public function test_guests_see_the_public_landing_page_at_root(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page->component('Landing/Index'));
    }

    /** Pengguna yang sudah login yang membuka `/` harus diarahkan ke dashboard. */
    public function test_authenticated_users_are_redirected_from_root_to_dashboard(): void
    {
        $clinic = Clinic::factory()->create();
        $user = User::factory()->admin()->create(['clinic_id' => $clinic->id]);

        $response = $this->actingAs($user)->get('/');

        $response->assertRedirect(route('dashboard'));
    }
}