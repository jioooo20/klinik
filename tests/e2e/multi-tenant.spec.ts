import { test, expect } from '@playwright/test';
import { USERS, login } from './support/auth';

test.describe('Multi-Tenant Isolation (KLK-017)', () => {
    test('clinic A admin cannot access clinic B patient data @KLK-017', async ({ page }) => {
        await login(page, 'admin');

        // Patient id 11 belongs to clinic B (see seed-tenant.php).
        // The BelongsToClinic global scope filters route-model binding,
        // so a foreign record returns 404 "Not Found" instead of 403.
        const clinicBPatientId = 11;
        await page.goto(`/patients/${clinicBPatientId}`);

        // The BelongsToClinic global scope makes foreign patients invisible to
        // route-model binding, so the app returns a 404 "Not Found" page.
        // Assert on the heading inside <main> to avoid strict-mode clashes.
        await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    });

    test('clinic B admin can access own data', async ({ page }) => {
        await login(page, 'adminB');

        // Admin B should be able to see clinic B patients.
        await page.goto('/patients');
        await expect(page.getByText('Daftar Pasien')).toBeVisible();
        // Clinic B only has one patient: "Pasien Klinik B".
        await expect(page.getByText('Pasien Klinik B')).toBeVisible();
    });
});