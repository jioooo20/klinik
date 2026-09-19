<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kontrak route `welcome` (GET /).
 *
 * Route `/` sengaja didefinisikan sebagai redirector (lihat routes/web.php):
 * tamu diarahkan ke halaman login, sedangkan pengguna yang sudah login
 * diarahkan ke route `dashboard`. Test ini mengunci perilaku tersebut.
 */
class WelcomeRedirectTest extends TestCase
{
    use RefreshDatabase;

    /** Tamu (belum login) yang membuka `/` harus diarahkan ke halaman login. */
    public function test_guests_are_redirected_from_root_to_login(): void
    {
        $response = $this->get('/');

        $response->assertRedirect(route('login'));
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
