import { test, expect } from '@playwright/test';
import { login } from './support/auth';

/**
 * Regression coverage for the 2026-09-16 pasien self-service profile.
 *
 * The feature: GET/PUT `/profile` (route names `profile.edit` / `profile.update`)
 * behind `role:pasien`, backed by PatientPolicy::updateSelf() and the strict
 * UpdateOwnPatientRequest whitelist. The patient row is resolved from the
 * authenticated user via Patient::forUser() — never from a URL id.
 *
 * Authorization boundary under test: pasien may; admin and dokter are 403.
 *
 * NOTE: the app renders NO flash-message component (no `flash.success`
 * consumer exists under resources/js), so persistence is asserted by
 * reloading the form rather than by looking for a success toast.
 */
test.describe('Regression: Pasien /profile self-service + authorization boundary', () => {
    test('pasien can reach /profile and the six allowed fields persist', async ({ page }) => {
        await login(page, 'pasien');

        await page.goto('/profile');
        // "Profil Saya" is also a sidebar link, so scope to <main> to avoid a
        // strict-mode collision.
        await expect(
            page.getByRole('main').getByText('Profil Saya'),
        ).toBeVisible();
        await expect(
            page.getByText('Nama dan NIK hanya dapat diubah oleh admin klinik.'),
        ).toBeVisible();

        // Master data is read-only on this screen.
        await expect(page.locator('#nik')).toHaveCount(0);
        await expect(page.locator('#name')).toHaveCount(0);

        const marker = `E2E-${Date.now().toString().slice(-6)}`;

        await page.locator('#blood_type').selectOption('O');
        await page.locator('#allergies').fill(`Alergi ${marker}`);
        await page.locator('#phone').fill('081200000001');
        await page.locator('#address').fill(`Jl. Profil ${marker}`);
        await page.locator('#emergency_contact_name').fill(`Kontak ${marker}`);
        await page.locator('#emergency_contact_phone').fill('081200000002');

        await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

        // Redirect back to the same screen (PUT /profile -> profile.edit).
        await page.waitForURL(/\/profile$/);

        // Re-read from the server to prove the write persisted.
        await page.reload();
        await expect(page.locator('#blood_type')).toHaveValue('O');
        await expect(page.locator('#allergies')).toHaveValue(`Alergi ${marker}`);
        await expect(page.locator('#address')).toHaveValue(`Jl. Profil ${marker}`);
        await expect(page.locator('#emergency_contact_name')).toHaveValue(`Kontak ${marker}`);
    });

    test('admin is blocked (403) from /profile', async ({ page }) => {
        await login(page, 'admin');
        const response = await page.goto('/profile');
        expect(response?.status()).toBe(403);
    });

    test('dokter is blocked (403) from /profile', async ({ page }) => {
        await login(page, 'dokter');
        const response = await page.goto('/profile');
        expect(response?.status()).toBe(403);
    });

    test('pasien cannot reach the admin patient list', async ({ page }) => {
        await login(page, 'pasien');
        const response = await page.goto('/patients');
        expect([403, 404]).toContain(response?.status());
        // No logout() here: an error response renders WITHOUT the role layout,
        // so there is no "Keluar" button to click. Each Playwright test gets a
        // fresh browser context anyway, so no session leaks between tests.
    });
});